const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", default: null },
    bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: "BloodBank", default: null },
    donationDate: { type: Date, required: true, default: Date.now },
    units: { type: Number, required: true, default: 1 },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    eligibilityStatus: {
      type: String,
      enum: ["eligible", "not_eligible", "pending_review"],
      default: "eligible",
    },
    // Placeholder hash field for blockchain-simulation step (Phase 6)
    blockchainTxHash: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);