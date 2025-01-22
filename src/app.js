const express = require("express");
const bodyParser = require("body-parser");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(bodyParser.json());
app.use("/api/ai", aiRoutes);

module.exports = app;
