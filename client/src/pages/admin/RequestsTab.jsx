import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

const RequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", urgency: "", bloodGroup: "" });
  const [assignModal, setAssignModal] = useState(null); // holds the request being assigned
  const [matchingDonors, setMatchingDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.urgency) params.urgency = filters.urgency;
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;

      const { data } = await api.get("/requests", { params });
      setRequests(data);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const openAssignModal = async (request) => {
    setAssignModal(request);
    setLoadingDonors(true);
    try {
      const { data } = await api.get("/donors", {
        params: { bloodGroup: request.bloodGroup, district: request.district, availability: true, eligibility: true },
      });
      setMatchingDonors(data.donors);
    } catch (err) {
      toast.error("Failed to load matching donors");
    } finally {
      setLoadingDonors(false);
    }
  };

  const handleAssign = async (donorId) => {
    try {
      await api.put(`/requests/${assignModal._id}/assign`, { donorId });
      toast.success("Donor assigned");
      setAssignModal(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign donor");
    }
  };

  const handleFulfill = async (id) => {
    try {
      await api.put(`/requests/${id}/fulfill`);
      toast.success("Request marked fulfilled");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fulfill");
    }
  };

  const selectClass = "px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className={selectClass}
        >
          <option value="">All Statuses</option>
          {["pending", "matched", "fulfilled", "cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.urgency}
          onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
          className={selectClass}
        >
          <option value="">All Urgency</option>
          {["low", "medium", "high", "critical"].map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <select
          value={filters.bloodGroup}
          onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
          className={selectClass}
        >
          <option value="">All Blood Groups</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400 text-sm">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">No requests match these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Hospital</th>
                <th className="px-4 py-3 font-medium">Blood Group</th>
                <th className="px-4 py-3 font-medium">Urgency</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3 text-gray-700">{r.patientName}</td>
                  <td className="px-4 py-3 text-gray-500">{r.hospitalId?.hospitalName}</td>
                  <td className="px-4 py-3 font-semibold text-brand-600">{r.bloodGroup}</td>
                  <td className="px-4 py-3"><StatusBadge value={r.urgency} /></td>
                  <td className="px-4 py-3"><StatusBadge value={r.requestStatus} /></td>
                  <td className="px-4 py-3 text-gray-500">{r.assignedDonor?.userId?.fullName || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {r.requestStatus === "pending" && (
                      <button onClick={() => openAssignModal(r)} className="text-xs text-brand-600 hover:underline mr-3">
                        Assign Donor
                      </button>
                    )}
                    {r.requestStatus === "matched" && (
                      <button onClick={() => handleFulfill(r._id)} className="text-xs text-green-600 hover:underline">
                        Mark Fulfilled
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Donor Modal */}
      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Donor — ${assignModal?.bloodGroup} for ${assignModal?.patientName}`}>
        {loadingDonors ? (
          <p className="text-gray-400 text-sm">Finding matching donors...</p>
        ) : matchingDonors.length === 0 ? (
          <p className="text-gray-400 text-sm">No available, eligible donors match this blood group and district.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {matchingDonors.map((d) => (
              <div key={d._id} className="flex justify-between items-center border border-gray-100 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-700 text-sm">{d.userId?.fullName}</p>
                  <p className="text-xs text-gray-400">{d.userId?.district} · {d.userId?.phone}</p>
                </div>
                <button
                  onClick={() => handleAssign(d._id)}
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RequestsTab;