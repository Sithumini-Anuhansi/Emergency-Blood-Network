/**
 * Seeds the database with blood bank accounts and inventory batches, so the
 * Blood Bank dashboard (currently empty/untestable) has real data to show.
 *
 * Usage (run from the server/ directory):
 *   node seed/seedBloodBanksAndInventory.js
 *
 * Safe to re-run for blood banks (skips existing emails), but re-running
 * will add a fresh batch of inventory each time (no dedupe key for batches).
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const BloodBank = require("../models/BloodBank");
const BloodInventory = require("../models/BloodInventory");

const DEFAULT_PASSWORD = "Password123!";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_BANKS = [
  { name: "Gampaha Central Blood Bank", district: "Gampaha", address: "Hospital Rd, Gampaha" },
  { name: "Colombo National Blood Bank", district: "Colombo", address: "Elvitigala Mw, Colombo" },
  { name: "Kandy Regional Blood Bank", district: "Kandy", address: "Peradeniya Rd, Kandy" },
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function seedBloodBanks() {
  const created = [];

  for (const b of BLOOD_BANKS) {
    const email = `${b.name.toLowerCase().replace(/\s+/g, "")}@ebn-seed.local`;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: `${b.name} Staff`,
        email,
        password: DEFAULT_PASSWORD,
        role: "bloodbank",
        phone: "0332234567",
        district: b.district,
      });

      await BloodBank.create({
        userId: user._id,
        bloodBankName: b.name,
        district: b.district,
        address: b.address,
        phone: "0332234567",
      });

      console.log(`Created blood bank: ${b.name}`);
    } else {
      console.log(`Blood bank already exists, skipping: ${b.name}`);
    }

    const bankDoc = await BloodBank.findOne({ userId: user._id });
    created.push(bankDoc);
  }

  return created;
}

async function seedInventory(bloodBanks) {
  let created = 0;

  for (const bank of bloodBanks) {
    // 2-3 batches per blood group per bank, with varied collection/expiry dates
    for (const bloodGroup of BLOOD_GROUPS) {
      const batchCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 batches

      for (let i = 0; i < batchCount; i++) {
        const collectedDaysAgo = Math.floor(Math.random() * 25); // 0-25 days ago
        const collectionDate = daysFromNow(-collectedDaysAgo);
        // Whole blood is typically usable ~35 days after collection
        const expiryDate = daysFromNow(35 - collectedDaysAgo);

        // Occasionally simulate a cold-chain temperature excursion (>6C) for realism,
        // useful once the IoT alert logic is built
        const storageTemperature =
          Math.random() < 0.08 ? +(6.5 + Math.random() * 2).toFixed(1) : +(2 + Math.random() * 4).toFixed(1);

        await BloodInventory.create({
          bloodBankId: bank._id,
          bloodGroup,
          unitsAvailable: 3 + Math.floor(Math.random() * 10), // 3-12 units
          collectionDate,
          expiryDate,
          storageTemperature,
          status: "available",
        });

        created++;
      }
    }
  }

  console.log(`Created ${created} inventory batches across ${bloodBanks.length} blood banks`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const bloodBanks = await seedBloodBanks();
  await seedInventory(bloodBanks);

  console.log("\nDone. All seeded blood bank accounts use the password:", DEFAULT_PASSWORD);
  console.log("Example login email: gampahacentralbloodbank@ebn-seed.local");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});