const express = require("express");
const router = express.Router();
const {
obtenerInventario,
obtenerInventarioPorId,
crearInventario,
actualizarInventario,
eliminarInventario

}= require("../controllers/inventario.controller");

router.get("/", obtenerInventario);
router.get("/:id",obtenerInventarioPorId);
router.post("/", crearInventario);
router.put("/:id",actualizarInventario);
router.delete("/:id",eliminarInventario);

module.exports = router;