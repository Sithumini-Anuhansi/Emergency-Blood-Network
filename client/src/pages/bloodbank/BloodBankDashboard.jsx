import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Droplets, Plus, Thermometer, Package, CheckCircle } from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import AddInventoryModal from "./AddInventoryModal";
import TemperatureMonitor from "./TemperatureMonitor";

const ACCENT = "#059669";
const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const navItems = [
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "temperature", label: "Cold-Chain Monitor", icon: Thermometer },
];

const BloodBankDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("inventory");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/inventory/mine");
      setInventory(data.inventory);
      setSummary(data.summary);
    } catch { toast.error("Failed to load inventory"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleMarkUsed = async (id) => {
    try {
      await api.put(`/inventory/${id}`, { unitsAvailable: 0, status: "used" });
      toast.success("Batch marked as used");
      fetchInventory();
    } catch { toast.error("Failed to update"); }
  };

  const handleCheckExpired = async () => {
    try {
      const { data } = await api.put("/inventory/check-expired");
      toast.success(`${data.modifiedCount} batch(es) marked expired`);
      fetchInventory();
    } catch { toast.error("Failed to check expired batches"); }
  };

  const totalUnits = Object.values(summary).reduce((a, b) => a + b, 0);
  const availableCount = inventory.filter(i => i.status === "available").length;
  const expiredCount = inventory.filter(i => i.status === "expired").length;
  const expiringSoon = inventory.filter(i => {
    const days = (new Date(i.expiryDate) - new Date()) / 86400000;
    return days >= 0 && days <= 5;
  }).length;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <DashboardLayout navItems={navItems} activeSection={section} onSectionChange={setSection}>
      {section === "inventory" && (
        <div className="h-full flex flex-col gap-4">
          {/* Stat row */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Total Units" value={totalUnits} icon={Droplets} accent={ACCENT} />
            <StatCard label="Available Batches" value={availableCount} icon={CheckCircle} accent={ACCENT} />
            <StatCard label="Expiring Soon" value={expiringSoon} icon={Package} accent="#f59e0b" />
            <StatCard label="Expired" value={expiredCount} icon={Package} accent="#ef4444" />
          </div>

          {/* Blood group stock grid */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 card-bank">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">Stock by Blood Group</p>
            <div className="grid grid-cols-8 gap-2">
              {BLOOD_GROUPS.map(bg => (
                <div key={bg} className="text-center bg-slate-50 rounded-lg p-2">
                  <p className="num font-bold text-emerald-600 text-sm">{bg}</p>
                  <p className="num text-lg font-bold text-slate-800">{summary[bg] || 0}</p>
                  <p className="text-xs text-slate-400">units</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">Inventory Batches</h2>
              <div className="flex gap-2">
                <button onClick={handleCheckExpired} className="text-xs text-slate-500 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                  Check Expired
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Plus size={12} /> Add Batch
                </button>
              </div>
            </div>
            {inventory.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No inventory batches. Add one to get started.</div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="ebn-table">
                  <thead>
                    <tr><th>Blood Group</th><th>Units</th><th>Collected</th><th>Expires</th><th>Temp (°C)</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {inventory.map(batch => {
                      const daysLeft = (new Date(batch.expiryDate) - new Date()) / 86400000;
                      const expiring = daysLeft >= 0 && daysLeft <= 5;
                      return (
                        <tr key={batch._id} className={expiring ? "bg-amber-50" : ""}>
                          <td><span className="num font-bold text-emerald-600">{batch.bloodGroup}</span></td>
                          <td className="num">{batch.unitsAvailable}</td>
                          <td className="num text-slate-400">{new Date(batch.collectionDate).toLocaleDateString()}</td>
                          <td className="num text-slate-400">
                            {new Date(batch.expiryDate).toLocaleDateString()}
                            {expiring && <span className="ml-1 text-amber-500 text-xs">⚠</span>}
                          </td>
                          <td className={`num ${batch.storageTemperature > 6 ? "text-red-600 font-bold" : "text-slate-600"}`}>
                            {batch.storageTemperature}°
                          </td>
                          <td><StatusBadge value={batch.status} /></td>
                          <td>
                            {batch.status === "available" && (
                              <button onClick={() => handleMarkUsed(batch._id)} className="text-xs text-slate-400 hover:underline">Mark Used</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {section === "temperature" && <TemperatureMonitor />}

      <AddInventoryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={fetchInventory} />
    </DashboardLayout>
  );
};

export default BloodBankDashboard;