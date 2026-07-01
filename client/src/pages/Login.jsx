import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const roleHomeMap = {
  donor: "/donor/dashboard",
  hospital: "/hospital/dashboard",
  bloodbank: "/bloodbank/dashboard",
  admin: "/admin/dashboard",
};

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const user = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${user.fullName}`);
      navigate(roleHomeMap[user.role] || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0f1f3d] flex-col justify-between p-12">
        <div>
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center mb-8">
            <span className="text-white font-bold text-sm">EBN</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Emergency<br />Blood Network
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-xs">
            Connecting donors, hospitals, and blood banks for faster, smarter emergency response.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { color: "#dc2626", label: "Donors", desc: "Register & donate" },
            { color: "#2563eb", label: "Hospitals", desc: "Request blood" },
            { color: "#059669", label: "Blood Banks", desc: "Manage inventory" },
            { color: "#7c3aed", label: "Admins", desc: "System oversight" },
          ].map(r => (
            <div key={r.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: r.color }} />
              <p className="text-white text-sm font-semibold">{r.label}</p>
              <p className="text-white/40 text-xs">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-8">Enter your credentials to access your portal.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                {...register("email", { required: "Required" })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                {...register("password", { required: "Required" })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0f1f3d] hover:bg-[#162444] text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;