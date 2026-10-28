
const sql = require("mssql");
const { poolPromise } = require("../config/db");
require ("../validators/licencias.validator");
    const {validarSqlServer} = require("../validators/sqlServer.validator");

//importar acceso unidad
const {
  usuarioPuedeAccederUnidad
} = require("../services/unidadesAcceso.service");

const {OPCIONES_LICENCIAS, CAMPOS_MODALIDAD} = require("../config/licenciasOpciones");

// =============================================
// GET /api/licencias/tipos
// =============================================
const obtenerTiposLicencia = async (req, res) => {
  try {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT
        ID_TIPO_LICENCIA,
        NOMBRE,
        DESCRIPCION,
        ACTIVO
      FROM dbo.TIPOS_LICENCIA
      WHERE ACTIVO = 1
      ORDER BY NOMBRE
    `);

    return res.status(200).json(resultado.recordset);

  } catch (error) {
    console.error("Error consultando tipos de licencia:", error);

    return res.status(500).json({
      message: "Error consultando tipos de licencia."
    });
  }
};


const { validarLicencia } = require(
  "../validators/licencias.validator"
);

// =============================================
// POST /api/licencias //OSEA CREACIÓN DE LICENCIAS
// =============================================
const crearLicencia = async (req, res) => {
  try {
    const datos = req.body;

    if (!datos || typeof datos !== "object" ||
        Array.isArray(datos)) {
      return res.status(400).json({
        message: "Solicitud inválida."
      });
    }

    // En este sprint todas las licencias
    // se registran inicialmente disponibles.
    if (
      datos.ESTADO !== undefined &&
      datos.ESTADO !== "DISPONIBLE"
    ) {
      return res.status(400).json({
        message:
          "Una licencia nueva debe iniciar como DISPONIBLE."
      });
    }

    const idTipo = Number(datos.ID_TIPO_LICENCIA);

    if (
      !Number.isSafeInteger(idTipo) ||
      idTipo <= 0
    ) {
      return res.status(400).json({
        message: "Selecciona un tipo de licencia válido."
      });
    }

    if (
      datos.ID_EQUIPO !== undefined &&
      datos.ID_EQUIPO !== null
    ) {
      return res.status(400).json({
        message:
          "La asignación a equipos se realiza por separado."
      });
    }

    const pool = await poolPromise;

    // Obtener el tipo real desde SQL Server.
    const tipoResult = await pool.request()
      .input("ID_TIPO", sql.Int, idTipo)
      .query(`
        SELECT
          ID_TIPO_LICENCIA,
          NOMBRE
        FROM dbo.TIPOS_LICENCIA
        WHERE ID_TIPO_LICENCIA = @ID_TIPO
          AND ACTIVO = 1
      `);

    if (tipoResult.recordset.length === 0) {
      return res.status(400).json({
        message: "El tipo de licencia no existe o está inactivo."
      });
    }

    const tipoNombre = tipoResult.recordset[0].NOMBRE;

    const licenciaValidada = validarLicencia(
      {
        ...datos,
        ESTADO: "DISPONIBLE"
      },
      tipoNombre
    );

    if (!licenciaValidada.valido) {
      return res.status(400).json({
        message: "Los datos de la licencia son inválidos.",
        errores: licenciaValidada.errores
      });
    }

    const software = datos.SOFTWARE.trim();
    const version = datos.VERSION.trim();

    // ACTIVADOR describe el método de activación,
    // no una clave o contraseña.
    const activador = datos.ACTIVADOR?.trim() || null;
    const comentarios = datos.COMENTARIOS?.trim() || null;

    const configuracion = JSON.stringify(datos.CONFIGURACION);

    //validar sqlserverlicencia

const sqlServerValidado = validarSqlServer(
  datos,
  tipoNombre
);

if (!sqlServerValidado.valido) {
  return res.status(400).json({
    message:
      "La modalidad de licencia no es compatible con la edición de SQL Server.",
    errores: sqlServerValidado.errores
  });
}

    const resultado = await pool.request()
      .input("SOFTWARE", sql.NVarChar(150), software)
      .input("VERSION", sql.NVarChar(100), version)
      .input("ID_TIPO", sql.Int, idTipo)
      .input(
        "FECHA_ACTIVACION",
        sql.Date,
        datos.FECHA_ACTIVACION || null
      )
      .input("ACTIVADOR", sql.NVarChar(150), activador)
      .input("COMENTARIOS", sql.NVarChar(sql.MAX), comentarios)
      .input("CONFIGURACION", sql.NVarChar(sql.MAX), configuracion)
      .query(`
        INSERT INTO dbo.LICENCIAS (
          SOFTWARE,
          VERSION,
          ID_TIPO_LICENCIA,
          FECHA_ACTIVACION,
          ESTADO,
          ACTIVADOR,
          COMENTARIOS,
          CONFIGURACION
        )
        OUTPUT
          INSERTED.ID_LICENCIA,
          INSERTED.SOFTWARE,
          INSERTED.VERSION,
          INSERTED.ID_TIPO_LICENCIA,
          INSERTED.ESTADO,
          INSERTED.FECHA_REGISTRO
        VALUES (
          @SOFTWARE,
          @VERSION,
          @ID_TIPO,
          @FECHA_ACTIVACION,
          'DISPONIBLE',
          @ACTIVADOR,
          @COMENTARIOS,
          @CONFIGURACION
        )
      `);

    return res.status(201).json({
      message: "Licencia registrada correctamente.",
      licencia: resultado.recordset[0]
    });

  } catch (error) {
    console.error("Error registrando licencia:", error);

    return res.status(500).json({
      message: "Error interno al registrar la licencia."
    });
  }
};


// =============================================
// GET /api/licencias
// =============================================

const obtenerLicencias = async (req, res) => {
  try {
    const { estado, unidad, sinAsignar } = req.query;
    const idUsuario = Number(req.usuario?.IdUsuario);

    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
      return res.status(401).json({
        message: "Usuario no autenticado."
      });
    }

    const estadosPermitidos = [
      "DISPONIBLE",
      "EN_USO",
      "OBSOLETA"
    ];

    if (
      estado !== undefined &&
      !estadosPermitidos.includes(estado)
    ) {
      return res.status(400).json({
        message: "Estado de licencia inválido."
      });
    }

    let idUnidad = null;

    if (unidad !== undefined) {
      if (
        typeof unidad !== "string" ||
        !/^[1-9]\d*$/.test(unidad)
      ) {
        return res.status(400).json({
          message: "ID de unidad inválido."
        });
      }

      idUnidad = Number(unidad);

      if (
        !Number.isSafeInteger(idUnidad) ||
        idUnidad > 2147483647
      ) {
        return res.status(400).json({
          message: "ID de unidad inválido."
        });
      }
    }

    if (
      sinAsignar !== undefined &&
      sinAsignar !== "1"
    ) {
      return res.status(400).json({
        message: "El filtro sinAsignar debe ser 1."
      });
    }

    if (sinAsignar === "1" && idUnidad !== null) {
      return res.status(400).json({
        message:
          "No se puede combinar unidad con sinAsignar."
      });
    }

    const pool = await poolPromise;

    // Confirmar que el usuario esté activo y obtener su rol.
    const usuarioResult = await pool.request()
      .input("IdUsuario", sql.Int, idUsuario)
      .query(`
        SELECT TOP (1)
          U.IdUsuario,
          R.NOMBRE AS ROL
        FROM dbo.Usuarios AS U
        INNER JOIN dbo.Roles AS R
          ON R.ID_ROL = U.IdRol
         AND R.ACTIVO = 1
        WHERE U.IdUsuario = @IdUsuario
          AND U.Activo = 1;
      `);

    if (usuarioResult.recordset.length === 0) {
      return res.status(403).json({
        message: "Usuario sin autorización activa."
      });
    }

    const esAdministrador =
      usuarioResult.recordset[0].ROL === "Administrador";

    if (sinAsignar === "1" && !esAdministrador) {
      return res.status(403).json({
        message:
          "No tienes permiso para consultar licencias sin asignar."
      });
    }

    const resultado = await pool.request()
      .input("ESTADO", sql.NVarChar(20), estado || null)
      .input("ID_UNIDAD", sql.Int, idUnidad)
      .input("ID_USUARIO", sql.Int, idUsuario)
      .input("ES_ADMIN", sql.Bit, esAdministrador)
      .input("SIN_ASIGNAR", sql.Bit, sinAsignar === "1")
      .query(`
        SELECT
          L.ID_LICENCIA,
          L.SOFTWARE,
          L.VERSION,
          L.ID_TIPO_LICENCIA,
          T.NOMBRE AS TIPO_LICENCIA,
          L.FECHA_ACTIVACION,
          L.ESTADO,
          L.COMENTARIOS,
          L.CONFIGURACION,
          L.FECHA_REGISTRO,
          A.ID_ASIGNACION,
          A.ID_EQUIPO,
          E.NOMBRE_EQUIPO,
          E.ID_UNIDAD,
          A.FECHA_ASIGNACION
        FROM dbo.LICENCIAS AS L
        INNER JOIN dbo.TIPOS_LICENCIA AS T
          ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
        LEFT JOIN dbo.LICENCIAS_ASIGNACIONES AS A
          ON A.ID_LICENCIA = L.ID_LICENCIA
         AND A.FECHA_LIBERACION IS NULL
        LEFT JOIN dbo.INVENTARIO_M AS E
          ON E.id = A.ID_EQUIPO
        WHERE
          (@ESTADO IS NULL OR L.ESTADO = @ESTADO)

          AND (
            @ID_UNIDAD IS NULL
            OR E.ID_UNIDAD = @ID_UNIDAD
          )

          AND (
            @SIN_ASIGNAR = 0
            OR A.ID_ASIGNACION IS NULL
          )

          AND (
            @ES_ADMIN = 1
            OR EXISTS (
              SELECT 1
              FROM dbo.Usuario_Unidades AS UU
              WHERE UU.IdUsuario = @ID_USUARIO
                AND UU.IdUnidad = E.ID_UNIDAD
            )
          )
        ORDER BY L.ID_LICENCIA DESC;
      `);

    return res.status(200).json(resultado.recordset);

  } catch (error) {
    console.error(
      "Error consultando licencias por unidad:",
      error
    );

    return res.status(500).json({
      message: "Error consultando licencias."
    });
  }
};

// =============================================
// GET /api/licencias/opciones
// =============================================
const obtenerOpcionesLicencias = async (req, res) => {
  try {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT
        ID_TIPO_LICENCIA,
        NOMBRE
      FROM dbo.TIPOS_LICENCIA
      WHERE ACTIVO = 1
    `);

    const tiposActivos = resultado.recordset;

    const modalidades = tiposActivos
      .filter(tipo =>
        Object.hasOwn(CAMPOS_MODALIDAD, tipo.NOMBRE)
      )
      .map(tipo => ({
        id: tipo.ID_TIPO_LICENCIA,
        codigo: tipo.NOMBRE,
        campos: CAMPOS_MODALIDAD[tipo.NOMBRE]
      }));

    const codigosActivos = new Set(
      modalidades.map(item => item.codigo)
    );

    const software = OPCIONES_LICENCIAS.SQL_SERVER;

    const versiones = software.versiones.map(version => ({
      version: version.version,
      ediciones: version.ediciones.map(edicion => ({
        nombre: edicion.nombre,
        modalidades: edicion.modalidades.filter(
          codigo => codigosActivos.has(codigo)
        )
      }))
    }));

    return res.status(200).json({
      software: [
        {
          codigo: software.codigo,
          nombre: software.nombre,
          versiones
        }
      ],
      modalidades
    });

  } catch (error) {
    console.error(
      "Error consultando opciones de licencias:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron consultar las opciones de licencias."
    });
  }
};

