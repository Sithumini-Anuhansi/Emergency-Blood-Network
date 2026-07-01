import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Activity, Plus, ClipboardList, Building2, CheckCircle, XCircle, Clock } from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import CreateRequestModal from "./CreateRequestModal";

const ACCENT = "#2563eb";

const navItems = [
  { id: "requests", label: "Blood Requests", icon: ClipboardList },
  { id: "profile", label: "Hospital Profile", icon: Building2 },
];

const HospitalDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("requests");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, hRes] = await Promise.all([
        api.get("/requests/mine"),
        api.get("/hospitals/me"),
      ]);
      setRequests(rRes.data);
      setHospital(hRes.data);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await api.put(`/requests/${id}/cancel`);
      toast.success("Request cancelled");
      fetchData();
    } catch { toast.error("Failed to cancel"); }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.requestStatus === "pending").length,
    matched: requests.filter(r => r.requestStatus === "matched").length,
    fulfilled: requests.filter(r => r.requestStatus === "fulfilled").length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <DashboardLayout navItems={navItems} activeSection={section} onSectionChange={setSection}>
      {section === "requests" && (
        <div className="h-full flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Total" value={stats.total} icon={Activity} accent={ACCENT} />
            <StatCard label="Pending" value={stats.pending} icon={Clock} accent="#f59e0b" />
            <StatCard label="Matched" value={stats.matched} icon={CheckCircle} accent={ACCENT} />
            <StatCard label="Fulfilled" value={stats.fulfilled} icon={CheckCircle} accent="#10b981" />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">Blood Requests</h2>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-white px-3 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: ACCENT }}
              >
                <Plus size={14} /> New Request
              </button>
            </div>
            {requests.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No requests yet. Create one to get started.</div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="ebn-table">
                  <thead>
                    <tr>
                      <th>Patient</th><th>Blood Group</th><th>Units</th><th>Urgency</th><th>Status</th><th>Assigned Donor</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r._id}>
                        <td className="font-medium">{r.patientName}</td>
                        <td><span className="num font-bold text-blue-600">{r.bloodGroup}</span></td>
                        <td className="num">{r.unitsRequired}</td>
                        <td><StatusBadge value={r.urgency} /></td>
                        <td><StatusBadge value={r.requestStatus} /></td>
                        <td className="text-slate-400">{r.assignedDonor?.userId?.fullName || "—"}</td>
                        <td>
                          {r.requestStatus === "pending" && (
                            <button onClick={() => handleCancel(r._id)} className="text-xs text-red-500 hover:underline">Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {section === "profile" && hospital && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 card-hospital max-w-lg">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-4">Hospital Profile</p>
          <h2 className="text-xl font-bold text-slate-800 mb-1">{hospital.hospitalName}</h2>
          <p className="text-sm text-slate-500 mb-4">{hospital.address}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "District", val: hospital.district },
              { label: "Phone", val: hospital.phone },
              { label: "Email", val: hospital.email },
              { label: "Status", val: hospital.approved ? "Approved" : "Pending Approval" },
            ].map(f => (
              <div key={f.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">{f.label}</p>
                <p className="text-sm font-semibold text-slate-700">{f.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={fetchData} />
    </DashboardLayout>
  );
};

export default HospitalDashboard;