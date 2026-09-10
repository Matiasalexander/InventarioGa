const express = require("express");

const router = express.Router();

const {
  verificarToken
} = require("../middleware/auth.middleware");

const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

const {
  obtenerComplementosPorInventario, crearComplementoPOS
} = require("../controllers/posComplementos.controller");


router.get(
  "/inventario/:id",
  verificarToken,
  verificarPermiso("inventario.detalle"),
  obtenerComplementosPorInventario
);

router.post("/", verificarToken, verificarPermiso("inventario.crear"), crearComplementoPOS);


module.exports = router;