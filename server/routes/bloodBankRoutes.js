const express = require("express");
const router = express.Router();
const {
  getMyBloodBankProfile,
  updateMyBloodBankProfile,
  getAllBloodBanks,
} = require("../controllers/bloodBankController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/me", protect, authorize("bloodbank"), getMyBloodBankProfile);
router.put("/me", protect, authorize("bloodbank"), updateMyBloodBankProfile);
router.get("/", protect, authorize("hospital", "admin", "bloodbank"), getAllBloodBanks);

module.exports = router;