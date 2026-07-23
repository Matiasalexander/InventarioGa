const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const {
  verificarToken
} = require("../middleware/auth.middleware");
const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

const {
  obtenerInventario,
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario,
  obtenerArbolUnidades,
  exportarInventarioExcel
} = require("../controllers/inventario.controller");

router.get(
  "/arbol-unidades",
  verificarToken,
  verificarPermiso("inventario.ver"),
  obtenerArbolUnidades
);

router.get(
  "/exportar-excel",
  verificarToken,
  verificarPermiso("inventario.exportar"),
  exportarInventarioExcel
);

router.get(
  "/",
  verificarToken,
  verificarPermiso("inventario.ver"),
  obtenerInventario
);

router.get(
  "/:id",
  verificarToken,
  verificarPermiso("inventario.ver"),
  obtenerInventarioPorId
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("inventario.crear"),
  upload.single("FOTO"),
  crearInventario
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("inventario.editar"),
  upload.single("FOTO"),
  actualizarInventario
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("inventario.eliminar"),
  eliminarInventario
);

module.exports = router;