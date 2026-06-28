import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import StatusBadge from "../../components/StatusBadge";
import EditProfileModal from "./EditProfileModal";

const DonorDashboard = () => {
  const [donor, setDonor] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donorRes, donationsRes] = await Promise.all([
        api.get("/donors/me"),
        api.get("/donors/me/donations"),
      ]);
      setDonor(donorRes.data);
      setDonations(donationsRes.data);
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const { data } = await api.put("/donors/me", { availability: !donor.availability });
      setDonor(data);
      toast.success(data.availability ? "You're now marked as available" : "You're now marked as unavailable");
    } catch (err) {
      toast.error("Failed to update availability");
    } finally {
      setToggling(false);
    }
  };

  const daysSinceLastDonation = donor?.lastDonationDate
    ? Math.floor((new Date() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Donor Dashboard" />
        <p className="p-8 text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Donor Dashboard" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-800">{donor.userId?.fullName}</h2>
                <span className="bg-brand-100 text-brand-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {donor.bloodGroup}
                </span>
              </div>
              <p className="text-sm text-gray-500">{donor.userId?.district} · {donor.userId?.phone}</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-xs text-gray-400">Age</p>
              <p className="font-semibold text-gray-700">{donor.age}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Weight</p>
              <p className="font-semibold text-gray-700">{donor.weight} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Donations</p>
              <p className="font-semibold text-gray-700">{donor.totalDonations}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Last Donation</p>
              <p className="font-semibold text-gray-700">
                {donor.lastDonationDate
                  ? `${daysSinceLastDonation} day${daysSinceLastDonation === 1 ? "" : "s"} ago`
                  : "Never"}
              </p>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Donation Availability</p>
              <p className="text-sm text-gray-400">
                {donor.availability
                  ? "You're visible to hospitals searching for matches."
                  : "You're hidden from donor searches."}
              </p>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={toggling}
              className={`relative w-14 h-7 rounded-full transition-colors disabled:opacity-50 ${
                donor.availability ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  donor.availability ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Donation history */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Donation History</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {donations.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No donations recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Blood Group</th>
                  <th className="px-4 py-3 font-medium">Units</th>
                  <th className="px-4 py-3 font-medium">Hospital</th>
                  <th className="px-4 py-3 font-medium">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d) => (
                  <tr key={d._id}>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(d.donationDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-600">{d.bloodGroup}</td>
                    <td className="px-4 py-3 text-gray-700">{d.units}</td>
                    <td className="px-4 py-3 text-gray-500">{d.hospitalId?.hospitalName || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={d.eligibilityStatus.replace("_", " ")} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdated={fetchData}
        donor={donor}
      />
    </div>
  );
};

export default DonorDashboard;