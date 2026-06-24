const { poolPromise } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {

    const { correo, password } = req.body;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Correo", correo)
      .query(`
        SELECT *
        FROM Usuarios
        WHERE Correo = @Correo
          AND Activo = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos"
      });
    }

    const usuario = result.recordset[0];

    const passwordValido = await bcrypt.compare(
      password,
      usuario.PasswordHash
    );

    if (!passwordValido) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos"
      });
    }

    const token = jwt.sign(
      {
        IdUsuario: usuario.IdUsuario,
        Nombre: usuario.Nombre,
        Correo: usuario.Correo,
        Rol: usuario.Rol
      },
      "InventarioGA2026",
      {
        expiresIn: "8h"
      }
    );

    res.json({
      token,
      usuario: {
        IdUsuario: usuario.IdUsuario,
        Nombre: usuario.Nombre,
        Correo: usuario.Correo,
        Rol: usuario.Rol
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error en login",
      error: error.message
    });
  }
};

const registrarUsuario = async (req, res) => {
  try {

    const {
      Nombre,
      Correo,
      Telefono,
      Password,
      Rol
    } = req.body;

    const pool = await poolPromise;

    const existe = await pool.request()
      .input("Correo", Correo)
      .query(`
        SELECT *
        FROM Usuarios
        WHERE Correo = @Correo
      `);

    if (existe.recordset.length > 0) {
      return res.status(400).json({
        message: "El correo ya existe"
      });
    }

    const hash = await bcrypt.hash(
      Password,
      10
    );

    await pool.request()
      .input("Nombre", Nombre)
      .input("Correo", Correo)
      .input("Telefono", Telefono || null)
      .input("PasswordHash", hash)
      .input("Rol", Rol || "Usuario")
      .query(`
        INSERT INTO Usuarios (
          Nombre,
          Correo,
          Telefono,
          PasswordHash,
          Rol
        )
        VALUES (
          @Nombre,
          @Correo,
          @Telefono,
          @PasswordHash,
          @Rol
        )
      `);

    res.status(201).json({
      message: "Usuario creado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creando usuario",
      error: error.message
    });
  }
};

module.exports = {
  login,
  registrarUsuario
};