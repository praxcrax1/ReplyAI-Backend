const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use("/api/ai", aiRoutes);

module.exports = app;
