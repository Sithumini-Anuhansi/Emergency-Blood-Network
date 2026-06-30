/**
 * Seeds the database with synthetic hospitals and blood requests, so the
 * Admin dashboard's request/status/urgency charts have real variety to show.
 *
 * Requires seedDonors.js to have been run first (requests get assigned
 * against real seeded donors where status is "matched" or "fulfilled").
 *
 * Usage (run from the server/ directory):
 *   node seed/seedHospitalsAndRequests.js
 *
 * Safe to re-run for hospitals (skips existing emails), but re-running will
 * add a fresh batch of requests each time (no dedupe key for requests).
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Donor = require("../models/Donor");
const BloodRequest = require("../models/BloodRequest");
const Donation = require("../models/Donation");

const DEFAULT_PASSWORD = "Password123!";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_LEVELS = ["low", "medium", "high", "critical"];
const PATIENT_FIRST_NAMES = ["Nimal", "Kasun", "Sanduni", "Ishara", "Dilani", "Ruwan", "Chathura", "Hasini", "Pradeep", "Nilmini"];
const PATIENT_LAST_NAMES = ["Fernando", "Silva", "Gunawardena", "Jayasuriya", "Rathnayake", "Wijesinghe"];

const HOSPITALS = [
  { name: "Negombo General Hospital", district: "Gampaha", address: "Main St, Negombo" },
  { name: "Colombo National Hospital", district: "Colombo", address: "Regent St, Colombo" },
  { name: "Kandy Teaching Hospital", district: "Kandy", address: "William Gopallawa Mw, Kandy" },
  { name: "Matara General Hospital", district: "Matara", address: "Hospital Rd, Matara" },
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPatientName() {
  return `${randomFrom(PATIENT_FIRST_NAMES)} ${randomFrom(PATIENT_LAST_NAMES)}`;
}

async function seedHospitals() {
  const createdHospitals = [];

  for (const h of HOSPITALS) {
    const email = `${h.name.toLowerCase().replace(/\s+/g, "")}@ebn-seed.local`;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: `${h.name} Admin`,
        email,
        password: DEFAULT_PASSWORD,
        role: "hospital",
        phone: "0112345678",
        district: h.district,
      });

      await Hospital.create({
        userId: user._id,
        hospitalName: h.name,
        address: h.address,
        district: h.district,
        email,
        phone: "0112345678",
        approved: true, // pre-approved so seeded requests can be created immediately
      });

      console.log(`Created hospital: ${h.name}`);
    } else {
      console.log(`Hospital already exists, skipping: ${h.name}`);
    }

    const hospitalDoc = await Hospital.findOne({ userId: user._id });
    createdHospitals.push(hospitalDoc);
  }

  return createdHospitals;
}

async function seedRequests(hospitals, requestCount = 40) {
  const allDonors = await Donor.find();
  if (allDonors.length === 0) {
    console.warn("No donors found in the database. Run seedDonors.js first for realistic matched/fulfilled requests.");
  }

  let created = 0;

  for (let i = 0; i < requestCount; i++) {
    const hospital = randomFrom(hospitals);
    const bloodGroup = randomFrom(BLOOD_GROUPS);
    const urgency = randomFrom(URGENCY_LEVELS);

    // Weighted status distribution: mostly resolved one way or another,
    // some still pending, a few cancelled - mirrors a realistic operational mix
    const statusRoll = Math.random();
    let requestStatus;
    if (statusRoll < 0.35) requestStatus = "fulfilled";
    else if (statusRoll < 0.55) requestStatus = "matched";
    else if (statusRoll < 0.85) requestStatus = "pending";
    else requestStatus = "cancelled";

    const request = await BloodRequest.create({
      hospitalId: hospital._id,
      patientName: randomPatientName(),
      bloodGroup,
      unitsRequired: Math.ceil(Math.random() * 3),
      urgency,
      district: hospital.district,
      requestStatus: requestStatus === "fulfilled" || requestStatus === "matched" ? "pending" : requestStatus,
      // ^ temporarily "pending" so we can reuse the same assignment path below before finalizing status
    });

    if ((requestStatus === "matched" || requestStatus === "fulfilled") && allDonors.length > 0) {
      // Prefer a donor with matching blood group if one exists, else any donor
      const matchingPool = allDonors.filter((d) => d.bloodGroup === bloodGroup);
      const donor = matchingPool.length > 0 ? randomFrom(matchingPool) : randomFrom(allDonors);

      request.assignedDonor = donor._id;
      request.requestStatus = "matched";
      await request.save();

      if (requestStatus === "fulfilled") {
        request.requestStatus = "fulfilled";
        await request.save();

        await Donation.create({
          donorId: donor._id,
          hospitalId: hospital._id,
          donationDate: request.createdAt,
          units: request.unitsRequired,
          bloodGroup: request.bloodGroup,
          eligibilityStatus: "eligible",
        });

        donor.totalDonations = (donor.totalDonations || 0) + 1;
        donor.lastDonationDate = request.createdAt;
        await donor.save();
      }
    } else {
      request.requestStatus = requestStatus;
      await request.save();
    }

    created++;
  }

  console.log(`Created ${created} blood requests across ${hospitals.length} hospitals`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const hospitals = await seedHospitals();
  await seedRequests(hospitals, 40);

  console.log("\nDone. All seeded hospital accounts use the password:", DEFAULT_PASSWORD);
  console.log("Example login email: negombogeneralhospital@ebn-seed.local");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});