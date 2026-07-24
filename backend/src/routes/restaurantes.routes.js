const express = require("express");
const router = express.Router();

const {
  obtenerRestaurantes,
  obtenerRestaurantePorId,
  crearRestaurante,
  actualizarRestaurante,
  eliminarRestaurante
} = require("../controllers/restaurantes.controller");

const {
  verificarToken
} = require("../middleware/auth.middleware");

const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

router.get(
  "/",
  verificarToken,
  verificarPermiso("restaurantes.ver"),
  obtenerRestaurantes
);

router.get(
  "/:id",
  verificarToken,
  verificarPermiso("restaurantes.ver"),
  obtenerRestaurantePorId
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("restaurantes.crear"),
  crearRestaurante
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("restaurantes.editar"),
  actualizarRestaurante
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("restaurantes.eliminar"),
  eliminarRestaurante
);

module.exports = router;