//LIBERAR LICENCIA

const liberarLicencia = async (req, res) => {
  const idLicencia = Number(req.params.id);
  const idUsuario = Number(req.usuario?.IdUsuario);

  if (
    !Number.isSafeInteger(idLicencia) ||
    idLicencia <= 0 ||
    idLicencia > 2147483647
  ) {
    return res.status(400).json({
      message: "ID de licencia inválido."
    });
  }

  if (
    !Number.isSafeInteger(idUsuario) ||
    idUsuario <= 0
  ) {
    return res.status(401).json({
      message: "Usuario no autenticado."
    });
  }

  let transaccion = null;
  let iniciada = false;

  try {
    const pool = await poolPromise;

    transaccion = new sql.Transaction(pool);

    await transaccion.begin(
      sql.ISOLATION_LEVEL.READ_COMMITTED
    );

    iniciada = true;

    // 1. Bloquear la licencia.
    const licenciaResult = await new sql.Request(transaccion)
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        SELECT
          ID_LICENCIA,
          SOFTWARE,
          VERSION,
          ESTADO
        FROM dbo.LICENCIAS WITH (UPDLOCK, HOLDLOCK)
        WHERE ID_LICENCIA = @ID_LICENCIA;
      `);

    if (licenciaResult.recordset.length === 0) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(404).json({
        message: "La licencia no existe."
      });
    }

    const licencia = licenciaResult.recordset[0];

    // 2. Buscar su asignación activa y el equipo.
    const asignacionResult = await new sql.Request(transaccion)
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        SELECT
          A.ID_ASIGNACION,
          A.ID_EQUIPO,
          A.FECHA_ASIGNACION,
          E.ID_UNIDAD,
          E.NOMBRE_EQUIPO
        FROM dbo.LICENCIAS_ASIGNACIONES AS A
          WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.INVENTARIO_M AS E
          ON E.id = A.ID_EQUIPO
        WHERE A.ID_LICENCIA = @ID_LICENCIA
          AND A.FECHA_LIBERACION IS NULL;
      `);

    const asignacion = asignacionResult.recordset[0];

    // Si la licencia aparece en uso pero no tiene una
    // asignación válida, no cambiamos ningún registro.
    if (!asignacion) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "La licencia no tiene una asignación activa válida."
      });
    }

    // 3. Comprobar autorización sobre la unidad actual.
    const autorizado = await usuarioPuedeAccederUnidad(
      idUsuario,
      asignacion.ID_UNIDAD,
      transaccion
    );

    if (!autorizado) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(403).json({
        message:
          "No tienes autorización para liberar licencias de esta unidad."
      });
    }

    // 4. Verificar consistencia del estado.
    if (licencia.ESTADO !== "EN_USO") {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "Solo se pueden liberar licencias en estado EN_USO.",
        estadoActual: licencia.ESTADO
      });
    }

    // 5. Cerrar la asignación sin eliminar su historial.
    const liberacionResult = await new sql.Request(transaccion)
      .input(
        "ID_ASIGNACION",
        sql.Int,
        asignacion.ID_ASIGNACION
      )
      .query(`
        UPDATE dbo.LICENCIAS_ASIGNACIONES
        SET FECHA_LIBERACION = SYSUTCDATETIME()
        OUTPUT
          INSERTED.ID_ASIGNACION,
          INSERTED.ID_LICENCIA,
          INSERTED.ID_EQUIPO,
          INSERTED.FECHA_ASIGNACION,
          INSERTED.FECHA_LIBERACION
        WHERE ID_ASIGNACION = @ID_ASIGNACION
          AND FECHA_LIBERACION IS NULL;
      `);

    if (liberacionResult.recordset.length !== 1) {
      throw new Error(
        "No se pudo cerrar la asignación activa."
      );
    }

    // 6. Devolver la licencia al estado DISPONIBLE.
    const estadoResult = await new sql.Request(transaccion)
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        UPDATE dbo.LICENCIAS
        SET ESTADO = 'OBSOLETA'
        WHERE ID_LICENCIA = @ID_LICENCIA
          AND ESTADO = 'EN_USO';
      `);

    if (estadoResult.rowsAffected[0] !== 1) {
      throw new Error(
        "No se pudo actualizar el estado de la licencia."
      );
    }

    // 7. Confirmar ambas operaciones.
    await transaccion.commit();
    iniciada = false;

    return res.status(200).json({
      message: "Licencia liberada correctamente.",
      licencia: {
        ID_LICENCIA: licencia.ID_LICENCIA,
        SOFTWARE: licencia.SOFTWARE,
        VERSION: licencia.VERSION,
        ESTADO: "OBSOLETA",
        ID_UNIDAD: null
      },
      ultimaAsignacion: liberacionResult.recordset[0]
    });

  } catch (error) {
    if (iniciada && transaccion) {
      try {
        await transaccion.rollback();
      } catch (errorRollback) {
        console.error(
          "Error revirtiendo liberación:",
          errorRollback
        );
      }
    }

    console.error("Error liberando licencia:", error);

    return res.status(500).json({
      message: "Error interno al liberar la licencia."
    });
  }
};


//ASIGNAR LICENCIA

/**
 * POST /api/licencias/:id/asignar
 *
 * Asigna una licencia disponible a un equipo
 * existente en INVENTARIO_M.
 *
 * La unidad de la licencia se determina a través
 * del ID_UNIDAD del equipo asignado.
 */
const asignarLicencia = async (req, res) => {
  const idLicencia = Number(req.params.id);
  const idEquipo = Number(req.body?.ID_EQUIPO);
  const idUsuario = Number(req.usuario?.IdUsuario);

  // 1. Validar parámetros.
  const esIdValido = (valor) =>
    Number.isSafeInteger(valor) &&
    valor > 0 &&
    valor <= 2147483647;

  if (!esIdValido(idLicencia)) {
    return res.status(400).json({
      message: "ID de licencia inválido."
    });
  }

  if (!esIdValido(idEquipo)) {
    return res.status(400).json({
      message: "Selecciona un equipo válido."
    });
  }

  if (!esIdValido(idUsuario)) {
    return res.status(401).json({
      message: "Usuario no autenticado."
    });
  }

  let transaccion = null;
  let iniciada = false;

  try {
    const pool = await poolPromise;

    transaccion = new sql.Transaction(pool);

    await transaccion.begin(
      sql.ISOLATION_LEVEL.READ_COMMITTED
    );

    iniciada = true;

    // 2. Bloquear la licencia durante la operación.
    const licenciaResult = await new sql.Request(transaccion)
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        SELECT
          ID_LICENCIA,
          SOFTWARE,
          VERSION,
          ESTADO
        FROM dbo.LICENCIAS WITH (UPDLOCK, HOLDLOCK)
        WHERE ID_LICENCIA = @ID_LICENCIA;
      `);

    if (licenciaResult.recordset.length === 0) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(404).json({
        message: "La licencia no existe."
      });
    }

    const licencia = licenciaResult.recordset[0];

    // 3. Verificar el equipo y bloquearlo para
    // mantener estable su unidad durante la operación.
    const equipoResult = await new sql.Request(transaccion)
      .input("ID_EQUIPO", sql.Int, idEquipo)
      .query(`
        SELECT
          id,
          ID_UNIDAD,
          NOMBRE_EQUIPO
        FROM dbo.INVENTARIO_M WITH (HOLDLOCK)
        WHERE id = @ID_EQUIPO;
      `);

    if (equipoResult.recordset.length === 0) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(404).json({
        message: "El equipo no existe."
      });
    }

    const equipo = equipoResult.recordset[0];

    // 4. Comprobar acceso a la unidad.
    const autorizado = await usuarioPuedeAccederUnidad(
      idUsuario,
      equipo.ID_UNIDAD,
      transaccion
    );

    if (!autorizado) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(403).json({
        message:
          "No tienes autorización para asignar licencias a esta unidad."
      });
    }

    // 5. Verificar disponibilidad.
    if (licencia.ESTADO !== "DISPONIBLE") {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "La licencia no está disponible para asignación.",
        estadoActual: licencia.ESTADO
      });
    }

    // 6. Validar que no exista una asignación activa.
    const asignacionActiva = await new sql.Request(transaccion)
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        SELECT TOP (1)
          ID_ASIGNACION
        FROM dbo.LICENCIAS_ASIGNACIONES
        WHERE ID_LICENCIA = @ID_LICENCIA
          AND FECHA_LIBERACION IS NULL;
      `);

    if (asignacionActiva.recordset.length > 0) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "La licencia ya tiene una asignación activa."
      });
    }

    // 7. Crear asignación.
    const nuevaAsignacion = await new sql.Request(transaccion)
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .input("ID_EQUIPO", sql.Int, idEquipo)
      .query(`
        INSERT INTO dbo.LICENCIAS_ASIGNACIONES (
          ID_LICENCIA,
          ID_EQUIPO,
          FECHA_ASIGNACION
        )
        OUTPUT
          INSERTED.ID_ASIGNACION,
          INSERTED.ID_LICENCIA,
          INSERTED.ID_EQUIPO,
          INSERTED.FECHA_ASIGNACION
        VALUES (
          @ID_LICENCIA,
          @ID_EQUIPO,
          SYSUTCDATETIME()
        );
      `);

    // 8. Cambiar el estado a EN_USO.
    const estadoResult = await new sql.Request(transaccion)
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        UPDATE dbo.LICENCIAS
        SET ESTADO = 'EN_USO'
        WHERE ID_LICENCIA = @ID_LICENCIA
          AND ESTADO = 'DISPONIBLE';
      `);

    if (estadoResult.rowsAffected[0] !== 1) {
      throw new Error(
        "No se pudo actualizar el estado de la licencia."
      );
    }

    // 9. Confirmar los cambios.
    await transaccion.commit();
    iniciada = false;

    return res.status(201).json({
      message: "Licencia asignada correctamente.",
      asignacion: nuevaAsignacion.recordset[0],
      licencia: {
        ID_LICENCIA: licencia.ID_LICENCIA,
        SOFTWARE: licencia.SOFTWARE,
        VERSION: licencia.VERSION,
        ESTADO: "EN_USO",
        ID_UNIDAD: equipo.ID_UNIDAD
      },
      equipo: {
        id: equipo.id,
        NOMBRE_EQUIPO: equipo.NOMBRE_EQUIPO,
        ID_UNIDAD: equipo.ID_UNIDAD
      }
    });

  } catch (error) {
    if (iniciada && transaccion) {
      try {
        await transaccion.rollback();
      } catch (errorRollback) {
        console.error(
          "Error revirtiendo asignación:",
          errorRollback
        );
      }
    }

    console.error("Error asignando licencia:", error);

    // Índice único: no permite más de una
    // asignación activa por licencia.
    if ([2601, 2627].includes(error.number)) {
      return res.status(409).json({
        message:
          "La licencia ya tiene una asignación activa."
      });
    }

    return res.status(500).json({
      message:
        "Error interno al asignar la licencia."
    });
  }
};


