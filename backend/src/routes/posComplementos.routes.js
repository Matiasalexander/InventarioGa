const express = require("express");

const router = express.Router();

const {
  verificarToken
} = require("../middleware/auth.middleware");

const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

const {
  obtenerComplementosPorInventario, crearComplementoPOS, actualizarComplementoPOS
} = require("../controllers/posComplementos.controller");


router.get(
  "/inventario/:id",
  verificarToken,
  verificarPermiso("inventario.detalle"),
  obtenerComplementosPorInventario
);

router.post("/", verificarToken, verificarPermiso("inventario.crear"), crearComplementoPOS);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("inventario.editar"),
  actualizarComplementoPOS
);
module.exports = router;