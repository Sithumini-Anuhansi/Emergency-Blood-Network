const express = require("express");
const router = express.Router();
const {
  getMyHospitalProfile,
  updateMyHospitalProfile,
  getAllHospitals,
  approveHospital,
} = require("../controllers/hospitalController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/me", protect, authorize("hospital"), getMyHospitalProfile);
router.put("/me", protect, authorize("hospital"), updateMyHospitalProfile);
router.get("/", protect, authorize("admin", "bloodbank"), getAllHospitals);
router.put("/:id/approve", protect, authorize("admin"), approveHospital);

module.exports = router;