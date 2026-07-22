const express = require("express");

const {
  login,
  registrarUsuario,
  olvidePassword,
  resetPassword
} = require("../controllers/auth.controller");

const {
  verificarToken
} = require("../middleware/auth.middleware");

const {
  verificarPermiso
} = require("../middleware/permisos.middleware");

const router = express.Router();

router.post("/login", login);

router.post("/registro", registrarUsuario);

router.post("/olvide-password", olvidePassword);

router.post("/reset-password", resetPassword);

router.get(
  "/validar-token",
  verificarToken,
  (req, res) => {
    return res.json({
      message: "Token válido",
      usuario: req.usuario
    });
  }
);

router.get(
  "/validar-permiso",
  verificarToken,
  verificarPermiso("usuarios.crear"),
  (req, res) => {
    return res.json({
      message: "Permiso válido",
      permiso: "usuarios.crear",
      usuario: req.usuario
    });
  }
);

module.exports = router;