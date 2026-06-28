import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EditProfileModal = ({ isOpen, onClose, onUpdated, donor }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);

  // Repopulate form whenever the modal opens with fresh donor data
  useEffect(() => {
    if (donor) {
      reset({
        bloodGroup: donor.bloodGroup,
        weight: donor.weight,
        height: donor.height,
        hemoglobin: donor.hemoglobin,
      });
    }
  }, [donor, reset]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await api.put("/donors/me", {
        bloodGroup: formData.bloodGroup,
        weight: Number(formData.weight),
        height: formData.height ? Number(formData.height) : undefined,
        hemoglobin: formData.hemoglobin ? Number(formData.hemoglobin) : undefined,
      });
      toast.success("Profile updated");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className={labelClass}>Blood Group</label>
          <select {...register("bloodGroup", { required: "Required" })} className={inputClass}>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
          {errors.bloodGroup && <p className="text-red-500 text-xs mt-1">{errors.bloodGroup.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Weight (kg)</label>
            <input type="number" {...register("weight", { required: "Required" })} className={inputClass} />
            {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Height (cm)</label>
            <input type="number" {...register("height")} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Hemoglobin (g/dL)</label>
          <input type="number" step="0.1" {...register("hemoglobin")} className={inputClass} />
          <p className="text-xs text-gray-400 mt-1">Optional — used by the AI eligibility model later.</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
};

export default EditProfileModal;