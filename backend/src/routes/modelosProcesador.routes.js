const express = require("express");
const router = express.Router();

const {
  obtenerModelosProcesador,
  crearModeloProcesador,
  actualizarModeloProcesador,
  eliminarModeloProcesador
} = require("../controllers/modelosProcesador.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("modelosprocesador.ver"),
  obtenerModelosProcesador
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("modelosprocesador.crear"),
  crearModeloProcesador
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("modelosprocesador.editar"),
  actualizarModeloProcesador
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("modelosprocesador.eliminar"),
  eliminarModeloProcesador
);

module.exports = router;