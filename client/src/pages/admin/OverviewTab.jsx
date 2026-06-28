import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios";

const COLORS = ["#dc2626", "#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#06b6d4", "#64748b"];

const OverviewTab = () => {
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reqRes, donorRes, hospRes] = await Promise.all([
          api.get("/requests"),
          api.get("/donors/all?limit=1000"),
          api.get("/hospitals"),
        ]);
        setRequests(reqRes.data);
        setDonors(donorRes.data.donors);
        setHospitals(hospRes.data);
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
      </div>
    </div>
  );
};

export default OverviewTab;