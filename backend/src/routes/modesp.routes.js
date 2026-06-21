const express = require("express");
const router = express.Router();

const {
  obtenerModesp,
  crearModesp,
  actualizarModesp,
  eliminarModesp
} = require("../controllers/modesp.controller");

router.get("/", obtenerModesp);
router.post("/", crearModesp);
router.put("/:id", actualizarModesp);
router.delete("/:id", eliminarModesp);

module.exports = router;