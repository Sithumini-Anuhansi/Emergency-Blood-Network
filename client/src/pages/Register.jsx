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

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: "donor" },
  });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = watch("role");

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        district: formData.district,
      };

      if (formData.role === "donor") {
        payload.profileData = {
          nic: formData.nic,
          bloodGroup: formData.bloodGroup,
          gender: formData.gender,
          age: Number(formData.age),
          weight: Number(formData.weight),
        };
      } else if (formData.role === "hospital") {
        payload.profileData = {
          hospitalName: formData.orgName,
          address: formData.address,
        };
      } else if (formData.role === "bloodbank") {
        payload.profileData = {
          bloodBankName: formData.orgName,
          address: formData.address,
        };
      }

      const user = await registerUser(payload);
      toast.success("Account created successfully");
      navigate(roleHomeMap[user.role] || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-red-500 text-xs mt-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-700">Create an Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the Emergency Blood Network</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className={labelClass}>I am registering as a</label>
            <select {...register("role")} className={inputClass}>
              <option value="donor">Donor</option>
              <option value="hospital">Hospital</option>
              <option value="bloodbank">Blood Bank</option>
            </select>
          </div>

          {/* Common fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name</label>
              <input {...register("fullName", { required: "Required" })} className={inputClass} />
              {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input {...register("phone", { required: "Required" })} className={inputClass} />
              {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" {...register("email", { required: "Required" })} className={inputClass} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 characters" } })}
              className={inputClass}
            />
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>

          <div>
            <label className={labelClass}>District</label>
            <input {...register("district", { required: "Required" })} className={inputClass} placeholder="e.g. Gampaha" />
            {errors.district && <p className={errorClass}>{errors.district.message}</p>}
          </div>

          {/* Donor-specific fields */}
          {selectedRole === "donor" && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-600">Donor Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>NIC</label>
                  <input {...register("nic", { required: "Required" })} className={inputClass} />
                  {errors.nic && <p className={errorClass}>{errors.nic.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Blood Group</label>
                  <select {...register("bloodGroup", { required: "Required" })} className={inputClass}>
                    <option value="">Select</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  {errors.bloodGroup && <p className={errorClass}>{errors.bloodGroup.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Gender</label>
                  <select {...register("gender", { required: "Required" })} className={inputClass}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Age</label>
                  <input type="number" {...register("age", { required: "Required" })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input type="number" {...register("weight", { required: "Required" })} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Hospital / BloodBank shared fields */}
          {(selectedRole === "hospital" || selectedRole === "bloodbank") && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-600">
                {selectedRole === "hospital" ? "Hospital Details" : "Blood Bank Details"}
              </p>
              <div>
                <label className={labelClass}>
                  {selectedRole === "hospital" ? "Hospital Name" : "Blood Bank Name"}
                </label>
                <input {...register("orgName", { required: "Required" })} className={inputClass} />
                {errors.orgName && <p className={errorClass}>{errors.orgName.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input {...register("address", { required: "Required" })} className={inputClass} />
                {errors.address && <p className={errorClass}>{errors.address.message}</p>}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;