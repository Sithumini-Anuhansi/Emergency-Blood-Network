import { useAuth } from "../../context/AuthContext";

const DonorDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.fullName}</h1>
        <button onClick={logout} className="text-sm text-brand-600 hover:underline">
          Logout
        </button>
      </div>
      <p className="text-gray-500">Donor dashboard — full profile, donation history, and availability toggle coming in the next step.</p>
    </div>
  );
};

export default DonorDashboard;