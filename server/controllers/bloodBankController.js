const BloodBank = require("../models/BloodBank");

// @desc    Get logged-in blood bank's own profile
// @route   GET /api/bloodbanks/me
// @access  Private (bloodbank)
const getMyBloodBankProfile = async (req, res, next) => {
  try {
    const bank = await BloodBank.findOne({ userId: req.user._id }).populate(
      "userId",
      "fullName email phone district"
    );
    if (!bank) {
      res.status(404);
      throw new Error("Blood bank profile not found");
    }
    res.json(bank);
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged-in blood bank's profile
// @route   PUT /api/bloodbanks/me
// @access  Private (bloodbank)
const updateMyBloodBankProfile = async (req, res, next) => {
  try {
    const bank = await BloodBank.findOne({ userId: req.user._id });
    if (!bank) {
      res.status(404);
      throw new Error("Blood bank profile not found");
    }

    const allowedFields = ["bloodBankName", "address", "phone", "latitude", "longitude"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) bank[field] = req.body[field];
    });

    await bank.save();
    res.json(bank);
  } catch (error) {
    next(error);
  }
};

// @desc    List all blood banks (e.g. for hospitals/admin to browse)
// @route   GET /api/bloodbanks?district=Gampaha
// @access  Private
const getAllBloodBanks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.district) filter.district = req.query.district;

    const banks = await BloodBank.find(filter).populate("userId", "fullName email phone");
    res.json(banks);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBloodBankProfile,
  updateMyBloodBankProfile,
  getAllBloodBanks,
};