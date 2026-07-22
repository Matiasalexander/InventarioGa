const express = require("express");

const {
  login,
  registrarUsuario,
  olvidePassword,
  resetPassword
} = require("../controllers/auth.controller");

const router = express.Router();
const {
  verificarToken
} = require("../middleware/auth.middleware");

router.post("/login", login);

router.post("/registro", registrarUsuario);

router.post("/olvide-password", olvidePassword);

router.post("/reset-password", resetPassword);

router.get("/validar-token", verificarToken, (req, res) => {
  return res.json({
    message: "Token válido",
    usuario: req.usuario
  });
});

module.exports = router;