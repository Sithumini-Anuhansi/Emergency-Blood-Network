const User = require("../models/User");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const BloodBank = require("../models/BloodBank");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user (donor / hospital / bloodbank / admin)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone, district, latitude, longitude, profileData } = req.body;

    if (!fullName || !email || !password || !role || !phone || !district) {
      res.status(400);
      throw new Error("Please provide all required fields");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error("Email already registered");
    }

    // Create base user account
    const user = await User.create({
      fullName,
      email,
      password,
      role,
      phone,
      district,
      latitude,
      longitude,
    });

    // Create the role-specific profile document
    if (role === "donor") {
      if (!profileData?.nic || !profileData?.bloodGroup || !profileData?.age || !profileData?.weight || !profileData?.gender) {
        // Roll back the user if profile data is incomplete
        await User.findByIdAndDelete(user._id);
        res.status(400);
        throw new Error("Missing required donor fields: nic, bloodGroup, age, weight, gender");
      }
      await Donor.create({
        userId: user._id,
        nic: profileData.nic,
        bloodGroup: profileData.bloodGroup,
        gender: profileData.gender,
        age: profileData.age,
        weight: profileData.weight,
        height: profileData.height,
        hemoglobin: profileData.hemoglobin,
      });
    } else if (role === "hospital") {
      if (!profileData?.hospitalName || !profileData?.address) {
        await User.findByIdAndDelete(user._id);
        res.status(400);
        throw new Error("Missing required hospital fields: hospitalName, address");
      }
      await Hospital.create({
        userId: user._id,
        hospitalName: profileData.hospitalName,
        address: profileData.address,
        district,
        email,
        phone,
        latitude,
        longitude,
      });
    } else if (role === "bloodbank") {
      if (!profileData?.bloodBankName || !profileData?.address) {
        await User.findByIdAndDelete(user._id);
        res.status(400);
        throw new Error("Missing required blood bank fields: bloodBankName, address");
      }
      await BloodBank.create({
        userId: user._id,
        bloodBankName: profileData.bloodBankName,
        district,
        address: profileData.address,
        phone,
        latitude,
        longitude,
      });
    }
    // admin role needs no extra profile

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide email and password");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Account is deactivated. Contact admin.");
    }

    const token = generateToken(user._id, user.role);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getMe };