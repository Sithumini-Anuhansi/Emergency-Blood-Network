const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    patientName: { type: String, required: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    unitsRequired: { type: Number, required: true, min: 1 },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    district: { type: String, required: true },
    requestStatus: {
      type: String,
      enum: ["pending", "matched", "fulfilled", "cancelled"],
      default: "pending",
    },
    assignedDonor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);