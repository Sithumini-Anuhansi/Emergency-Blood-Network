const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 5000,
});

// Predicts eligibility for a single donor profile.
// Returns { eligible: boolean, confidence: number } or null if the AI service is unreachable.
const predictEligibility = async ({ age, gender, weight, hemoglobin, days_since_last_donation }) => {
  try {
    const { data } = await aiClient.post("/predict-eligibility", {
      age,
      gender,
      weight,
      hemoglobin,
      days_since_last_donation,
    });
    return data;
  } catch (error) {
    console.error("AI service (predict-eligibility) error:", error.message);
    return null;
  }
};

// Ranks a list of candidate donors against a blood request by predicted match success.
// donors: array of { donor_id, blood_group, district, availability, eligibility, age, days_since_last_donation }
// Returns { ranked_donors: [{ donor_id, match_score }] } sorted descending, or null on failure.
const rankDonors = async ({ requestBloodGroup, requestDistrict, urgencyScore, donors }) => {
  try {
    const { data } = await aiClient.post("/rank-donors", {
      request_blood_group: requestBloodGroup,
      request_district: requestDistrict,
      urgency_score: urgencyScore,
      donors,
    });
    return data;
  } catch (error) {
    console.error("AI service (rank-donors) error:", error.message);
    return null;
  }
};

module.exports = { predictEligibility, rankDonors };