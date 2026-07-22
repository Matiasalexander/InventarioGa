const express = require("express");

const {
  obtenerRoles,
  obtenerPermisos,
  obtenerPermisosRol,
  actualizarPermisosRol
} = require("../controllers/roles.controller");

const {
  verificarToken
} = require("../middleware/auth.middleware");

const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/",
  verificarPermiso("roles.ver"),
  obtenerRoles
);

router.get(
  "/permisos",
  verificarPermiso("roles.ver"),
  obtenerPermisos
);

router.get(
  "/:idRol/permisos",
  verificarPermiso("roles.ver"),
  obtenerPermisosRol
);

router.put(
  "/:idRol/permisos",
  verificarPermiso("roles.editar"),
  actualizarPermisosRol
);

module.exports = router;