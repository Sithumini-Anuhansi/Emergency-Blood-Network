import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios";

const COLORS = ["#dc2626", "#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#06b6d4", "#64748b"];

const OverviewTab = () => {
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [donorGrowth, setDonorGrowth] = useState([]);
  const [demandByDistrict, setDemandByDistrict] = useState([]);
  const [temperatureTrends, setTemperatureTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reqRes, donorRes, hospRes, growthRes, demandRes, tempRes] = await Promise.all([
          api.get("/requests"),
          api.get("/donors/all?limit=1000"),
          api.get("/hospitals"),
          api.get("/analytics/donor-growth"),
          api.get("/analytics/demand-by-district"),
          api.get("/analytics/temperature-trends"),
        ]);
        setRequests(reqRes.data);
        setDonors(donorRes.data.donors);
        setHospitals(hospRes.data);
        setDonorGrowth(growthRes.data);
        setDemandByDistrict(demandRes.data);
        setTemperatureTrends(tempRes.data);
      } catch (err) {
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading analytics...</p>;

  // Requests by status
  const statusCounts = ["pending", "matched", "fulfilled", "cancelled"].map((status) => ({
    name: status,
    value: requests.filter((r) => r.requestStatus === status).length,
  }));

  // Donors by blood group
  const bloodGroupCounts = {};
  donors.forEach((d) => {
    bloodGroupCounts[d.bloodGroup] = (bloodGroupCounts[d.bloodGroup] || 0) + 1;
  });
  const bloodGroupData = Object.entries(bloodGroupCounts).map(([name, value]) => ({ name, value }));

  // Requests by urgency
  const urgencyCounts = ["low", "medium", "high", "critical"].map((urgency) => ({
    name: urgency,
    value: requests.filter((r) => r.urgency === urgency).length,
  }));

  const topStats = [
    { label: "Total Donors", value: donors.length },
    { label: "Total Hospitals", value: hospitals.length },
    { label: "Total Requests", value: requests.length },
    { label: "Fulfilled", value: requests.filter((r) => r.requestStatus === "fulfilled").length },
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Stat row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Donors", value: donors.length, color: "#dc2626" },
          { label: "Total Hospitals", value: hospitals.length, color: "#2563eb" },
          { label: "Total Requests", value: requests.length, color: "#7c3aed" },
          { label: "Fulfilled", value: requests.filter(r => r.requestStatus === "fulfilled").length, color: "#059669" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4" style={{ borderLeft: `3px solid ${s.color}` }}>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{s.label}</p>
            <p className="num text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts grid — 2x2, fixed heights */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 card-admin flex flex-col">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Requests by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 card-donor flex flex-col">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Donors by Blood Group</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bloodGroupData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 card-bank flex flex-col">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Blood Demand by District</h3>
          {demandByDistrict.length === 0 ? (
            <p className="text-slate-400 text-xs flex-1 flex items-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={demandByDistrict} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="district" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="totalUnitsRequested" fill="#059669" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 card-hospital flex flex-col">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Donor Growth</h3>
          {donorGrowth.length === 0 ? (
            <p className="text-slate-400 text-xs flex-1 flex items-center">Not enough data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={donorGrowth}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="totalDonors" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;