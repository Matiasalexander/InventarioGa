const express = require("express");
const router = express.Router();

const {
  obtenerUnidades,
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad
} = require("../controllers/unidades.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("unidades.ver"),
  obtenerUnidades
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("unidades.crear"),
  crearUnidad
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("unidades.editar"),
  actualizarUnidad
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("unidades.eliminar"),
  eliminarUnidad
);

module.exports = router;