const express = require("express");
const router = express.Router();

const {
  obtenerProcesadores,
  crearProcesador,
  actualizarProcesador,
  eliminarProcesador
} = require("../controllers/procesadores.controller");

router.get("/", obtenerProcesadores);
router.post("/", crearProcesador);
router.put("/:id", actualizarProcesador);
router.delete("/:id", eliminarProcesador);

module.exports = router;