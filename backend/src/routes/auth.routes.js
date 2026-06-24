const express = require("express");

const {
  login,
  registrarUsuario
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", login);

router.post("/registro", registrarUsuario);

module.exports = router;