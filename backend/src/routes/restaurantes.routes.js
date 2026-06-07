const express = require("express");
const router = express.Router();

const {
  obtenerRestaurantes,
  obtenerRestaurantePorId,
  crearRestaurante,
  actualizarRestaurante,
  eliminarRestaurante
} = require("../controllers/restaurantes.controller");

router.get("/", obtenerRestaurantes);
router.get("/:id", obtenerRestaurantePorId);
router.post("/", crearRestaurante);
router.put("/:id", actualizarRestaurante);
router.delete("/:id", eliminarRestaurante);

module.exports = router;