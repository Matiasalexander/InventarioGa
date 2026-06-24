const express = require("express");

const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarPasswordUsuario,
  eliminarUsuario
} = require("../controllers/usuarios.controller");

const router = express.Router();

router.get("/", obtenerUsuarios);
router.get("/:id", obtenerUsuarioPorId);
router.post("/", crearUsuario);
router.put("/:id", actualizarUsuario);
router.put("/:id/password", cambiarPasswordUsuario);
router.delete("/:id", eliminarUsuario);

module.exports = router;