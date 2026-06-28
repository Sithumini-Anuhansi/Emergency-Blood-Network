const mongoose = require("mongoose");

const temperatureLogSchema = new mongoose.Schema(
  {
    bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: "BloodBank", required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number },
    timestamp: { type: Date, default: Date.now },
    alertTriggered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TemperatureLog", temperatureLogSchema);