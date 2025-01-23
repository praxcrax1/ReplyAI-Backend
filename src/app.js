const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/api/ai", aiRoutes);

module.exports = app;
