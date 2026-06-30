const BloodRequest = require("../models/BloodRequest");
const Hospital = require("../models/Hospital");
const Donor = require("../models/Donor");
const Donation = require("../models/Donation");
const Notification = require("../models/Notification");
const { rankDonors } = require("../utils/aiClient");

// @desc    Create a new blood request
// @route   POST /api/requests
// @access  Private (hospital)
const createBloodRequest = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      res.status(404);
      throw new Error("Hospital profile not found for this account");
    }

    const { patientName, bloodGroup, unitsRequired, urgency, district } = req.body;

    if (!patientName || !bloodGroup || !unitsRequired) {
      res.status(400);
      throw new Error("patientName, bloodGroup, and unitsRequired are required");
    }

    const request = await BloodRequest.create({
      hospitalId: hospital._id,
      patientName,
      bloodGroup,
      unitsRequired,
      urgency: urgency || "medium",
      district: district || hospital.district,
    });

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests created by the logged-in hospital
// @route   GET /api/requests/mine
// @access  Private (hospital)
const getMyRequests = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      res.status(404);
      throw new Error("Hospital profile not found for this account");
    }

    const requests = await BloodRequest.find({ hospitalId: hospital._id })
      .populate({
        path: "assignedDonor",
        populate: { path: "userId", select: "fullName phone" },
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests (admin/bloodbank view), filterable
// @route   GET /api/requests?status=pending&urgency=critical&district=Gampaha
// @access  Private (admin, bloodbank)
const getAllRequests = async (req, res, next) => {
  try {
    const { status, urgency, district, bloodGroup } = req.query;
    const filter = {};

    if (status) filter.requestStatus = status;
    if (urgency) filter.urgency = urgency;
    if (district) filter.district = district;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const requests = await BloodRequest.find(filter)
      .populate("hospitalId", "hospitalName district phone")
      .populate({
        path: "assignedDonor",
        populate: { path: "userId", select: "fullName phone" },
      })
      .sort({ urgency: -1, createdAt: -1 });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single request by ID
// @route   GET /api/requests/:id
// @access  Private (hospital who owns it, bloodbank, admin)
const getRequestById = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate("hospitalId", "hospitalName district phone")
      .populate({
        path: "assignedDonor",
        populate: { path: "userId", select: "fullName phone" },
      });

    if (!request) {
      res.status(404);
      throw new Error("Blood request not found");
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};

// @desc    Manually assign a donor to a request (manual matching, pre-AI)
// @route   PUT /api/requests/:id/assign
// @access  Private (bloodbank, admin)
const assignDonor = async (req, res, next) => {
  try {
    const { donorId } = req.body;
    if (!donorId) {
      res.status(400);
      throw new Error("donorId is required");
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Blood request not found");
    }

    const donor = await Donor.findById(donorId);
    if (!donor) {
      res.status(404);
      throw new Error("Donor not found");
    }
    if (!donor.availability || !donor.eligibility) {
      res.status(400);
      throw new Error("Selected donor is not currently available or eligible");
    }

    request.assignedDonor = donor._id;
    request.requestStatus = "matched";
    await request.save();

    // Notify the donor
    await Notification.create({
      receiverId: donor.userId,
      title: "Urgent Blood Request Match",
      message: `You've been matched to a ${request.urgency} priority request for ${request.bloodGroup} blood in ${request.district}.`,
    });

    res.json(request);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a request as fulfilled and log the donation
// @route   PUT /api/requests/:id/fulfill
// @access  Private (hospital, bloodbank, admin)
const fulfillRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Blood request not found");
    }
    if (!request.assignedDonor) {
      res.status(400);
      throw new Error("Cannot fulfill a request with no assigned donor");
    }

    request.requestStatus = "fulfilled";
    await request.save();

    // Log the donation and update donor stats
    await Donation.create({
      donorId: request.assignedDonor,
      hospitalId: request.hospitalId,
      donationDate: new Date(),
      units: request.unitsRequired,
      bloodGroup: request.bloodGroup,
      eligibilityStatus: "eligible",
    });

    const donor = await Donor.findById(request.assignedDonor);
    donor.totalDonations += 1;
    donor.lastDonationDate = new Date();
    donor.availability = false; // typical cooldown after donating
    await donor.save();

    res.json({ message: "Request fulfilled and donation logged", request });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a request
// @route   PUT /api/requests/:id/cancel
// @access  Private (hospital who owns it, admin)
const cancelRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Blood request not found");
    }

    request.requestStatus = "cancelled";
    await request.save();

    res.json(request);
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI-ranked candidate donors for a specific request
// @route   GET /api/requests/:id/ranked-donors
// @access  Private (bloodbank, admin)
const getRankedDonors = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Blood request not found");
    }

    const urgencyScoreMap = { low: 0, medium: 1, high: 2, critical: 3 };

    // Candidate pool: same blood group, available + eligible donors.
    // Cast a slightly wider net than a strict district match so the AI model
    // has something meaningful to rank rather than a single obvious choice.
    const candidates = await Donor.find({
      bloodGroup: request.bloodGroup,
      availability: true,
      eligibility: true,
    }).populate("userId", "fullName phone district");

    if (candidates.length === 0) {
      return res.json({ rankedDonors: [], message: "No available, eligible donors match this blood group" });
    }

    const donorPayload = candidates
      .filter((d) => d.userId) // guard against orphaned donor docs
      .map((d) => ({
        donor_id: d._id.toString(),
        blood_group: d.bloodGroup,
        district: d.userId.district,
        availability: d.availability,
        eligibility: d.eligibility,
        age: d.age,
        days_since_last_donation: d.lastDonationDate
          ? Math.floor((Date.now() - new Date(d.lastDonationDate)) / (1000 * 60 * 60 * 24))
          : 9999,
      }));

    const aiResult = await rankDonors({
      requestBloodGroup: request.bloodGroup,
      requestDistrict: request.district,
      urgencyScore: urgencyScoreMap[request.urgency] ?? 1,
      donors: donorPayload,
    });

    if (!aiResult) {
      // AI service unreachable - fall back to returning the unranked candidate list
      // so the admin can still manually assign instead of being fully blocked.
      const fallback = candidates.map((d) => ({
        donor_id: d._id,
        fullName: d.userId.fullName,
        phone: d.userId.phone,
        district: d.userId.district,
        match_score: null,
      }));
      return res.json({ rankedDonors: fallback, aiAvailable: false });
    }

    // Merge AI scores back with donor display info
    const donorMap = Object.fromEntries(candidates.map((d) => [d._id.toString(), d]));
    const rankedDonors = aiResult.ranked_donors.map((r) => {
      const d = donorMap[r.donor_id];
      return {
        donor_id: r.donor_id,
        match_score: r.match_score,
        fullName: d.userId.fullName,
        phone: d.userId.phone,
        district: d.userId.district,
      };
    });

    res.json({ rankedDonors, aiAvailable: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBloodRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  assignDonor,
  fulfillRequest,
  cancelRequest,
  getRankedDonors,
};