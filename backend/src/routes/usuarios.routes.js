const express = require("express");
const { verificarToken } = require("../middleware/auth.middleware");
const { verificarPermiso } = require("../middleware/permisos.middleware");
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarPasswordUsuario,
  eliminarUsuario
} = require("../controllers/usuarios.controller");

const router = express.Router();

router.get(
  "/",
  verificarToken,
  verificarPermiso("usuarios.ver"),
  obtenerUsuarios
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