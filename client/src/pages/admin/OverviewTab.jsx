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
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topStats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-700">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Requests by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {statusCounts.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Donors by Blood Group</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bloodGroupData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Requests by Urgency</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={urgencyCounts} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Donor Growth Over Time</h3>
          {donorGrowth.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Not enough historical data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={donorGrowth}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="totalDonors" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} name="Total Donors" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Blood Demand by District</h3>
          {demandByDistrict.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No requests recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={demandByDistrict} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="district" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="totalUnitsRequested" fill="#a855f7" radius={[0, 4, 4, 0]} name="Units Requested" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Cold-Chain Temperature Trends (Daily Average)</h3>
          {temperatureTrends.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">
              No temperature readings yet. Use the Blood Bank dashboard's "Simulate Reading" button or run the IoT simulator script.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={temperatureTrends}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <ReferenceLine y={6} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Alert threshold", position: "insideTopRight", fontSize: 10, fill: "#dc2626" }} />
                <Line type="monotone" dataKey="avgTemp" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Avg Temp (°C)" />
                <Line type="monotone" dataKey="maxTemp" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Max Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;