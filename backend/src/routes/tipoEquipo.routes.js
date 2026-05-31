const express = require("express");
const router = express.Router();

const {
  obtenerTiposEquipo,
  obtenerTipoEquipoPorId,
  crearTipoEquipo,
  actualizarTipoEquipo,
  eliminarTipoEquipo
} = require("../controllers/tipoEquipo.controller");

router.get("/", obtenerTiposEquipo);
router.get("/:id", obtenerTipoEquipoPorId);
router.post("/", crearTipoEquipo);
router.put("/:id", actualizarTipoEquipo);
router.delete("/:id", eliminarTipoEquipo);

module.exports = router;