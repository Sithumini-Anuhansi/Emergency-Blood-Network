const express = require("express");
const router = express.Router();
const {
  createBloodRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  assignDonor,
  fulfillRequest,
  cancelRequest,
  getRankedDonors,
} = require("../controllers/bloodRequestController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Hospital creates a request
router.post("/", protect, authorize("hospital"), createBloodRequest);

// Hospital views its own requests (specific route before /:id)
router.get("/mine", protect, authorize("hospital"), getMyRequests);

// Admin/bloodbank view all requests (with filters)
router.get("/", protect, authorize("bloodbank", "admin"), getAllRequests);

// Get single request
router.get("/:id", protect, authorize("hospital", "bloodbank", "admin"), getRequestById);

// AI-ranked candidate donors for this request (must come before /:id/assign in spirit, but distinct path so no collision)
router.get("/:id/ranked-donors", protect, authorize("bloodbank", "admin"), getRankedDonors);

// Assign a donor (manual match, pre-AI)
router.put("/:id/assign", protect, authorize("bloodbank", "admin"), assignDonor);

// Fulfill a request (logs donation)
router.put("/:id/fulfill", protect, authorize("hospital", "bloodbank", "admin"), fulfillRequest);

// Cancel a request
router.put("/:id/cancel", protect, authorize("hospital", "admin"), cancelRequest);

module.exports = router;