import { Link } from "react-router-dom";

const Unauthorized = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-3xl font-bold text-brand-700 mb-2">Access Denied</h1>
    <p className="text-gray-500 mb-6">You don't have permission to view this page.</p>
    <Link to="/login" className="text-brand-600 font-medium hover:underline">
      Back to login
    </Link>
  </div>
);

export default Unauthorized;