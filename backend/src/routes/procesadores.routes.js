const express = require("express");
const router = express.Router();

const {
  obtenerProcesadores,
  crearProcesador,
  actualizarProcesador,
  eliminarProcesador
} = require("../controllers/procesadores.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("procesadores.ver"),
  obtenerProcesadores
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("procesadores.crear"),
  crearProcesador
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("procesadores.editar"),
  actualizarProcesador
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("procesadores.eliminar"),
  eliminarProcesador
);

module.exports = router;