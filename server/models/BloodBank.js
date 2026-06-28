const mongoose = require("mongoose");

const bloodBankSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    bloodBankName: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodBank", bloodBankSchema);