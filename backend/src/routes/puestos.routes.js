const express = require("express");
const router = express.Router();

const {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto
} = require("../controllers/puestos.controller");

router.get("/", obtenerPuestos);
router.post("/", crearPuesto);
router.put("/:id", actualizarPuesto);
router.delete("/:id", eliminarPuesto);

module.exports = router;