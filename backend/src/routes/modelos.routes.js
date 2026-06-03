const express = require("express");
const router = express.Router();

const {
  obtenerModelos,
  obtenerModeloPorId,
  crearModelo,
  actualizarModelo,
  eliminarModelo
} = require("../controllers/modelos.controller");

router.get("/", obtenerModelos);
router.get("/:id", obtenerModeloPorId);
router.post("/", crearModelo);
router.put("/:id", actualizarModelo);
router.delete("/:id", eliminarModelo);

module.exports = router;