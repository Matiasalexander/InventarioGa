const { poolPromise } = require("../config/db");
const bcrypt = require("bcryptjs");

const enviarCorreoNuevoUsuario =
  require("../helpers/enviarCorreoNuevoUsuario");


const obtenerUsuarios = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      
      SELECT
        IdUsuario,
        Nombre,
        Correo,
        Telefono,
        Rol,
        Activo,
        DebeCambiarPassword,
        FechaCreacion,
        FechaActualizacion
      FROM Usuarios
      ORDER BY IdUsuario DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo usuarios",
      error: error.message
    });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("IdUsuario", id)
      .query(`
        SELECT
          IdUsuario,
          Nombre,
          Correo,
          Telefono,
          Rol,
          Activo,
          DebeCambiarPassword,
          FechaCreacion,
          FechaActualizacion
        FROM Usuarios
        WHERE IdUsuario = @IdUsuario
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo usuario",
      error: error.message
    });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const {
      Nombre,
      Correo,
      Telefono,
      Password,
      Rol,
      Activo
    } = req.body;

    if (!Nombre || !Correo || !Password || !Rol) {
      return res.status(400).json({
        message: "Nombre, correo, contraseña y rol son obligatorios"
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
        message: "El correo ya está registrado"
      });
    }

    // La contraseña original solamente se conserva para enviar el correo.
    const passwordTemporal = Password;

    // En la base de datos únicamente se almacena el hash.
    const PasswordHash = await bcrypt.hash(passwordTemporal, 10);

    await pool.request()
      .input("Nombre", Nombre.trim())
      .input("Correo", correoNormalizado)
      .input("Telefono", Telefono || null)
      .input("PasswordHash", PasswordHash)
      .input("Rol", Rol)
      .input("Activo", Activo === false ? 0 : 1)
      .input("DebeCambiarPassword", 1)
      .query(`
        INSERT INTO Usuarios (
          Nombre,
          Correo,
          Telefono,
          PasswordHash,
          Rol,
          Activo,
          DebeCambiarPassword
        )
        VALUES (
          @Nombre,
          @Correo,
          @Telefono,
          @PasswordHash,
          @Rol,
          @Activo,
          @DebeCambiarPassword
        )
      `);

    let correoEnviado = true;

    try {
      await enviarCorreoNuevoUsuario({
        correo: correoNormalizado,
        nombre: Nombre,
        passwordTemporal,
        rol: Rol
      });
    } catch (correoError) {
      correoEnviado = false;
      console.error(
        "Usuario creado, pero falló el envío del correo:",
        correoError
      );
    }

    return res.status(201).json({
      message: correoEnviado
        ? "Usuario creado y accesos enviados correctamente"
        : "Usuario creado, pero no fue posible enviar el correo de accesos",
      correoEnviado
    });
  } catch (error) {
    console.error("Error creando usuario:", error);

    return res.status(500).json({
      message: "Error creando usuario",
      error: error.message
    });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      Nombre,
      Correo,
      Telefono,
      Rol,
      Activo
    } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("IdUsuario", id)
      .input("Nombre", Nombre || null)
      .input("Correo", Correo || null)
      .input("Telefono", Telefono || null)
      .input("Rol", Rol || null)
      .input("Activo", Activo ? 1 : 0)
      .query(`
        UPDATE Usuarios
        SET
          Nombre = @Nombre,
          Correo = @Correo,
          Telefono = @Telefono,
          Rol = @Rol,
          Activo = @Activo,
          FechaActualizacion = GETDATE()
        WHERE IdUsuario = @IdUsuario
      `);

    res.json({
      message: "Usuario actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando usuario",
      error: error.message
    });
  }
};

const cambiarPasswordUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { Password } = req.body;

    if (!Password) {
      return res.status(400).json({
        message: "La nueva contraseña es obligatoria"
      });
    }

    const pool = await poolPromise;

    const PasswordHash = await bcrypt.hash(Password, 10);

    await pool.request()
      .input("IdUsuario", id)
      .input("PasswordHash", PasswordHash)
      .query(`
        UPDATE Usuarios
        SET
          PasswordHash = @PasswordHash,
          DebeCambiarPassword = 0,
          FechaActualizacion = GETDATE()
        WHERE IdUsuario = @IdUsuario
      `);

    res.json({
      message: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error cambiando contraseña",
      error: error.message
    });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("IdUsuario", id)
      .query(`
        DELETE FROM Usuarios
        WHERE IdUsuario = @IdUsuario
      `);

    res.json({
      message: "Usuario eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando usuario",
      error: error.message
    });
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarPasswordUsuario,
  eliminarUsuario
};