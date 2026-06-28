import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import StatusBadge from "../../components/StatusBadge";
import AddInventoryModal from "./AddInventoryModal";

const bloodGroupOrder = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const BloodBankDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/inventory/mine");
      setInventory(data.inventory);
      setSummary(data.summary);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleMarkUsed = async (id) => {
    try {
      await api.put(`/inventory/${id}`, { unitsAvailable: 0, status: "used" });
      toast.success("Batch marked as used");
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const handleCheckExpired = async () => {
    try {
      const { data } = await api.put("/inventory/check-expired");
      toast.success(`${data.modifiedCount} batch(es) marked expired`);
      fetchInventory();
    } catch (err) {
      toast.error("Failed to check expired batches");
    }
  };

  const isExpiringSoon = (expiryDate) => {
    const daysLeft = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 5;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Blood Bank Dashboard" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stock summary by blood group */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Stock Summary</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
          {bloodGroupOrder.map((bg) => (
            <div key={bg} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
              <p className="text-sm font-bold text-brand-600">{bg}</p>
              <p className="text-xl font-bold text-gray-700">{summary[bg] || 0}</p>
              <p className="text-xs text-gray-400">units</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Inventory Batches</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCheckExpired}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"
            >
              Check Expired
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Add Batch
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-400 text-sm">Loading...</p>
          ) : inventory.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No inventory batches yet. Add one to get started.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Blood Group</th>
                  <th className="px-4 py-3 font-medium">Units</th>
                  <th className="px-4 py-3 font-medium">Collected</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Temp (°C)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((batch) => (
                  <tr key={batch._id} className={isExpiringSoon(batch.expiryDate) ? "bg-orange-50" : ""}>
                    <td className="px-4 py-3 font-semibold text-brand-600">{batch.bloodGroup}</td>
                    <td className="px-4 py-3 text-gray-700">{batch.unitsAvailable}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(batch.collectionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(batch.expiryDate).toLocaleDateString()}
                      {isExpiringSoon(batch.expiryDate) && (
                        <span className="text-orange-500 text-xs ml-1">⚠ soon</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{batch.storageTemperature}</td>
                    <td className="px-4 py-3"><StatusBadge value={batch.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {batch.status === "available" && (
                        <button
                          onClick={() => handleMarkUsed(batch._id)}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Mark Used
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

      <AddInventoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchInventory}
      />
    </div>
  );
};

export default BloodBankDashboard;