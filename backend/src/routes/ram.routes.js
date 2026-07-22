const express = require("express");
const router = express.Router();

const {
  obtenerRam,
  crearRAM,
  actualizarRAM,
  eliminarRAM
} = require("../controllers/ram.controller");

router.get("/", obtenerRam);
router.post("/", crearRAM);
router.put("/:id", actualizarRAM);
router.delete("/:id", eliminarRAM);

module.exports = router;