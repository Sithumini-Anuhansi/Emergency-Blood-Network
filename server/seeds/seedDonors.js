/**
 * Seeds the database with donor accounts from the AI training dataset
 * (ai/datasets/donor_dataset.csv), so the app has real, queryable donor
 * records instead of an empty database.
 *
 * This does NOT touch the trained AI models — it's a separate, one-time
 * data-loading step for the MongoDB side of the system.
 *
 * Usage (run from the server/ directory):
 *   node seed/seedDonors.js
 *
 * Safe to re-run: skips any donor whose email already exists.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const Donor = require("../models/Donor");

const CSV_PATH = path.join(__dirname, "../../ai/datasets/donor_dataset.csv");
const DEFAULT_PASSWORD = "Password123!"; // all seeded accounts share this for easy test login

// Minimal CSV parser (no external dependency needed for this simple, comma-only file)
function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i]));
    return row;
  });
}

async function seedDonors() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(csvContent);
  console.log(`Loaded ${rows.length} donor rows from CSV`);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = `${row.donor_id.toLowerCase()}@ebn-seed.local`;

    const existing = await User.findOne({ email });
    if (existing) {
      skipped++;
      continue;
    }

    const lastDonationDate = new Date();
    lastDonationDate.setDate(lastDonationDate.getDate() - parseInt(row.days_since_last_donation, 10));

    // Create base User account
    const user = await User.create({
      fullName: `${row.first_name} ${row.last_name}`,
      email,
      password: DEFAULT_PASSWORD, // hashed automatically by the User model's pre-save hook
      role: "donor",
      phone: row.phone,
      district: row.district,
    });

    // Create the linked Donor profile
    await Donor.create({
      userId: user._id,
      nic: `SEED${row.donor_id}`, // CSV has no real NIC; placeholder keeps the unique constraint happy
      bloodGroup: row.blood_group,
      gender: row.gender,
      age: parseInt(row.age, 10),
      weight: parseFloat(row.weight),
      hemoglobin: parseFloat(row.hemoglobin),
      lastDonationDate,
      availability: row.availability === "Available",
      eligibility: row.eligible_to_donate === "Yes",
    });

    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped (already existed): ${skipped}`);
  console.log(`All seeded accounts use the password: ${DEFAULT_PASSWORD}`);
  console.log(`Example login email: d0001@ebn-seed.local`);

  await mongoose.disconnect();
}

seedDonors().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});