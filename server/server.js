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

// Routes (will be added as we build each module)
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/donors", require("./routes/donorRoutes"));
// app.use("/api/hospitals", require("./routes/hospitalRoutes"));
// app.use("/api/requests", require("./routes/bloodRequestRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});