const express = require("express");

const {
  obtenerDashboard
} = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/", obtenerDashboard);

module.exports = router;