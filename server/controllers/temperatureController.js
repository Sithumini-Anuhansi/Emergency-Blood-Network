const TemperatureLog = require("../models/TemperatureLog");
const BloodBank = require("../models/BloodBank");
const Notification = require("../models/Notification");
const User = require("../models/User");

const ALERT_THRESHOLD_CELSIUS = 6.0;

// @desc    Simulate a new sensor reading for the logged-in blood bank's storage unit
//          (in production this would come from a real IoT device posting here instead)
// @route   POST /api/temperature/simulate
// @access  Private (bloodbank)
const simulateReading = async (req, res, next) => {
  try {
    const bank = await BloodBank.findOne({ userId: req.user._id });
    if (!bank) {
      res.status(404);
      throw new Error("Blood bank profile not found for this account");
    }

    // Simulated sensor noise: normally tight around 4°C, occasionally spikes
    // to mimic a real cold-chain excursion (door left open, fridge fault, etc.)
    const isExcursion = Math.random() < 0.1;
    const temperature = isExcursion
      ? +(6.1 + Math.random() * 3).toFixed(1)
      : +(2 + Math.random() * 4).toFixed(1);
    const humidity = +(40 + Math.random() * 20).toFixed(1);

    const alertTriggered = temperature > ALERT_THRESHOLD_CELSIUS;

    const log = await TemperatureLog.create({
      bloodBankId: bank._id,
      temperature,
      humidity,
      alertTriggered,
    });

    if (alertTriggered) {
      await Notification.create({
        receiverId: req.user._id,
        title: "Cold-Chain Temperature Alert",
        message: `Storage temperature reached ${temperature}°C, above the safe threshold of ${ALERT_THRESHOLD_CELSIUS}°C. Please check your refrigeration unit.`,
      });

      // Also alert admins so this doesn't go unnoticed if blood bank staff miss it
      const admins = await User.find({ role: "admin" });
      await Promise.all(
        admins.map((admin) =>
          Notification.create({
            receiverId: admin._id,
            title: "Cold-Chain Alert — " + bank.bloodBankName,
            message: `${bank.bloodBankName} reported a temperature excursion: ${temperature}°C.`,
          })
        )
      );
    }

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in blood bank's temperature history
// @route   GET /api/temperature/mine?limit=50
// @access  Private (bloodbank)
const getMyTemperatureHistory = async (req, res, next) => {
  try {
    const bank = await BloodBank.findOne({ userId: req.user._id });
    if (!bank) {
      res.status(404);
      throw new Error("Blood bank profile not found for this account");
    }

    const limit = parseInt(req.query.limit) || 50;
    const logs = await TemperatureLog.find({ bloodBankId: bank._id })
      .sort({ timestamp: -1 })
      .limit(limit);

    const alertCount = await TemperatureLog.countDocuments({ bloodBankId: bank._id, alertTriggered: true });

    res.json({ logs, alertCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Get temperature history across all blood banks (admin oversight)
// @route   GET /api/temperature?limit=100
// @access  Private (admin)
const getAllTemperatureLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await TemperatureLog.find()
      .populate("bloodBankId", "bloodBankName district")
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = { simulateReading, getMyTemperatureHistory, getAllTemperatureLogs };