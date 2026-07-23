const express = require("express");
const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

const {
  crearResponsiva,
  actualizarResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  obtenerResponsivasPorEquipo,
  eliminarResponsiva,
  marcarEquipoDevuelto,
  obtenerEquiposDisponibles,
  descargarResponsivaPdf,
  reenviarResponsivaCorreo
} = require("../controllers/responsiva.controller");

const router = express.Router();

router.get(
  "/",
  verificarToken,
  verificarPermiso("responsivas.ver"),
  obtenerResponsivas
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("responsivas.crear"),
  crearResponsiva
);

router.get(
  "/equipos/disponibles",
  verificarToken,
  verificarPermiso("responsivas.crear"),
  obtenerEquiposDisponibles
);

router.get(
  "/equipo/:idInventario/historial",
  verificarToken,
  verificarPermiso("responsivas.ver"),
  obtenerResponsivasPorEquipo
);

router.put(
  "/detalle/:idDetalle/devolver",
  verificarToken,
  verificarPermiso("responsivas.devolver"),
  marcarEquipoDevuelto
);

router.get(
  "/:id/pdf",
  verificarToken,
  verificarPermiso("responsivas.pdf"),
  descargarResponsivaPdf
);

router.post(
  "/:id/enviar",
  verificarToken,
  verificarPermiso("responsivas.pdf"),
  reenviarResponsivaCorreo
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("responsivas.editar"),
  actualizarResponsiva
);

router.get(
  "/:id",
  verificarToken,
  verificarPermiso("responsivas.ver"),
  obtenerResponsivaPorId
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("responsivas.eliminar"),
  eliminarResponsiva
);

module.exports = router;