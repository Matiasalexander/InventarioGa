const { poolPromise } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");
const {
  obtenerPermisosPorUsuario
} = require("../services/permisos.service");

const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        message: "Correo y contraseña son obligatorios"
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();
    const pool = await poolPromise;

    const result = await pool.request()
      .input("Correo", correoNormalizado)
      .query(`
        SELECT
          U.IdUsuario,
          U.Nombre,
          U.Correo,
          U.PasswordHash,
          U.Rol AS RolAnterior,
          U.IdRol,
          U.Activo,
          U.DebeCambiarPassword,
          R.NOMBRE AS Rol
        FROM dbo.Usuarios U
        LEFT JOIN dbo.Roles R
          ON R.ID_ROL = U.IdRol
         AND R.ACTIVO = 1
        WHERE U.Correo = @Correo
          AND U.Activo = 1;
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

    if (!usuario.IdRol || !usuario.Rol) {
      return res.status(403).json({
        message:
          "El usuario no tiene un rol activo asignado"
      });
    }

    const permisos = await obtenerPermisosPorUsuario(
      usuario.IdUsuario
    );

    const debeCambiarPassword = Boolean(
      usuario.DebeCambiarPassword
    );

    const payloadToken = {
      IdUsuario: usuario.IdUsuario,
      Nombre: usuario.Nombre,
      Correo: usuario.Correo,

      // Nueva relación profesional
      IdRol: usuario.IdRol,
      Rol: usuario.Rol,

      // Se conserva para la lógica actual
      DebeCambiarPassword: debeCambiarPassword
    };

    const token = jwt.sign(
      payloadToken,
      process.env.JWT_SECRET || "InventarioGA2026",
      {
        expiresIn: "8h"
      }
    );

    return res.json({
      token,
      usuario: {
        IdUsuario: usuario.IdUsuario,
        Nombre: usuario.Nombre,
        Correo: usuario.Correo,
        IdRol: usuario.IdRol,
        Rol: usuario.Rol,
        DebeCambiarPassword: debeCambiarPassword,
        permisos
      }
    });

  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
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

    const correoNormalizado = correo.trim().toLowerCase();
    const pool = await poolPromise;

    const usuario = await pool.request()
      .input("Correo", correoNormalizado)
      .query(`
        SELECT
          IdUsuario,
          Nombre,
          Correo
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
          DATEADD(MINUTE, 30, GETDATE())
        )
      `);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: correoNormalizado,
      subject: "Código para restablecer contraseña - Inventario GA2",
      html: `
        <div style="font-family: Arial, sans-serif; color:#111827; line-height:1.6;">
          <h2 style="color:#1e293b;">
            Restablecimiento de contraseña
          </h2>

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

          <hr style="
            border:none;
            border-top:1px solid #e5e7eb;
            margin:24px 0;
          " />

          <p style="font-size:12px; color:#64748b;">
            Este mensaje fue enviado automáticamente por Inventario GA2.
          </p>
        </div>
      `
    });

    return res.json({
      message: "Código enviado correctamente al correo"
    });

  } catch (error) {
    console.error("Error generando código:", error);

    return res.status(500).json({
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

    const correoNormalizado = correo.trim().toLowerCase();
    const pool = await poolPromise;

    const usuario = await pool.request()
      .input("Correo", correoNormalizado)
      .query(`
        SELECT
          IdUsuario
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
        SELECT TOP 1
          IdToken
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
          DebeCambiarPassword = 0,
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

    return res.json({
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("Error restableciendo contraseña:", error);

    return res.status(500).json({
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

    const correoNormalizado = Correo.trim().toLowerCase();
    const pool = await poolPromise;

    const existe = await pool.request()
      .input("Correo", correoNormalizado)
      .query(`
        SELECT IdUsuario
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
      .input("Nombre", Nombre.trim())
      .input("Correo", correoNormalizado)
      .input("Telefono", Telefono || null)
      .input("PasswordHash", hash)
      .input("Rol", Rol || "Usuario")
      .input("DebeCambiarPassword", 1)
      .query(`
        INSERT INTO Usuarios (
          Nombre,
          Correo,
          Telefono,
          PasswordHash,
          Rol,
          DebeCambiarPassword
        )
        VALUES (
          @Nombre,
          @Correo,
          @Telefono,
          @PasswordHash,
          @Rol,
          @DebeCambiarPassword
        )
      `);

    return res.status(201).json({
      message: "Usuario creado correctamente"
    });

  } catch (error) {
    console.error("Error creando usuario:", error);

    return res.status(500).json({
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