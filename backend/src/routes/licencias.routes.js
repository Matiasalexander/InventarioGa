
const express = require("express");
const router = express.Router();

const {
  verificarToken
} = require("../middleware/auth.middleware");

const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

const {
  obtenerTiposLicencia,
  obtenerLicencias,
  crearLicencia,
  obtenerOpcionesLicencias,
  liberarLicencia,
  obtenerEquiposDeLicencia,
  //no borrar
  asignarLicencia,
  obtenerLicenciasPorEquipo,
  obtenerHistorialLicencia,
  obtenerLicenciasDisponibles, obtenerDetalleLicencia,
  actualizarLicencia, exportarLicenciasExcel
} = require("../controllers/licencias.controller");

// =============================================
// CONSULTAR TIPOS DE LICENCIA
// GET /api/licencias/tipos
// =============================================
router.get(
  "/tipos",
  verificarToken,
  verificarPermiso("licencias.ver"),
  obtenerTiposLicencia
);

//OPCIONES DINÁMICAS DEL FORMULARIO
router.get(
    "/opciones",
    verificarToken,
    verificarPermiso("licencias.ver"),
    obtenerOpcionesLicencias
);
// =============================================
// CONSULTAR LICENCIAS
// GET /api/licencias
// =============================================
router.get(
  "/",
  verificarToken,
  verificarPermiso("licencias.ver"),
  obtenerLicencias
);

router.post(
  "/:id/asignar",
  verificarToken,
  verificarPermiso("licencias.asignar"),
  asignarLicencia
);

router.post(
  "/:id/liberar",
  verificarToken,
  verificarPermiso("licencias.asignar"),
  liberarLicencia
);

router.get(
  "/:id/equipos",
 verificarToken,
  verificarPermiso("licencias.ver"),
 obtenerEquiposDeLicencia
);

// =============================================
// REGISTRAR LICENCIA
// POST /api/licencias
// =============================================
router.post(
  "/",
  verificarToken,
  verificarPermiso("licencias.crear"),
  crearLicencia
);

// =============================================
// LICENCIAS ACTIVAS DE UN EQUIPO
// =============================================
router.get(
  "/equipo/:idEquipo",
  verificarToken,
  verificarPermiso("licencias.ver"),
  obtenerLicenciasPorEquipo
);

// =============================================
// HISTORIAL DE UNA LICENCIA
// =============================================
router.get(
  "/:id/historial",
  verificarToken,
  verificarPermiso("licencias.ver"),
  obtenerHistorialLicencia
);

// =============================================
// LICENCIAS DISPONIBLES PARA ASIGNACIÓN
// =============================================
router.get(
  "/disponibles",
  verificarToken,
  verificarPermiso("licencias.asignar"),
  obtenerLicenciasDisponibles
);

//OBTENER DETALLES DE LA LICENCIA
router.get(
  "/:id/detalle",
  verificarToken,
  verificarPermiso("licencias.ver"),
  obtenerDetalleLicencia
);

//ACTUALIZAR LICENCIA
router.put(
  "/:id",
  verificarToken,
  verificarPermiso("licencias.editar"),
  actualizarLicencia
);

//EXPORTAR GESTOR DE LICENCIAS A EXCEL
router.get("/exportar/excel",
  verificarToken,
  verificarPermiso("licencias.ver"),
  exportarLicenciasExcel
);
module.exports = router;
