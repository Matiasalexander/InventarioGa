const express = require("express");
const router = express.Router();

const {
  obtenerDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento
} = require("../controllers/departamentos.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("departamentos.ver"),
  obtenerDepartamentos
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("departamentos.crear"),
  crearDepartamento
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("departamentos.editar"),
  actualizarDepartamento
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("departamentos.eliminar"),
  eliminarDepartamento
);

module.exports = router;