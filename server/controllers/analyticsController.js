const Donor = require("../models/Donor");
const BloodRequest = require("../models/BloodRequest");
const TemperatureLog = require("../models/TemperatureLog");

// @desc    Donor growth over time (cumulative registrations by month)
// @route   GET /api/analytics/donor-growth
// @access  Private (admin)
const getDonorGrowth = async (req, res, next) => {
  try {
    const results = await Donor.aggregate([
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let cumulative = 0;
    const data = results.map((r) => {
      cumulative += r.count;
      return {
        label: `${monthNames[r._id.month - 1]} ${r._id.year}`,
        newDonors: r.count,
        totalDonors: cumulative,
      };
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Blood demand by district (total units requested, grouped by district)
// @route   GET /api/analytics/demand-by-district
// @access  Private (admin)
const getDemandByDistrict = async (req, res, next) => {
  try {
    const results = await BloodRequest.aggregate([
      {
        $group: {
          _id: "$district",
          totalUnitsRequested: { $sum: "$unitsRequired" },
          requestCount: { $sum: 1 },
        },
      },
      { $sort: { totalUnitsRequested: -1 } },
    ]);

    const data = results.map((r) => ({
      district: r._id,
      totalUnitsRequested: r.totalUnitsRequested,
      requestCount: r.requestCount,
    }));

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Temperature trends across all blood banks (recent readings, daily average)
// @route   GET /api/analytics/temperature-trends
// @access  Private (admin)
const getTemperatureTrends = async (req, res, next) => {
  try {
    const results = await TemperatureLog.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
          },
          avgTemp: { $avg: "$temperature" },
          maxTemp: { $max: "$temperature" },
          alertCount: { $sum: { $cond: ["$alertTriggered", 1, 0] } },
          readingCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      { $limit: 30 },
    ]);

    const data = results.map((r) => ({
      date: `${r._id.year}-${String(r._id.month).padStart(2, "0")}-${String(r._id.day).padStart(2, "0")}`,
      avgTemp: +r.avgTemp.toFixed(2),
      maxTemp: r.maxTemp,
      alertCount: r.alertCount,
      readingCount: r.readingCount,
    }));

    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDonorGrowth, getDemandByDistrict, getTemperatureTrends };