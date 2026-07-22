const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  obtenerInventario,
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario,
  obtenerArbolUnidades,
  exportarInventarioExcel
} = require("../controllers/inventario.controller");

router.get("/arbol-unidades", obtenerArbolUnidades);
router.get("/exportar-excel", exportarInventarioExcel);

router.get("/", obtenerInventario);
router.get("/:id", obtenerInventarioPorId);
router.delete("/:id", eliminarInventario);

//toCreate
router.post("/", upload.single("FOTO"), crearInventario);
router.put("/:id", upload.single("FOTO"), actualizarInventario);
module.exports = router;