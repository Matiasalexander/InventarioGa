const express = require("express");

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

router.get("/", obtenerResponsivas);
router.post("/", crearResponsiva);

router.get("/equipos/disponibles", obtenerEquiposDisponibles);
router.get("/equipo/:idInventario/historial", obtenerResponsivasPorEquipo);

router.put("/detalle/:idDetalle/devolver", marcarEquipoDevuelto);

router.get("/:id/pdf", descargarResponsivaPdf);
router.post("/:id/enviar", reenviarResponsivaCorreo);
router.put("/:id", actualizarResponsiva);

router.get("/:id", obtenerResponsivaPorId);
router.delete("/:id", eliminarResponsiva);

module.exports = router;