const express = require("express");
const router = express.Router();

const {
  obtenerModelos,
  obtenerModeloPorId,
  crearModelo,
  actualizarModelo,
  eliminarModelo
} = require("../controllers/modelos.controller");

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
  obtenerModelos
);

router.get(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.ver"),
  obtenerModeloPorId
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("catalogos.crear"),
  crearModelo
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.editar"),
  actualizarModelo
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.eliminar"),
  eliminarModelo
);

module.exports = router;