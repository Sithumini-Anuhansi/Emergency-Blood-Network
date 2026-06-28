const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    nic: { type: String, required: true, unique: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    age: { type: Number, required: true, min: 16, max: 70 },
    weight: { type: Number, required: true },
    height: { type: Number },
    lastDonationDate: { type: Date, default: null },
    hemoglobin: { type: Number },
    medicalConditions: { type: [String], default: [] },
    availability: { type: Boolean, default: true },
    eligibility: { type: Boolean, default: true },
    profilePhoto: { type: String, default: "" },
    totalDonations: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donor", donorSchema);