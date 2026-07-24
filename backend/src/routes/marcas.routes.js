const express = require("express");
const router = express.Router();

const {
  obtenerMarcas,
  obtenerMarcaPorId,
  crearMarca,
  actualizarMarca,
  eliminarMarca
} = require("../controllers/marcas.controller");

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
  obtenerMarcas
);

router.get(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.ver"),
  obtenerMarcaPorId
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("catalogos.crear"),
  crearMarca
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.editar"),
  actualizarMarca
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("catalogos.eliminar"),
  eliminarMarca
);

module.exports = router;