const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// test route
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

// connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// start server
const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});