import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import StatusBadge from "../../components/StatusBadge";
import CreateRequestModal from "./CreateRequestModal";

const HospitalDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/requests/mine");
      setRequests(data);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await api.put(`/requests/${id}/cancel`);
      toast.success("Request cancelled");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.requestStatus === "pending").length,
    matched: requests.filter((r) => r.requestStatus === "matched").length,
    fulfilled: requests.filter((r) => r.requestStatus === "fulfilled").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Hospital Dashboard" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Requests", value: stats.total, color: "text-gray-700" },
            { label: "Pending", value: stats.pending, color: "text-yellow-600" },
            { label: "Matched", value: stats.matched, color: "text-blue-600" },
            { label: "Fulfilled", value: stats.fulfilled, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Your Blood Requests</h2>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + New Request
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-400 text-sm">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No requests yet. Create one to get started.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Blood Group</th>
                  <th className="px-4 py-3 font-medium">Units</th>
                  <th className="px-4 py-3 font-medium">Urgency</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned Donor</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3 text-gray-700">{r.patientName}</td>
                    <td className="px-4 py-3 font-semibold text-brand-600">{r.bloodGroup}</td>
                    <td className="px-4 py-3 text-gray-700">{r.unitsRequired}</td>
                    <td className="px-4 py-3"><StatusBadge value={r.urgency} /></td>
                    <td className="px-4 py-3"><StatusBadge value={r.requestStatus} /></td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.assignedDonor ? r.assignedDonor.userId?.fullName : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.requestStatus === "pending" && (
                        <button
                          onClick={() => handleCancel(r._id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Cancel
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

      <CreateRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchRequests}
      />
    </div>
  );
};

export default HospitalDashboard;