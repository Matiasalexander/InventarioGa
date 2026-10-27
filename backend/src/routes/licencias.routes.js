
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
  //no borrar
  asignarLicencia
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

module.exports = router;
