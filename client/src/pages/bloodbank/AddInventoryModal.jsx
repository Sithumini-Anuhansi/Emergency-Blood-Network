import { useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const AddInventoryModal = ({ isOpen, onClose, onCreated }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { storageTemperature: 4 },
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await api.post("/inventory", {
        bloodGroup: formData.bloodGroup,
        unitsAvailable: Number(formData.unitsAvailable),
        collectionDate: formData.collectionDate,
        expiryDate: formData.expiryDate,
        storageTemperature: Number(formData.storageTemperature),
      });
      toast.success("Inventory batch added");
      reset();
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add inventory");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Inventory Batch">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
            <label className={labelClass}>Units</label>
            <input
              type="number"
              min={1}
              {...register("unitsAvailable", { required: "Required", min: { value: 1, message: "At least 1" } })}
              className={inputClass}
            />
            {errors.unitsAvailable && <p className="text-red-500 text-xs mt-1">{errors.unitsAvailable.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Collection Date</label>
            <input type="date" {...register("collectionDate", { required: "Required" })} className={inputClass} />
            {errors.collectionDate && <p className="text-red-500 text-xs mt-1">{errors.collectionDate.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Expiry Date</label>
            <input type="date" {...register("expiryDate", { required: "Required" })} className={inputClass} />
            {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Storage Temperature (°C)</label>
          <input
            type="number"
            step="0.1"
            {...register("storageTemperature")}
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">Ideal range is 2–6°C. This feeds the IoT cold-chain monitor later.</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
        >
          {submitting ? "Adding..." : "Add Batch"}
        </button>
      </form>
    </Modal>
  );
};

export default AddInventoryModal;