/**
 * GET /api/licencias/equipo/:idEquipo
 *
 * Obtiene las licencias con asignación activa
 * a un equipo de INVENTARIO_M.
 */
const obtenerLicenciasPorEquipo = async (req, res) => {
  const idEquipo = Number(req.params.idEquipo);
  const idUsuario = Number(req.usuario?.IdUsuario);

  const idValido = (id) =>
    Number.isSafeInteger(id) &&
    id > 0 &&
    id <= 2147483647;

  if (!idValido(idEquipo)) {
    return res.status(400).json({
      message: "ID de equipo inválido."
    });
  }

  if (!idValido(idUsuario)) {
    return res.status(401).json({
      message: "Usuario no autenticado."
    });
  }

  try {
    const pool = await poolPromise;

    // 1. Comprobar existencia del equipo.
    const equipoResult = await pool.request()
      .input("ID_EQUIPO", sql.Int, idEquipo)
      .query(`
        SELECT
          id,
          NOMBRE_EQUIPO,
          ID_UNIDAD
        FROM dbo.INVENTARIO_M
        WHERE id = @ID_EQUIPO;
      `);

    if (equipoResult.recordset.length === 0) {
      return res.status(404).json({
        message: "El equipo no existe."
      });
    }

    const equipo = equipoResult.recordset[0];

    // 2. Validar acceso a la unidad del equipo.
    const autorizado = await usuarioPuedeAccederUnidad(
      idUsuario,
      equipo.ID_UNIDAD
    );

    if (!autorizado) {
      return res.status(403).json({
        message:
          "No tienes autorización para consultar las licencias de este equipo."
      });
    }

    // 3. Recuperar solamente las asignaciones activas.
    const resultado = await pool.request()
      .input("ID_EQUIPO", sql.Int, idEquipo)
      .input("ID_UNIDAD", sql.Int, equipo.ID_UNIDAD)
      .query(`
        SELECT
          L.ID_LICENCIA,
          L.SOFTWARE,
          L.VERSION,
          L.ID_TIPO_LICENCIA,
          T.NOMBRE AS TIPO_LICENCIA,
          L.FECHA_ACTIVACION,
          L.ESTADO,
          L.COMENTARIOS,
          L.CONFIGURACION,
          A.ID_ASIGNACION,
          A.FECHA_ASIGNACION
        FROM dbo.LICENCIAS_ASIGNACIONES AS A
        INNER JOIN dbo.LICENCIAS AS L
          ON L.ID_LICENCIA = A.ID_LICENCIA
        INNER JOIN dbo.TIPOS_LICENCIA AS T
          ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
        INNER JOIN dbo.INVENTARIO_M AS E
          ON E.id = A.ID_EQUIPO
        WHERE A.ID_EQUIPO = @ID_EQUIPO
          AND E.ID_UNIDAD = @ID_UNIDAD
          AND A.FECHA_LIBERACION IS NULL
          AND L.ESTADO = 'EN_USO'
        ORDER BY A.FECHA_ASIGNACION DESC,
                 A.ID_ASIGNACION DESC;
      `);

    return res.status(200).json({
      equipo: {
        ID_EQUIPO: equipo.id,
        NOMBRE_EQUIPO: equipo.NOMBRE_EQUIPO,
        ID_UNIDAD: equipo.ID_UNIDAD
      },
      total: resultado.recordset.length,
      licencias: resultado.recordset
    });

  } catch (error) {
    console.error(
      "Error consultando licencias por equipo:",
      error
    );

    return res.status(500).json({
      message:
        "Error interno consultando licencias por equipo."
    });
  }
};


