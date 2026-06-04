const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
require("dotenv").config();

const HttpError = require("./models/http-error.model"); // chỉnh path nếu khác

const app = express();
app.disable("etag");
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// ================= Swagger =================
const swaggerDocument = YAML.load("./docs/swagger.yaml");

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

// ================= Routes =================
// app.get("/", (req, res) => {
//   res.send("Server is running 🚀");
// });

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running 🚀"
  });
});

app.use("/api", require("./routes/index.route"));

// ================= 404 Handler =================
app.use((req, res, next) => {
  const error = new HttpError("Route not found", 404);
  next(error);
});

// ================= Global Error Handler =================
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
});

// ================= MongoDB + Start Server =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas Connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📄 Swagger Docs: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed");
    console.error(err.message);
  });
module.exports = app;