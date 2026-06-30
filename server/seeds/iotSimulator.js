/**
 * Standalone IoT sensor simulator.
 *
 * In a real deployment, physical temperature sensors in each blood bank's
 * cold storage would POST readings directly to /api/temperature/simulate
 * (or a dedicated /api/temperature/ingest endpoint reusing the same logic).
 * Since no physical hardware exists for this project, this script simulates
 * that behavior by logging in as each seeded blood bank account and
 * triggering a reading on an interval.
 *
 * Usage (run from the server/ directory, with the main API server already running):
 *   node seed/iotSimulator.js
 *
 * Runs continuously until stopped (Ctrl+C). Logs a reading for every blood
 * bank every INTERVAL_MS milliseconds.
 */

require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");

const API_BASE = process.env.API_BASE_URL || "http://localhost:5000/api";
const INTERVAL_MS = 10000; // simulate a new reading every 10 seconds per blood bank

async function getBloodBankTokens() {
  await mongoose.connect(process.env.MONGO_URI);
  const bloodBankUsers = await User.find({ role: "bloodbank" });
  await mongoose.disconnect();

  const tokens = [];
  for (const user of bloodBankUsers) {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, {
        email: user.email,
        password: "Password123!", // matches the seed script's default password
      });
      tokens.push({ name: user.fullName, token: data.token });
    } catch (err) {
      if (err.code === "ECONNREFUSED" || err.message.includes("ECONNREFUSED")) {
        console.error(`Could not connect to API at ${API_BASE} - is your backend server running? (npm run dev in server/)`);
        process.exit(1);
      }
      console.warn(`Could not log in as ${user.email}: ${err.response?.data?.message || err.message}`);
    }
  }
  return tokens;
}

async function simulateOnce(bloodBanks) {
  for (const bank of bloodBanks) {
    try {
      const { data } = await axios.post(
        `${API_BASE}/temperature/simulate`,
        {},
        { headers: { Authorization: `Bearer ${bank.token}` } }
      );
      const flag = data.alertTriggered ? "  ALERT" : "";
      console.log(`[${new Date().toLocaleTimeString()}] ${bank.name}: ${data.temperature}°C${flag}`);
    } catch (err) {
      console.error(`Failed to simulate reading for ${bank.name}:`, err.response?.data?.message || err.message);
    }
  }
}

async function run() {
  console.log("Fetching blood bank accounts...");
  const bloodBanks = await getBloodBankTokens();

  if (bloodBanks.length === 0) {
    console.error("No blood bank accounts found or logged in. Run the seed scripts first.");
    process.exit(1);
  }

  console.log(`Simulating sensor readings for ${bloodBanks.length} blood bank(s) every ${INTERVAL_MS / 1000}s. Ctrl+C to stop.\n`);

  // Run immediately, then on an interval
  await simulateOnce(bloodBanks);
  setInterval(() => simulateOnce(bloodBanks), INTERVAL_MS);
}

run().catch((err) => {
  console.error("Simulator failed to start:", err);
  process.exit(1);
});