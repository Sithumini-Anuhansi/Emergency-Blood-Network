const express = require("express");
const router = express.Router();
const {
  addInventory,
  getMyInventory,
  browseInventory,
  updateInventory,
  markExpiredBatches,
} = require("../controllers/inventoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("bloodbank"), addInventory);
router.get("/mine", protect, authorize("bloodbank"), getMyInventory);
router.get("/", protect, authorize("hospital", "admin"), browseInventory);
router.put("/check-expired", protect, authorize("admin", "bloodbank"), markExpiredBatches);
router.put("/:id", protect, authorize("bloodbank"), updateInventory);

module.exports = router;