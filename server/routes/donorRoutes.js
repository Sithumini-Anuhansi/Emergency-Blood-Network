const express = require("express");
const router = express.Router();
const {
  getMyDonorProfile,
  updateMyDonorProfile,
  searchDonors,
  getDonorById,
  getMyDonationHistory,
  getAllDonors,
} = require("../controllers/donorController");
const { protect, authorize } = require("../middleware/authMiddleware");

// IMPORTANT: specific routes before /:id

// Donor's own profile
router.get("/me", protect, authorize("donor"), getMyDonorProfile);
router.put("/me", protect, authorize("donor"), updateMyDonorProfile);
router.get("/me/donations", protect, authorize("donor"), getMyDonationHistory);

// Admin: list all donors
router.get("/all", protect, authorize("admin"), getAllDonors);

// Search/filter donors (hospital, bloodbank, admin)
router.get("/", protect, authorize("hospital", "bloodbank", "admin"), searchDonors);

// Get single donor by ID (hospital, bloodbank, admin)
router.get("/:id", protect, authorize("hospital", "bloodbank", "admin"), getDonorById);

module.exports = router;