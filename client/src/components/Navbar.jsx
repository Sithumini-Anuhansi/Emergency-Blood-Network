import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const roleLabels = {
  donor: "Donor",
  hospital: "Hospital",
  bloodbank: "Blood Bank",
  admin: "Admin",
};

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-brand-700">Emergency Blood Network</h1>
        {title && <p className="text-sm text-gray-400">{title}</p>}
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
          <p className="text-xs text-gray-400">{roleLabels[user?.role]}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;