/**
 * GET /api/licencias/:id/historial
 *
 * Consulta el historial completo de asignaciones.
 * Por ahora solamente el administrador puede verlo.
 */
const obtenerHistorialLicencia = async (req, res) => {
  const idLicencia = Number(req.params.id);
  const idUsuario = Number(req.usuario?.IdUsuario);

  const idValido = (id) =>
    Number.isSafeInteger(id) &&
    id > 0 &&
    id <= 2147483647;

  if (!idValido(idLicencia)) {
    return res.status(400).json({
      message: "ID de licencia inválido."
    });
  }

  if (!idValido(idUsuario)) {
    return res.status(401).json({
      message: "Usuario no autenticado."
    });
  }

  try {
    const pool = await poolPromise;

    // 1. Validar que sea administrador activo.
    const usuarioResult = await pool.request()
      .input("ID_USUARIO", sql.Int, idUsuario)
      .query(`
        SELECT TOP (1)
          U.IdUsuario
        FROM dbo.Usuarios AS U
        INNER JOIN dbo.Roles AS R
          ON R.ID_ROL = U.IdRol
         AND R.ACTIVO = 1
        WHERE U.IdUsuario = @ID_USUARIO
          AND U.Activo = 1
          AND R.NOMBRE = 'Administrador';
      `);

    if (usuarioResult.recordset.length === 0) {
      return res.status(403).json({
        message:
          "El historial completo requiere autorización de administrador."
      });
    }

    // 2. Consultar la licencia sin exponer ACTIVADOR.
    const licenciaResult = await pool.request()
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        SELECT
          L.ID_LICENCIA,
          L.SOFTWARE,
          L.VERSION,
          L.ESTADO,
          T.NOMBRE AS TIPO_LICENCIA
        FROM dbo.LICENCIAS AS L
        INNER JOIN dbo.TIPOS_LICENCIA AS T
          ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
        WHERE L.ID_LICENCIA = @ID_LICENCIA;
      `);

    if (licenciaResult.recordset.length === 0) {
      return res.status(404).json({
        message: "La licencia no existe."
      });
    }

    // 3. Consultar todas las asignaciones.
    const historialResult = await pool.request()
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        SELECT
          A.ID_ASIGNACION,
          A.ID_LICENCIA,
          A.ID_EQUIPO,
          E.NOMBRE_EQUIPO,
          E.ID_UNIDAD AS ID_UNIDAD_ACTUAL_EQUIPO,
          A.FECHA_ASIGNACION,
          A.FECHA_LIBERACION,
          CASE
            WHEN A.FECHA_LIBERACION IS NULL
              THEN 'ACTIVA'
            ELSE 'LIBERADA'
          END AS ESTADO_ASIGNACION
        FROM dbo.LICENCIAS_ASIGNACIONES AS A
        LEFT JOIN dbo.INVENTARIO_M AS E
          ON E.id = A.ID_EQUIPO
        WHERE A.ID_LICENCIA = @ID_LICENCIA
        ORDER BY
          A.FECHA_ASIGNACION DESC,
          A.ID_ASIGNACION DESC;
      `);

    return res.status(200).json({
      licencia: licenciaResult.recordset[0],
      totalAsignaciones: historialResult.recordset.length,
      historial: historialResult.recordset
    });

  } catch (error) {
    console.error(
      "Error consultando historial de licencia:",
      error
    );

    return res.status(500).json({
      message:
        "Error interno consultando el historial de la licencia."
    });
  }
};


