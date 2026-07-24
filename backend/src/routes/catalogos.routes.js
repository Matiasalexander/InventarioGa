const express = require("express");
const router = express.Router();

const { obtenerCatalogos } = require("../controllers/catalogos.controller");
const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");
router.get(
  "/",
  verificarToken,
  verificarPermiso("catalogos.ver"),
  obtenerCatalogos
);

module.exports = router;