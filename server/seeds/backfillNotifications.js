/**
 * Backfills Notification records for blood requests that already have an
 * assigned donor (status "matched" or "fulfilled"), created by
 * seedHospitalsAndRequests.js. That script writes directly to BloodRequest/
 * Donation and bypasses the real assignDonor controller, so no notifications
 * were generated for those donors - this script fills that gap.
 *
 * Safe to re-run: skips requests that already have a matching notification
 * (matched by message content referencing the request's Mongo _id).
 *
 * Usage (run from the server/ directory):
 *   node seed/backfillNotifications.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const BloodRequest = require("../models/BloodRequest");
const Donor = require("../models/Donor");
const Notification = require("../models/Notification");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const requests = await BloodRequest.find({
    assignedDonor: { $ne: null },
    requestStatus: { $in: ["matched", "fulfilled"] },
  }).populate("assignedDonor");

  console.log(`Found ${requests.length} matched/fulfilled requests with an assigned donor`);

  let created = 0;
  let skipped = 0;

  for (const req of requests) {
    if (!req.assignedDonor) continue;

    const donor = await Donor.findById(req.assignedDonor._id);
    if (!donor) continue;

    const marker = `[req:${req._id}]`; // hidden marker for re-run dedupe, harmless if visible in raw DB browsing
    const existing = await Notification.findOne({
      receiverId: donor.userId,
      message: { $regex: marker.replace(/[[\]]/g, "\\$&") },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const statusPhrase =
      req.requestStatus === "fulfilled"
        ? "Thank you for completing this donation."
        : "Please prepare to donate soon.";

    await Notification.create({
      receiverId: donor.userId,
      title: "Blood Request Match",
      message: `You were matched to a ${req.urgency} priority request for ${req.bloodGroup} blood. ${statusPhrase} ${marker}`,
      isRead: req.requestStatus === "fulfilled", // fulfilled ones are "old news" by now
    });

    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped (already existed): ${skipped}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});