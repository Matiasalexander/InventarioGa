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

router.post(
  "/registro",
  verificarToken,
  verificarPermiso("usuarios.crear"),
  registrarUsuario
);

router.post("/olvide-password", olvidePassword);

router.post("/reset-password", resetPassword);

/*
  Ruta temporal para validar JWT.
  La podemos eliminar cuando terminemos todas las pruebas.
*/
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

module.exports = router;