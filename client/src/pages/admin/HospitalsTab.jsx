import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";

const HospitalsTab = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(""); // "", "true", "false"

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "") params.approved = filter;
      const { data } = await api.get("/hospitals", { params });
      setHospitals(data);
    } catch (err) {
      toast.error("Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/hospitals/${id}/approve`);
      toast.success("Hospital approved");
      fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    }
  };

  const selectClass =
    "px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClass}>
          <option value="">All Hospitals</option>
          <option value="false">Pending Approval</option>
          <option value="true">Approved</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400 text-sm">Loading...</p>
        ) : hospitals.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">No hospitals match this filter.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Hospital Name</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hospitals.map((h) => (
                <tr key={h._id}>
                  <td className="px-4 py-3 text-gray-700 font-medium">{h.hospitalName}</td>
                  <td className="px-4 py-3 text-gray-500">{h.district}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {h.userId?.email}
                    <br />
                    <span className="text-xs text-gray-400">{h.phone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={h.approved ? "fulfilled" : "pending"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!h.approved && (
                      <button
                        onClick={() => handleApprove(h._id)}
                        className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HospitalsTab;