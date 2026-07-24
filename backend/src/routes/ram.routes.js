const express = require("express");
const router = express.Router();

const {
  obtenerRam,
  crearRAM,
  actualizarRAM,
  eliminarRAM
} = require("../controllers/ram.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("memoriaram.ver"),
  obtenerRam
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("memoriaram.crear"),
  crearRAM
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("memoriaram.editar"),
  actualizarRAM
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("memoriaram.eliminar"),
  eliminarRAM
);

module.exports = router;