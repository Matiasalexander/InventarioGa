const { poolPromise } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");

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
      process.env.JWT_SECRET || "InventarioGA2026",
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

    if (!correo) {
      return res.status(400).json({
        message: "El correo es obligatorio"
      });
    }

    const pool = await poolPromise;

    const usuario = await pool.request()
      .input("Correo", correo)
      .query(`
        SELECT *
        FROM Usuarios
        WHERE Correo = @Correo
          AND Activo = 1
      `);

    if (usuario.recordset.length === 0) {
      return res.status(404).json({
        message: "No existe un usuario activo con ese correo"
      });
    }

    const codigo = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const IdUsuario = usuario.recordset[0].IdUsuario;
    const NombreUsuario = usuario.recordset[0].Nombre;

    await pool.request()
      .input("IdUsuario", IdUsuario)
      .query(`
        UPDATE PasswordResetTokens
        SET Usado = 1
        WHERE IdUsuario = @IdUsuario
          AND Usado = 0
      `);

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

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: correo,
      subject: "Código para restablecer contraseña - Inventario GA2",
      html: `
        <div style="font-family: Arial, sans-serif; color:#111827; line-height:1.6;">
          <h2 style="color:#1e293b;">Restablecimiento de contraseña</h2>

          <p>Hola ${NombreUsuario || ""},</p>

          <p>
            Recibimos una solicitud para restablecer tu contraseña de
            <strong>Inventario GA2</strong>.
          </p>

          <p>Tu código de recuperación es:</p>

          <div style="
            display:inline-block;
            padding:14px 22px;
            background:#f1f5f9;
            border:1px solid #cbd5e1;
            border-radius:8px;
            font-size:28px;
            font-weight:bold;
            letter-spacing:5px;
            color:#0f172a;
          ">
            ${codigo}
          </div>

          <p>
            Este código vence en <strong>30 minutos</strong>.
          </p>

          <p>
            Si no solicitaste este cambio, puedes ignorar este correo.
          </p>

          <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

          <p style="font-size:12px; color:#64748b;">
            Este mensaje fue enviado automáticamente por Inventario GA2.
          </p>
        </div>
      `
    });

    res.json({
      message: "Código enviado correctamente al correo"
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

    if (!correo || !codigo || !nuevaPassword) {
      return res.status(400).json({
        message: "Correo, código y nueva contraseña son obligatorios"
      });
    }

    const pool = await poolPromise;

    const usuario = await pool.request()
      .input("Correo", correo)
      .query(`
        SELECT *
        FROM Usuarios
        WHERE Correo = @Correo
          AND Activo = 1
      `);

    if (usuario.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado o inactivo"
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

    const hash = await bcrypt.hash(nuevaPassword, 10);

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

    if (!Nombre || !Correo || !Password) {
      return res.status(400).json({
        message: "Nombre, correo y contraseña son obligatorios"
      });
    }

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

    const hash = await bcrypt.hash(Password, 10);

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