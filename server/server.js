require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Emergency Blood Network API is running" });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/donors", require("./routes/donorRoutes"));
app.use("/api/hospitals", require("./routes/hospitalRoutes"));
app.use("/api/bloodbanks", require("./routes/bloodBankRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/requests", require("./routes/bloodRequestRoutes"));

// Error handling (must be after routes)
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});