import { useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencyLevels = ["low", "medium", "high", "critical"];

const CreateRequestModal = ({ isOpen, onClose, onCreated }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { urgency: "medium" },
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await api.post("/requests", {
        patientName: formData.patientName,
        bloodGroup: formData.bloodGroup,
        unitsRequired: Number(formData.unitsRequired),
        urgency: formData.urgency,
        district: formData.district || undefined,
      });
      toast.success("Blood request created");
      reset();
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Blood Request">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className={labelClass}>Patient Name</label>
          <input {...register("patientName", { required: "Required" })} className={inputClass} />
          {errors.patientName && <p className="text-red-500 text-xs mt-1">{errors.patientName.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Blood Group</label>
            <select {...register("bloodGroup", { required: "Required" })} className={inputClass}>
              <option value="">Select</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
            {errors.bloodGroup && <p className="text-red-500 text-xs mt-1">{errors.bloodGroup.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Units Required</label>
            <input
              type="number"
              min={1}
              {...register("unitsRequired", { required: "Required", min: { value: 1, message: "At least 1" } })}
              className={inputClass}
            />
            {errors.unitsRequired && <p className="text-red-500 text-xs mt-1">{errors.unitsRequired.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Urgency</label>
          <select {...register("urgency")} className={inputClass}>
            {urgencyLevels.map((u) => (
              <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>District (optional — defaults to your hospital's district)</label>
          <input {...register("district")} className={inputClass} placeholder="e.g. Gampaha" />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </Modal>
  );
};

export default CreateRequestModal;