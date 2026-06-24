const express = require("express");

const {
  login,
  registrarUsuario,
  olvidePassword,
  resetPassword
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", login);

router.post("/registro", registrarUsuario);

router.post("/olvide-password", olvidePassword);

router.post("/reset-password", resetPassword);

module.exports = router;