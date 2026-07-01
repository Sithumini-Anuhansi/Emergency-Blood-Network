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
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ROLE_CONFIG = {
  donor:     { color: "#dc2626", label: "Donor" },
  hospital:  { color: "#2563eb", label: "Hospital" },
  bloodbank: { color: "#059669", label: "Blood Bank" },
};

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { role: "donor" } });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const role = watch("role");
  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.donor;

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = { fullName: formData.fullName, email: formData.email, password: formData.password, role: formData.role, phone: formData.phone, district: formData.district };
      if (formData.role === "donor") payload.profileData = { nic: formData.nic, bloodGroup: formData.bloodGroup, gender: formData.gender, age: Number(formData.age), weight: Number(formData.weight) };
      else if (formData.role === "hospital") payload.profileData = { hospitalName: formData.orgName, address: formData.address };
      else if (formData.role === "bloodbank") payload.profileData = { bloodBankName: formData.orgName, address: formData.address };
      const user = await registerUser(payload);
      toast.success("Account created!");
      navigate(roleHomeMap[user.role] || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setSubmitting(false); }
  };

  const inp = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition";
  const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Role selector header */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Create Account</h2>
          <div className="flex gap-2">
            {Object.entries(ROLE_CONFIG).map(([r, c]) => (
              <label
                key={r}
                className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition ${role === r ? "border-current" : "border-slate-200 text-slate-400"}`}
                style={{ color: role === r ? c.color : undefined, borderColor: role === r ? c.color : undefined }}
              >
                <input type="radio" {...register("role")} value={r} className="hidden" />
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: role === r ? c.color : "#cbd5e1" }} />
                <span className="text-sm font-semibold">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Common fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Full Name</label>
              <input {...register("fullName", { required: "Required" })} className={inp} />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input {...register("phone", { required: "Required" })} className={inp} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
          </div>
          <div>
            <label className={lbl}>Email</label>
            <input type="email" {...register("email", { required: "Required" })} className={inp} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Password</label>
              <input type="password" {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 characters" } })} className={inp} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className={lbl}>District</label>
              <input {...register("district", { required: "Required" })} className={inp} placeholder="e.g. Colombo" />
              {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
            </div>
          </div>

          {/* Role-specific fields */}
          {role === "donor" && (
            <div className="bg-red-50 rounded-xl p-4 space-y-3 border border-red-100">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Donor Details</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>NIC</label>
                  <input {...register("nic", { required: "Required" })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Blood Group</label>
                  <select {...register("bloodGroup", { required: "Required" })} className={inp}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Gender</label>
                  <select {...register("gender", { required: "Required" })} className={inp}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Age</label>
                  <input type="number" {...register("age", { required: "Required" })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Weight (kg)</label>
                  <input type="number" {...register("weight", { required: "Required" })} className={inp} />
                </div>
              </div>
            </div>
          )}

          {(role === "hospital" || role === "bloodbank") && (
            <div className="rounded-xl p-4 space-y-3 border" style={{ backgroundColor: roleConf.color + "08", borderColor: roleConf.color + "30" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: roleConf.color }}>
                {role === "hospital" ? "Hospital" : "Blood Bank"} Details
              </p>
              <div>
                <label className={lbl}>{role === "hospital" ? "Hospital Name" : "Blood Bank Name"}</label>
                <input {...register("orgName", { required: "Required" })} className={inp} />
              </div>
              <div>
                <label className={lbl}>Address</label>
                <input {...register("address", { required: "Required" })} className={inp} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm"
            style={{ backgroundColor: roleConf.color }}
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 pb-6">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: roleConf.color }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;