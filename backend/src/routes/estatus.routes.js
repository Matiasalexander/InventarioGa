const express = require("express");
const router = express.Router();

const {
  obtenerEstatus,
  crearEstatus,
  actualizarEstatus,
  eliminarEstatus
} = require("../controllers/estatus.controller");

router.get("/", obtenerEstatus);
router.post("/", crearEstatus);
router.put("/:id", actualizarEstatus);
router.delete("/:id", eliminarEstatus);

module.exports = router;