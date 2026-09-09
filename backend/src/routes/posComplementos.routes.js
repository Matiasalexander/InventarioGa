const express = require("express");

const router = express.Router();

const {
  verificarToken
} = require("../middleware/auth.middleware");

const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

const {
  obtenerComplementosPorInventario
} = require("../controllers/posComplementos.controller");


router.get(
  "/inventario/:id",
  verificarToken,
  verificarPermiso("inventario.detalle"),
  obtenerComplementosPorInventario
);


module.exports = router;