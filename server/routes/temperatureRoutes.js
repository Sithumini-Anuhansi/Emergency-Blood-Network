const express = require("express");
const router = express.Router();
const { simulateReading, getMyTemperatureHistory, getAllTemperatureLogs } = require("../controllers/temperatureController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/simulate", protect, authorize("bloodbank"), simulateReading);
router.get("/mine", protect, authorize("bloodbank"), getMyTemperatureHistory);
router.get("/", protect, authorize("admin"), getAllTemperatureLogs);

module.exports = router;