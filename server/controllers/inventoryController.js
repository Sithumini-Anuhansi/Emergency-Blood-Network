const BloodInventory = require("../models/BloodInventory");
const BloodBank = require("../models/BloodBank");

// @desc    Add a new inventory batch
// @route   POST /api/inventory
// @access  Private (bloodbank)
const addInventory = async (req, res, next) => {
  try {
    const bank = await BloodBank.findOne({ userId: req.user._id });
    if (!bank) {
      res.status(404);
      throw new Error("Blood bank profile not found for this account");
    }

    const { bloodGroup, unitsAvailable, collectionDate, expiryDate, storageTemperature } = req.body;
    if (!bloodGroup || unitsAvailable === undefined || !collectionDate || !expiryDate) {
      res.status(400);
      throw new Error("bloodGroup, unitsAvailable, collectionDate, expiryDate are required");
    }

    const batch = await BloodInventory.create({
      bloodBankId: bank._id,
      bloodGroup,
      unitsAvailable,
      collectionDate,
      expiryDate,
      storageTemperature: storageTemperature ?? 4,
    });

    res.status(201).json(batch);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in blood bank's full inventory
// @route   GET /api/inventory/mine
// @access  Private (bloodbank)
const getMyInventory = async (req, res, next) => {
  try {
    const bank = await BloodBank.findOne({ userId: req.user._id });
    if (!bank) {
      res.status(404);
      throw new Error("Blood bank profile not found for this account");
    }

    const inventory = await BloodInventory.find({ bloodBankId: bank._id }).sort({ expiryDate: 1 });

    // Aggregate units per blood group for a quick dashboard summary
    const summary = {};
    inventory.forEach((item) => {
      if (item.status === "available") {
        summary[item.bloodGroup] = (summary[item.bloodGroup] || 0) + item.unitsAvailable;
      }
    });

    res.json({ inventory, summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Browse inventory across all blood banks (for hospitals/admin)
// @route   GET /api/inventory?bloodGroup=O+&district=Gampaha
// @access  Private (hospital, admin)
const browseInventory = async (req, res, next) => {
  try {
    const { bloodGroup, district } = req.query;
    const filter = { status: "available" };
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    let query = BloodInventory.find(filter).populate({
      path: "bloodBankId",
      select: "bloodBankName district phone",
      match: district ? { district } : {},
    });

    const results = (await query).filter((item) => item.bloodBankId !== null);

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an inventory batch (units used, status change)
// @route   PUT /api/inventory/:id
// @access  Private (bloodbank)
const updateInventory = async (req, res, next) => {
  try {
    const batch = await BloodInventory.findById(req.params.id);
    if (!batch) {
      res.status(404);
      throw new Error("Inventory batch not found");
    }

    const allowedFields = ["unitsAvailable", "status", "storageTemperature"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) batch[field] = req.body[field];
    });

    // Auto-expire if units hit 0
    if (batch.unitsAvailable <= 0) batch.status = "used";

    await batch.save();
    res.json(batch);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark expired batches (run manually or via cron later)
// @route   PUT /api/inventory/check-expired
// @access  Private (admin, bloodbank)
const markExpiredBatches = async (req, res, next) => {
  try {
    const result = await BloodInventory.updateMany(
      { expiryDate: { $lt: new Date() }, status: "available" },
      { $set: { status: "expired" } }
    );
    res.json({ message: "Expired batches updated", modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addInventory,
  getMyInventory,
  browseInventory,
  updateInventory,
  markExpiredBatches,
};