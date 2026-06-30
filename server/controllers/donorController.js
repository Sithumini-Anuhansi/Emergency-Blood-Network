const Donor = require("../models/Donor");
const User = require("../models/User");
const Donation = require("../models/Donation");
const { predictEligibility } = require("../utils/aiClient");

// @desc    Get logged-in donor's own profile
// @route   GET /api/donors/me
// @access  Private (donor)
const getMyDonorProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id }).populate(
      "userId",
      "fullName email phone district latitude longitude"
    );
    if (!donor) {
      res.status(404);
      throw new Error("Donor profile not found");
    }
    res.json(donor);
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged-in donor's profile
// @route   PUT /api/donors/me
// @access  Private (donor)
const updateMyDonorProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      res.status(404);
      throw new Error("Donor profile not found");
    }

    const allowedFields = [
      "bloodGroup",
      "weight",
      "height",
      "hemoglobin",
      "medicalConditions",
      "availability",
      "profilePhoto",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        donor[field] = req.body[field];
      }
    });

    // Recompute eligibility via the AI microservice whenever medically relevant
    // fields change. Falls back silently to the existing eligibility value if
    // the AI service is unreachable, so profile updates never hard-fail on it.
    const daysSinceLastDonation = donor.lastDonationDate
      ? Math.floor((Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24))
      : 9999; // never donated -> treat as fully recovered for recency purposes

    const aiResult = await predictEligibility({
      age: donor.age,
      gender: donor.gender,
      weight: donor.weight,
      hemoglobin: donor.hemoglobin,
      days_since_last_donation: daysSinceLastDonation,
    });

    if (aiResult) {
      donor.eligibility = aiResult.eligible;
    }

    await donor.save();
    res.json({ ...donor.toObject(), aiPrediction: aiResult });
  } catch (error) {
    next(error);
  }
};

// @desc    Search/filter donors (used by hospitals/admin to find matches)
// @route   GET /api/donors?bloodGroup=O+&district=Gampaha&availability=true
// @access  Private (hospital, bloodbank, admin)
const searchDonors = async (req, res, next) => {
  try {
    const { bloodGroup, district, availability, eligibility } = req.query;
    const filter = {};

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (availability !== undefined) filter.availability = availability === "true";
    if (eligibility !== undefined) filter.eligibility = eligibility === "true";

    // district lives on the User doc, so we need a join via populate + match
    const donors = await Donor.find(filter)
      .populate({
        path: "userId",
        select: "fullName phone district latitude longitude isActive",
        match: district ? { district } : {},
      })
      .lean();

    // Filter out donors whose populated userId is null (didn't match district filter)
    const results = donors.filter((d) => d.userId !== null);

    res.json({ count: results.length, donors: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single donor by ID
// @route   GET /api/donors/:id
// @access  Private (hospital, bloodbank, admin)
const getDonorById = async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.id).populate(
      "userId",
      "fullName email phone district latitude longitude"
    );
    if (!donor) {
      res.status(404);
      throw new Error("Donor not found");
    }
    res.json(donor);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in donor's donation history
// @route   GET /api/donors/me/donations
// @access  Private (donor)
const getMyDonationHistory = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      res.status(404);
      throw new Error("Donor profile not found");
    }

    const donations = await Donation.find({ donorId: donor._id })
      .populate("hospitalId", "hospitalName district")
      .populate("bloodBankId", "bloodBankName district")
      .sort({ donationDate: -1 });

    res.json(donations);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: list all donors (paginated)
// @route   GET /api/donors/all?page=1&limit=20
// @access  Private (admin)
const getAllDonors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Donor.countDocuments();
    const donors = await Donor.find()
      .populate("userId", "fullName email phone district isActive")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      donors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDonorProfile,
  updateMyDonorProfile,
  searchDonors,
  getDonorById,
  getMyDonationHistory,
  getAllDonors,
};