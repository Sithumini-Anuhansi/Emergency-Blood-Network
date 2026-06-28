const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    hospitalName: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hospital", hospitalSchema);