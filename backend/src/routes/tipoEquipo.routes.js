const express = require("express");
const router = express.Router();

const {
  obtenerTiposEquipo,
  obtenerTipoEquipoPorId,
  crearTipoEquipo,
  actualizarTipoEquipo,
  eliminarTipoEquipo
} = require("../controllers/tipoEquipo.controller");

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
  obtenerTiposEquipo
);

router.get(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.ver"),
  obtenerTipoEquipoPorId
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("catalogos.crear"),
  crearTipoEquipo
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.editar"),
  actualizarTipoEquipo
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.eliminar"),
  eliminarTipoEquipo
);

module.exports = router;