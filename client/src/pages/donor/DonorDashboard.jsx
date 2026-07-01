import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { User, Droplets, Calendar, Activity, Clock, Edit2 } from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import EditProfileModal from "./EditProfileModal";

const ACCENT = "#dc2626";

const navItems = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "donations", label: "Donation History", icon: Droplets },
  { id: "profile", label: "My Profile", icon: User },
];

const DonorDashboard = () => {
  const [donor, setDonor] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("overview");
  const [toggling, setToggling] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, donRes] = await Promise.all([
        api.get("/donors/me"),
        api.get("/donors/me/donations"),
      ]);
      setDonor(dRes.data);
      setDonations(donRes.data);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const { data } = await api.put("/donors/me", { availability: !donor.availability });
      setDonor(data);
      toast.success(data.availability ? "You are now available" : "You are now unavailable");
    } catch { toast.error("Failed to update"); }
    finally { setToggling(false); }
  };

  const daysSince = donor?.lastDonationDate
    ? Math.floor((Date.now() - new Date(donor.lastDonationDate)) / 86400000)
    : null;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <DashboardLayout navItems={navItems} activeSection={section} onSectionChange={setSection}>
      {section === "overview" && donor && (
        <div className="h-full flex flex-col gap-4">
          {/* Stat row */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Blood Group" value={donor.bloodGroup} icon={Droplets} accent={ACCENT} />
            <StatCard label="Total Donations" value={donor.totalDonations} icon={Activity} accent={ACCENT} />
            <StatCard label="Days Since Last" value={daysSince ?? "Never"} icon={Calendar} accent={ACCENT} />
            <StatCard label="Weight" value={`${donor.weight} kg`} icon={User} accent={ACCENT} sub={`Hb: ${donor.hemoglobin ?? "—"} g/dL`} />
          </div>

          {/* Profile + Availability cards side by side */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 card-donor flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Donor Profile</p>
                  <p className="text-lg font-bold text-slate-800">{donor.userId?.fullName}</p>
                  <p className="text-sm text-slate-500">{donor.userId?.district} · {donor.userId?.phone}</p>
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Age", val: donor.age },
                  { label: "Gender", val: donor.gender },
                  { label: "NIC", val: donor.nic },
                ].map((f) => (
                  <div key={f.label} className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xs text-slate-400">{f.label}</p>
                    <p className="text-sm font-semibold text-slate-700 num">{f.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 card-donor flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">Donation Availability</p>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${donor.availability ? "border-green-500 text-green-600 bg-green-50" : "border-slate-200 text-slate-400 bg-slate-50"}`}>
                    {donor.availability ? "✓" : "✗"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{donor.availability ? "Available to Donate" : "Currently Unavailable"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{donor.availability ? "You appear in donor searches" : "Hidden from donor searches"}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-600">Toggle availability</span>
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${donor.availability ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${donor.availability ? "translate-x-6" : ""}`} />
                </button>
              </div>

              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-1">Eligibility</p>
                <StatusBadge value={donor.eligibility ? "fulfilled" : "cancelled"} />
              </div>
            </div>
          </div>
        </div>
      )}

      {section === "donations" && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Donation History</h2>
            <p className="text-xs text-slate-400">{donations.length} total donation{donations.length !== 1 ? "s" : ""}</p>
          </div>
          {donations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No donations recorded yet.</div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="ebn-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Blood Group</th><th>Units</th><th>Hospital</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d._id}>
                      <td className="num">{new Date(d.donationDate).toLocaleDateString()}</td>
                      <td><span className="num font-bold text-red-600">{d.bloodGroup}</span></td>
                      <td className="num">{d.units}</td>
                      <td>{d.hospitalId?.hospitalName || "—"}</td>
                      <td><StatusBadge value={d.eligibilityStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {section === "profile" && donor && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 card-donor max-w-lg">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-slate-700">Edit Health Info</h2>
            <button onClick={() => setEditOpen(true)} className="text-sm text-red-600 hover:underline">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Blood Group", val: donor.bloodGroup },
              { label: "Hemoglobin", val: `${donor.hemoglobin ?? "—"} g/dL` },
              { label: "Weight", val: `${donor.weight} kg` },
              { label: "Height", val: donor.height ? `${donor.height} cm` : "—" },
            ].map((f) => (
              <div key={f.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">{f.label}</p>
                <p className="num text-base font-semibold text-slate-700">{f.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} onUpdated={fetchData} donor={donor} />
    </DashboardLayout>
  );
};

export default DonorDashboard;