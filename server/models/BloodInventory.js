const mongoose = require("mongoose");

const bloodInventorySchema = new mongoose.Schema(
  {
    bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: "BloodBank", required: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    unitsAvailable: { type: Number, required: true, min: 0, default: 0 },
    collectionDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    storageTemperature: { type: Number, default: 4 },
    status: {
      type: String,
      enum: ["available", "reserved", "expired", "used"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodInventory", bloodInventorySchema);