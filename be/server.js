const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http")
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan("dev"));

const swaggerDocument = YAML.load("./docs/swagger.yaml");
const server = http.createServer(app);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);


app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running"
  });
});

app.use("/api", require("./routes/index.route"));

app.use((req, res, next) => {
  const error = new HttpError("Route not found", 404);
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
});
// Mạng cục bộ đôi khi timeout DNS/kết nối tới MongoDB Atlas — thử lại vài lần thay vì bỏ cuộc ngay.
async function connectWithRetry(retriesLeft = 5, delayMs = 3000) {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("MongoDB Atlas Connected");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Swagger Docs: http://localhost:${PORT}/api-docs`);

      require("./services/cron.service")();
    });
  } catch (err) {
    console.error(`MongoDB connection failed (còn ${retriesLeft} lần thử lại): ${err.message}`);
    if (retriesLeft > 0) {
      setTimeout(() => connectWithRetry(retriesLeft - 1, delayMs), delayMs);
    } else {
      console.error("Hết số lần thử lại — không kết nối được MongoDB Atlas.");
    }
  }
}
connectWithRetry();

module.exports = server;