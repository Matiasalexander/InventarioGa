const express = require("express");

const router = express.Router();

const {
  obtenerSistemasOperativos,
  crearSistemaOperativo,
  actualizarSistemaOperativo,
  eliminarSistemaOperativo
} = require("../controllers/sistemasOperativos.controller");

const { verificarToken } = require("../middleware/auth.middleware");

const { verificarPermiso } = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("sistemasoperativos.ver"),
  obtenerSistemasOperativos
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("sistemasoperativos.crear"),
  crearSistemaOperativo
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("sistemasoperativos.editar"),
  actualizarSistemaOperativo
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("sistemasoperativos.eliminar"),
  eliminarSistemaOperativo
);

module.exports = router;

