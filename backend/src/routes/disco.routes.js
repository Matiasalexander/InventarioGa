const express = require("express");
const router = express.Router();

const {
  obtenerDisco,
  crearDisco,
  actualizarDisco,
  eliminarDisco
} = require("../controllers/disco.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("discosduros.ver"),
  obtenerDisco
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("discosduros.crear"),
  crearDisco
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("discosduros.editar"),
  actualizarDisco
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("discosduros.eliminar"),
  eliminarDisco
);

module.exports = router;