/**
 * GET /api/licencias/disponibles
 *
 * Consulta licencias disponibles para asignación.
 * No expone ACTIVADOR.
 */
const obtenerLicenciasDisponibles = async (req, res) => {
  try {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT
        L.ID_LICENCIA,
        L.SOFTWARE,
        L.VERSION,
        L.ID_TIPO_LICENCIA,
        T.NOMBRE AS TIPO_LICENCIA,
        L.ESTADO,
        L.CONFIGURACION,
        L.COMENTARIOS
      FROM dbo.LICENCIAS AS L
      INNER JOIN dbo.TIPOS_LICENCIA AS T
        ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
      WHERE L.ESTADO = 'DISPONIBLE'
        AND NOT EXISTS (
          SELECT 1
          FROM dbo.LICENCIAS_ASIGNACIONES AS A
          WHERE A.ID_LICENCIA = L.ID_LICENCIA
            AND A.FECHA_LIBERACION IS NULL
        )
      ORDER BY
        L.SOFTWARE,
        L.VERSION,
        L.ID_LICENCIA;
    `);

    return res.status(200).json({
      total: resultado.recordset.length,
      licencias: resultado.recordset
    });

  } catch (error) {
    console.error(
      "Error consultando licencias disponibles:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron consultar las licencias disponibles."
    });
  }
};

// ESTE ENDPOINT ES PARA OBTENER DETALLES DE LA LICENCIA

const obtenerDetalleLicencia = async (req, res) => {
  const idLicencia = Number(req.params.id);
  const idUsuario = Number(req.usuario?.IdUsuario);

  const idValido = (valor) =>
    Number.isSafeInteger(valor) &&
    valor > 0 &&
    valor <= 2147483647;

  if (!idValido(idLicencia)) {
    return res.status(400).json({
      message: "ID de licencia inválido."
    });
  }

  if (!idValido(idUsuario)) {
    return res.status(401).json({
      message: "Usuario no autenticado."
    });
  }

  try {
    const pool = await poolPromise;

    const resultado = await pool.request()
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .input("ID_USUARIO", sql.Int, idUsuario)
      .query(`
        SELECT
          L.ID_LICENCIA,
          L.SOFTWARE,
          L.VERSION,
          L.ID_TIPO_LICENCIA,
          T.NOMBRE AS TIPO_LICENCIA,
          T.DESCRIPCION AS DESCRIPCION_TIPO,
          L.FECHA_ACTIVACION,
          L.ESTADO,
          L.COMENTARIOS,
          L.CONFIGURACION,
          L.FECHA_REGISTRO,

          CASE
            WHEN R.NOMBRE = 'Administrador'
              THEN L.ACTIVADOR
            ELSE NULL
          END AS ACTIVADOR,

          A.ID_ASIGNACION,
          A.ID_EQUIPO,
          A.FECHA_ASIGNACION,
          E.NOMBRE_EQUIPO,
          E.ID_UNIDAD

        FROM dbo.LICENCIAS AS L

        INNER JOIN dbo.TIPOS_LICENCIA AS T
          ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA

        CROSS JOIN dbo.Usuarios AS U

        INNER JOIN dbo.Roles AS R
          ON R.ID_ROL = U.IdRol
         AND R.ACTIVO = 1

        LEFT JOIN dbo.LICENCIAS_ASIGNACIONES AS A
          ON A.ID_LICENCIA = L.ID_LICENCIA
         AND A.FECHA_LIBERACION IS NULL

        LEFT JOIN dbo.INVENTARIO_M AS E
          ON E.id = A.ID_EQUIPO

        WHERE L.ID_LICENCIA = @ID_LICENCIA
          AND U.IdUsuario = @ID_USUARIO
          AND U.Activo = 1
          AND (
            R.NOMBRE = 'Administrador'
            OR (
              A.ID_ASIGNACION IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM dbo.Usuario_Unidades AS UU
                WHERE UU.IdUsuario = U.IdUsuario
                  AND UU.IdUnidad = E.ID_UNIDAD
              )
            )
          );
      `);

    if (resultado.recordset.length === 0) {
      // No distinguir entre inexistencia y falta de
      // acceso a una licencia de otra unidad.
      return res.status(404).json({
        message: "Licencia no encontrada o no disponible."
      });
    }

    const licencia = resultado.recordset[0];

    return res.status(200).json({
      licencia: {
        ID_LICENCIA: licencia.ID_LICENCIA,
        SOFTWARE: licencia.SOFTWARE,
        VERSION: licencia.VERSION,
        ID_TIPO_LICENCIA: licencia.ID_TIPO_LICENCIA,
        TIPO_LICENCIA: licencia.TIPO_LICENCIA,
        DESCRIPCION_TIPO: licencia.DESCRIPCION_TIPO,
        FECHA_ACTIVACION: licencia.FECHA_ACTIVACION,
        ESTADO: licencia.ESTADO,
        ACTIVADOR: licencia.ACTIVADOR,
        COMENTARIOS: licencia.COMENTARIOS,
        CONFIGURACION: licencia.CONFIGURACION,
        FECHA_REGISTRO: licencia.FECHA_REGISTRO
      },
      asignacionActual: licencia.ID_ASIGNACION
        ? {
            ID_ASIGNACION: licencia.ID_ASIGNACION,
            ID_EQUIPO: licencia.ID_EQUIPO,
            NOMBRE_EQUIPO: licencia.NOMBRE_EQUIPO,
            ID_UNIDAD: licencia.ID_UNIDAD,
            FECHA_ASIGNACION: licencia.FECHA_ASIGNACION
          }
        : null
    });

  } catch (error) {
    console.error(
      "Error consultando detalle de licencia:",
      error
    );

    return res.status(500).json({
      message: "Error consultando detalle de licencia."
    });
  }
};


//EDITAR LICENCIAS

const actualizarLicencia = async (req, res) => {
  const idLicencia = Number(req.params.id);

  if (
    !Number.isSafeInteger(idLicencia) ||
    idLicencia <= 0 ||
    idLicencia > 2147483647
  ) {
    return res.status(400).json({
      message: "ID de licencia inválido."
    });
  }

  const { SOFTWARE, VERSION, COMENTARIOS } = req.body ?? {};

  if (
    typeof SOFTWARE !== "string" ||
    !SOFTWARE.trim() ||
    typeof VERSION !== "string" ||
    !VERSION.trim() ||
    (COMENTARIOS != null &&
      typeof COMENTARIOS !== "string")
  ) {
    return res.status(400).json({
      message: "Datos de licencia inválidos."
    });
  }

  try {
    const pool = await poolPromise;

    const resultado = await pool.request()
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .input("SOFTWARE", sql.NVarChar, SOFTWARE.trim())
      .input("VERSION", sql.NVarChar, VERSION.trim())
      .input("COMENTARIOS", sql.NVarChar(sql.MAX), COMENTARIOS ?? null)
      .query(`
        UPDATE dbo.LICENCIAS
        SET
          SOFTWARE = @SOFTWARE,
          VERSION = @VERSION,
          COMENTARIOS = @COMENTARIOS
        OUTPUT
          INSERTED.ID_LICENCIA,
          INSERTED.SOFTWARE,
          INSERTED.VERSION,
          INSERTED.COMENTARIOS,
          INSERTED.ESTADO
        WHERE ID_LICENCIA = @ID_LICENCIA;
      `);

    if (!resultado.recordset.length) {
      return res.status(404).json({
        message: "Licencia no encontrada."
      });
    }

    return res.status(200).json({
      message: "Licencia actualizada correctamente.",
      licencia: resultado.recordset[0]
    });
  } catch (error) {
    console.error("Error actualizando licencia:", error);

    return res.status(500).json({
      message: "No se pudo actualizar la licencia."
    });
  }
};



module.exports = {
  obtenerTiposLicencia,
  obtenerLicencias,
  obtenerOpcionesLicencias,
  crearLicencia,
  asignarLicencia,
  liberarLicencia,
  obtenerLicenciasPorEquipo,
  obtenerHistorialLicencia,
  obtenerLicenciasDisponibles,
  obtenerDetalleLicencia, actualizarLicencia
};
