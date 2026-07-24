const { poolPromise } = require("../config/db");
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const enviarCorreoNuevoUsuario =
  require("../helpers/enviarCorreoNuevoUsuario");

const obtenerUsuarios = async (req, res) => {
  try {
    const pool = await poolPromise;
const result = await pool.request().query(`
  SELECT
    U.IdUsuario,
    U.Nombre,
    U.Correo,
    U.Telefono,
    U.IdRol,
    R.NOMBRE AS Rol,
    U.Activo,
    U.DebeCambiarPassword,
    U.VerTodasUnidades,
    U.FechaCreacion,
    U.FechaActualizacion
  FROM Usuarios U
  LEFT JOIN Roles R
    ON R.ID_ROL = U.IdRol
  ORDER BY U.IdUsuario DESC
`);

    return res.json(result.recordset);

  } catch (error) {
    console.error("Error obteniendo usuarios:", error);

    return res.status(500).json({
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
  .input("IdUsuario", sql.Int, Number(id))
  .query(`
    SELECT
      U.IdUsuario,
      U.Nombre,
      U.Correo,
      U.Telefono,
      U.IdRol,
      R.NOMBRE AS Rol,
      U.Activo,
      U.DebeCambiarPassword,
      U.VerTodasUnidades,
      U.FechaCreacion,
      U.FechaActualizacion
    FROM Usuarios U
    LEFT JOIN Roles R
      ON R.ID_ROL = U.IdRol
    WHERE U.IdUsuario = @IdUsuario
  `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    return res.json(result.recordset[0]);

  } catch (error) {
    console.error("Error obteniendo usuario:", error);

    return res.status(500).json({
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
      IdRol,
      Activo
    } = req.body;

    if (!Nombre || !Correo || !Password || !IdRol) {
      return res.status(400).json({
        message:
          "Nombre, correo, contraseña y rol son obligatorios"
      });
    }

    const nombreNormalizado = Nombre.trim();
    const correoNormalizado = Correo.trim().toLowerCase();
    const idRolNumerico = Number(IdRol);

    if (!Number.isInteger(idRolNumerico)) {
      return res.status(400).json({
        message: "El rol seleccionado no es válido"
      });
    }

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

    const resultadoRol = await pool.request()
      .input("IdRol", idRolNumerico)
      .query(`
        SELECT
          ID_ROL,
          NOMBRE
        FROM Roles
        WHERE ID_ROL = @IdRol
          AND ACTIVO = 1
      `);

    if (resultadoRol.recordset.length === 0) {
      return res.status(400).json({
        message: "El rol seleccionado no existe o está inactivo"
      });
    }

    const nombreRol = resultadoRol.recordset[0].NOMBRE;

    // Solo se conserva temporalmente para enviarla por correo.
    const passwordTemporal = Password;

    // En la base de datos únicamente se almacena el hash.
    const PasswordHash = await bcrypt.hash(
      passwordTemporal,
      10
    );

    const resultadoInsert = await pool.request()
      .input("Nombre", nombreNormalizado)
      .input("Correo", correoNormalizado)
      .input("Telefono", Telefono?.trim() || null)
      .input("PasswordHash", PasswordHash)
      .input("Rol", nombreRol)
      .input("IdRol", idRolNumerico)
      .input("Activo", Activo === false ? 0 : 1)
      .input("DebeCambiarPassword", 1)
      .query(`
        INSERT INTO Usuarios (
          Nombre,
          Correo,
          Telefono,
          PasswordHash,
          Rol,
          IdRol,
          Activo,
          DebeCambiarPassword
        )
        OUTPUT
          INSERTED.IdUsuario,
          INSERTED.Nombre,
          INSERTED.Correo,
          INSERTED.Telefono,
          INSERTED.IdRol,
          INSERTED.Rol,
          INSERTED.Activo
        VALUES (
          @Nombre,
          @Correo,
          @Telefono,
          @PasswordHash,
          @Rol,
          @IdRol,
          @Activo,
          @DebeCambiarPassword
        )
      `);

    let correoEnviado = true;

    try {
      await enviarCorreoNuevoUsuario({
        correo: correoNormalizado,
        nombre: nombreNormalizado,
        passwordTemporal,
        rol: nombreRol
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
      correoEnviado,
      usuario: resultadoInsert.recordset[0]
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
      IdRol,
      Activo
    } = req.body;

    if (!Nombre || !Correo || !IdRol) {
      return res.status(400).json({
        message: "Nombre, correo y rol son obligatorios"
      });
    }

    const nombreNormalizado = Nombre.trim();
    const correoNormalizado = Correo.trim().toLowerCase();
    const idRolNumerico = Number(IdRol);

    if (!Number.isInteger(idRolNumerico)) {
      return res.status(400).json({
        message: "El rol seleccionado no es válido"
      });
    }

    const pool = await poolPromise;

    const usuarioExiste = await pool.request()
      .input("IdUsuario", id)
      .query(`
        SELECT IdUsuario
        FROM Usuarios
        WHERE IdUsuario = @IdUsuario
      `);

    if (usuarioExiste.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    const correoExiste = await pool.request()
      .input("IdUsuario", id)
      .input("Correo", correoNormalizado)
      .query(`
        SELECT IdUsuario
        FROM Usuarios
        WHERE Correo = @Correo
          AND IdUsuario <> @IdUsuario
      `);

    if (correoExiste.recordset.length > 0) {
      return res.status(400).json({
        message: "El correo ya está registrado por otro usuario"
      });
    }

    const resultadoRol = await pool.request()
      .input("IdRol", idRolNumerico)
      .query(`
        SELECT
          ID_ROL,
          NOMBRE
        FROM Roles
        WHERE ID_ROL = @IdRol
          AND ACTIVO = 1
      `);

    if (resultadoRol.recordset.length === 0) {
      return res.status(400).json({
        message: "El rol seleccionado no existe o está inactivo"
      });
    }

    const nombreRol = resultadoRol.recordset[0].NOMBRE;

    await pool.request()
      .input("IdUsuario", id)
      .input("Nombre", nombreNormalizado)
      .input("Correo", correoNormalizado)
      .input("Telefono", Telefono?.trim() || null)
      .input("Rol", nombreRol)
      .input("IdRol", idRolNumerico)
      .input("Activo", Activo === false ? 0 : 1)
      .query(`
        UPDATE Usuarios
        SET
          Nombre = @Nombre,
          Correo = @Correo,
          Telefono = @Telefono,
          Rol = @Rol,
          IdRol = @IdRol,
          Activo = @Activo,
          FechaActualizacion = GETDATE()
        WHERE IdUsuario = @IdUsuario
      `);

    return res.json({
      message: "Usuario actualizado correctamente"
    });

  } catch (error) {
    console.error("Error actualizando usuario:", error);

    return res.status(500).json({
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

    const usuarioExiste = await pool.request()
      .input("IdUsuario", id)
      .query(`
        SELECT IdUsuario
        FROM Usuarios
        WHERE IdUsuario = @IdUsuario
      `);

    if (usuarioExiste.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

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

    return res.json({
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("Error cambiando contraseña:", error);

    return res.status(500).json({
      message: "Error cambiando contraseña",
      error: error.message
    });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const usuarioExiste = await pool.request()
      .input("IdUsuario", id)
      .query(`
        SELECT IdUsuario
        FROM Usuarios
        WHERE IdUsuario = @IdUsuario
      `);

    if (usuarioExiste.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    await pool.request()
      .input("IdUsuario", id)
      .query(`
        DELETE FROM Usuarios
        WHERE IdUsuario = @IdUsuario
      `);

    return res.json({
      message: "Usuario eliminado correctamente"
    });

  } catch (error) {
    console.error("Error eliminando usuario:", error);

    return res.status(500).json({
      message: "Error eliminando usuario",
      error: error.message
    });
  }
};
const obtenerUnidadesUsuario = async (req, res) => {
  try {
    const idUsuario = Number(req.params.id);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({
        message: "El usuario indicado no es válido"
      });
    }

    const pool = await poolPromise;

    const usuarioResult = await pool.request()
      .input("IdUsuario", sql.Int, idUsuario)
      .query(`
        SELECT
          IdUsuario,
          Nombre,
          Correo,
          VerTodasUnidades
        FROM Usuarios
        WHERE IdUsuario = @IdUsuario
      `);

    if (usuarioResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    const unidadesResult = await pool.request()
      .input("IdUsuario", sql.Int, idUsuario)
      .query(`
        SELECT
          UN.id,
          UN.id_marca,
          UN.Ubicacion,
          UN.Estado,
          UU.FechaAsignacion
        FROM Usuario_Unidades UU
        INNER JOIN Unidades UN
          ON UN.id = UU.IdUnidad
        WHERE UU.IdUsuario = @IdUsuario
        ORDER BY
          UN.Ubicacion,
          UN.id_marca
      `);

    return res.json({
      usuario: usuarioResult.recordset[0],
      unidades: unidadesResult.recordset
    });

  } catch (error) {
    console.error(
      "Error obteniendo unidades del usuario:",
      error
    );

    return res.status(500).json({
      message: "Error obteniendo las unidades del usuario",
      error: error.message
    });
  }
};


const actualizarUnidadesUsuario = async (req, res) => {
  let transaction;

  try {
    const idUsuario = Number(req.params.id);

    const {
      VerTodasUnidades = false,
      Unidades = []
    } = req.body;

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({
        message: "El usuario indicado no es válido"
      });
    }

    if (!Array.isArray(Unidades)) {
      return res.status(400).json({
        message: "Las unidades deben enviarse dentro de un arreglo"
      });
    }

    /*
      Convierte todo a número, elimina valores inválidos
      y evita unidades repetidas.
    */
    const unidadesNormalizadas = [
      ...new Set(
        Unidades
          .map((unidad) => Number(unidad))
          .filter(
            (unidad) =>
              Number.isInteger(unidad) &&
              unidad > 0
          )
      )
    ];

    const verTodas = VerTodasUnidades === true;

    if (!verTodas && unidadesNormalizadas.length === 0) {
      return res.status(400).json({
        message:
          "Selecciona por lo menos una unidad o activa la opción de ver todas las unidades"
      });
    }

    const pool = await poolPromise;

    const usuarioExiste = await pool.request()
      .input("IdUsuario", sql.Int, idUsuario)
      .query(`
        SELECT IdUsuario
        FROM Usuarios
        WHERE IdUsuario = @IdUsuario
      `);

    if (usuarioExiste.recordset.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    /*
      Cuando no ve todas las unidades, validamos que cada ID
      enviado realmente exista en la tabla Unidades.
    */
    if (!verTodas) {
      const unidadesExistentes = await pool.request()
        .query(`
          SELECT id
          FROM Unidades
        `);

      const idsExistentes = new Set(
        unidadesExistentes.recordset.map(
          (unidad) => Number(unidad.id)
        )
      );

      const unidadesInvalidas = unidadesNormalizadas.filter(
        (idUnidad) => !idsExistentes.has(idUnidad)
      );

      if (unidadesInvalidas.length > 0) {
        return res.status(400).json({
          message: "Una o más unidades seleccionadas no existen",
          unidadesInvalidas
        });
      }
    }

    transaction = new sql.Transaction(pool);

    await transaction.begin();

    /*
      Actualizar el indicador del usuario.
    */
    await new sql.Request(transaction)
      .input("IdUsuario", sql.Int, idUsuario)
      .input(
        "VerTodasUnidades",
        sql.Bit,
        verTodas ? 1 : 0
      )
      .query(`
        UPDATE Usuarios
        SET
          VerTodasUnidades = @VerTodasUnidades,
          FechaActualizacion = GETDATE()
        WHERE IdUsuario = @IdUsuario
      `);

    /*
      Eliminamos las relaciones anteriores para reemplazarlas
      completamente con la selección actual.
    */
    await new sql.Request(transaction)
      .input("IdUsuario", sql.Int, idUsuario)
      .query(`
        DELETE FROM Usuario_Unidades
        WHERE IdUsuario = @IdUsuario
      `);

    /*
      Si el usuario ve todas las unidades, no necesitamos guardar
      relaciones individuales.
    */
    if (!verTodas) {
      for (const idUnidad of unidadesNormalizadas) {
        await new sql.Request(transaction)
          .input("IdUsuario", sql.Int, idUsuario)
          .input("IdUnidad", sql.Int, idUnidad)
          .query(`
            INSERT INTO Usuario_Unidades (
              IdUsuario,
              IdUnidad
            )
            VALUES (
              @IdUsuario,
              @IdUnidad
            )
          `);
      }
    }

    await transaction.commit();
    transaction = null;

    return res.json({
      message: verTodas
        ? "El usuario ahora puede ver todas las unidades"
        : "Unidades del usuario actualizadas correctamente",
      VerTodasUnidades: verTodas,
      Unidades: verTodas ? [] : unidadesNormalizadas
    });

  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Error revirtiendo la asignación de unidades:",
          rollbackError
        );
      }
    }

    console.error(
      "Error actualizando unidades del usuario:",
      error
    );

    return res.status(500).json({
      message: "Error actualizando las unidades del usuario",
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
  eliminarUsuario,
  obtenerUnidadesUsuario,
  actualizarUnidadesUsuario
};