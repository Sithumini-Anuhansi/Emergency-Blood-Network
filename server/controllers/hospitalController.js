const Hospital = require("../models/Hospital");

// @desc    Get logged-in hospital's own profile
// @route   GET /api/hospitals/me
// @access  Private (hospital)
const getMyHospitalProfile = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id }).populate(
      "userId",
      "fullName email phone district"
    );
    if (!hospital) {
      res.status(404);
      throw new Error("Hospital profile not found");
    }
    res.json(hospital);
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged-in hospital's profile
// @route   PUT /api/hospitals/me
// @access  Private (hospital)
const updateMyHospitalProfile = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      res.status(404);
      throw new Error("Hospital profile not found");
    }

    const allowedFields = ["hospitalName", "address", "phone", "latitude", "longitude"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) hospital[field] = req.body[field];
    });

    await hospital.save();
    res.json(hospital);
  } catch (error) {
    next(error);
  }
};

// @desc    List all hospitals (optionally filter by approved status)
// @route   GET /api/hospitals?approved=true
// @access  Private (admin, bloodbank)
const getAllHospitals = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.approved !== undefined) filter.approved = req.query.approved === "true";

    const hospitals = await Hospital.find(filter).populate("userId", "fullName email phone isActive");
    res.json(hospitals);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin approves a hospital account
// @route   PUT /api/hospitals/:id/approve
// @access  Private (admin)
const approveHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      throw new Error("Hospital not found");
    }
    hospital.approved = true;
    await hospital.save();
    res.json(hospital);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyHospitalProfile,
  updateMyHospitalProfile,
  getAllHospitals,
  approveHospital,
};