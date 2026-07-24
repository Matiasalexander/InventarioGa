const express = require("express");

const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");

const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarPasswordUsuario,
  eliminarUsuario,
  obtenerUnidadesUsuario,
  actualizarUnidadesUsuario
} = require("../controllers/usuarios.controller");

const router = express.Router();

router.get(
  "/",
  verificarToken,
  verificarPermiso("usuarios.ver"),
  obtenerUsuarios
);

/*
  Consultar las unidades asignadas a un usuario.
*/
router.get(
  "/:id/unidades",
  verificarToken,
  verificarPermiso("usuarios.ver"),
  obtenerUnidadesUsuario
);

/*
  Reemplazar las unidades asignadas a un usuario.
*/
router.put(
  "/:id/unidades",
  verificarToken,
  verificarPermiso("usuarios.editar"),
  actualizarUnidadesUsuario
);

router.get(
  "/:id",
  verificarToken,
  verificarPermiso("usuarios.ver"),
  obtenerUsuarioPorId
);

router.post(
  "/",
  verificarToken,
  verificarPermiso("usuarios.crear"),
  crearUsuario
);

router.put(
  "/:id",
  verificarToken,
  verificarPermiso("usuarios.editar"),
  actualizarUsuario
);

router.put(
  "/:id/password",
  verificarToken,
  verificarPermiso("usuarios.password"),
  cambiarPasswordUsuario
);

router.delete(
  "/:id",
  verificarToken,
  verificarPermiso("usuarios.eliminar"),
  eliminarUsuario
);

module.exports = router;