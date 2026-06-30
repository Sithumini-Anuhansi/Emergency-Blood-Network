const express = require("express");
const router = express.Router();
const { getDonorGrowth, getDemandByDistrict, getTemperatureTrends } = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/donor-growth", protect, authorize("admin"), getDonorGrowth);
router.get("/demand-by-district", protect, authorize("admin"), getDemandByDistrict);
router.get("/temperature-trends", protect, authorize("admin"), getTemperatureTrends);

module.exports = router;