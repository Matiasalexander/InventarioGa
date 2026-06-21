const express = require("express");
const router = express.Router();

const {
  obtenerModelosProcesador,
  crearModeloProcesador,
  actualizarModeloProcesador,
  eliminarModeloProcesador
} = require("../controllers/modelosProcesador.controller");

router.get("/", obtenerModelosProcesador);
router.post("/", crearModeloProcesador);
router.put("/:id", actualizarModeloProcesador);
router.delete("/:id", eliminarModeloProcesador);

module.exports = router;