const express = require("express");
const router = express.Router();

const {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto
} = require("../controllers/puestos.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("puestos.ver"),
  obtenerPuestos
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("puestos.crear"),
  crearPuesto
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("puestos.editar"),
  actualizarPuesto
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("puestos.eliminar"),
  eliminarPuesto
);

module.exports = router;