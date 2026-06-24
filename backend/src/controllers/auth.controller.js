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

const olvidePassword = async (req, res) => {
  try {

    const { correo } = req.body;

    const pool = await poolPromise;

    const usuario = await pool.request()
      .input("Correo", correo)
      .query(`
        SELECT *
        FROM Usuarios
        WHERE Correo = @Correo
      `);

    if (usuario.recordset.length === 0) {
      return res.status(404).json({
        message: "No existe un usuario con ese correo"
      });
    }

    const codigo = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const IdUsuario = usuario.recordset[0].IdUsuario;

    await pool.request()
      .input("IdUsuario", IdUsuario)
      .input("Token", codigo)
      .input("Codigo", codigo)
      .query(`
        INSERT INTO PasswordResetTokens (
          IdUsuario,
          Token,
          Codigo,
          FechaExpiracion
        )
        VALUES (
          @IdUsuario,
          @Token,
          @Codigo,
          DATEADD(MINUTE,30,GETDATE())
        )
      `);

    res.json({
      message: "Código generado correctamente",
      codigo
    });

  } catch (error) {
    res.status(500).json({
      message: "Error generando código",
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {

    const {
      correo,
      codigo,
      nuevaPassword
    } = req.body;

    const pool = await poolPromise;

    const usuario = await pool.request()
      .input("Correo", correo)
      .query(`
        SELECT *
        FROM Usuarios
        WHERE Correo = @Correo
      `);

    if (usuario.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    const IdUsuario = usuario.recordset[0].IdUsuario;

    const token = await pool.request()
      .input("IdUsuario", IdUsuario)
      .input("Codigo", codigo)
      .query(`
        SELECT TOP 1 *
        FROM PasswordResetTokens
        WHERE IdUsuario = @IdUsuario
          AND Codigo = @Codigo
          AND Usado = 0
          AND FechaExpiracion >= GETDATE()
        ORDER BY IdToken DESC
      `);

    if (token.recordset.length === 0) {
      return res.status(400).json({
        message: "Código inválido o expirado"
      });
    }

    const hash = await bcrypt.hash(
      nuevaPassword,
      10
    );

    await pool.request()
      .input("IdUsuario", IdUsuario)
      .input("PasswordHash", hash)
      .query(`
        UPDATE Usuarios
        SET
          PasswordHash = @PasswordHash,
          FechaActualizacion = GETDATE()
        WHERE IdUsuario = @IdUsuario
      `);

    await pool.request()
      .input("IdToken", token.recordset[0].IdToken)
      .query(`
        UPDATE PasswordResetTokens
        SET Usado = 1
        WHERE IdToken = @IdToken
      `);

    res.json({
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error restableciendo contraseña",
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
  registrarUsuario,
  olvidePassword,
  resetPassword
};