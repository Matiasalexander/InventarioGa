const express = require("express");
const router = express.Router();

const {
  obtenerDisco,
  crearDisco,
  actualizarDisco,
  eliminarDisco
} = require("../controllers/disco.controller");

router.get("/", obtenerDisco);
router.post("/", crearDisco);
router.put("/:id", actualizarDisco);
router.delete("/:id", eliminarDisco);

module.exports = router;