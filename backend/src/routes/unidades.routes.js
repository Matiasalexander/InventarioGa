const express = require("express");
const router = express.Router();

const {
  obtenerUnidades,
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad
} = require("../controllers/unidades.controller");

router.get("/", obtenerUnidades);
router.post("/", crearUnidad);
router.put("/:id", actualizarUnidad);
router.delete("/:id", eliminarUnidad);

module.exports = router;