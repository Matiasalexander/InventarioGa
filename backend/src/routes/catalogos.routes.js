const express = require("express");
const router = express.Router();

const { obtenerCatalogos } = require("../controllers/catalogos.controller");

router.get("/", obtenerCatalogos);

module.exports = router;