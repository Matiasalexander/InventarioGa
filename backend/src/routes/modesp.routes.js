const express = require("express");
const router = express.Router();

const {
  obtenerModesp,
  crearModesp,
  actualizarModesp,
  eliminarModesp
} = require("../controllers/modesp.controller");

const {
  verificarToken
} = require("../middleware/auth.middleware");

const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("catalogos.ver"),
  obtenerModesp
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("catalogos.crear"),
  crearModesp
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.editar"),
  actualizarModesp
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.eliminar"),
  eliminarModesp
);

module.exports = router;