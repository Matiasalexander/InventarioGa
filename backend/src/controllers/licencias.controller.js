
const sql = require("mssql");
const { poolPromise } = require("../config/db");
require ("../validators/licencias.validator");
    const {validarSqlServer} = require("../validators/sqlServer.validator");

//importar acceso unidad
const {
  usuarioPuedeAccederUnidad
} = require("../services/unidadesAcceso.service");

const {OPCIONES_LICENCIAS, CAMPOS_MODALIDAD} = require("../config/licenciasOpciones");

const {generarLicenciasExcel} = require("../services/excel/licenciasExcel.service");

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
  const datos = req.body;

  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    return res.status(400).json({
      message: "Solicitud inválida."
    });
  }

  if (
    datos.ESTADO !== undefined &&
    datos.ESTADO !== "DISPONIBLE"
  ) {
    return res.status(400).json({
      message:
        "Una licencia nueva debe iniciar como DISPONIBLE."
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

  const idTipo = Number(datos.ID_TIPO_LICENCIA);

  if (
    !Number.isSafeInteger(idTipo) ||
    idTipo <= 0 ||
    idTipo > 2147483647
  ) {
    return res.status(400).json({
      message: "Selecciona un tipo de licencia válido."
    });
  }

  let transaccion = null;
  let iniciada = false;

  try {
    const pool = await poolPromise;

    const tipoResult = await pool.request()
      .input("ID_TIPO", sql.Int, idTipo)
      .query(`
        SELECT ID_TIPO_LICENCIA, NOMBRE
        FROM dbo.TIPOS_LICENCIA
        WHERE ID_TIPO_LICENCIA = @ID_TIPO
          AND ACTIVO = 1;
      `);

    if (!tipoResult.recordset.length) {
      return res.status(400).json({
        message:
          "El tipo de licencia no existe o está inactivo."
      });
    }

    const tipoNombre = tipoResult.recordset[0].NOMBRE;

    const licenciaValidada = validarLicencia(
      { ...datos, ESTADO: "DISPONIBLE" },
      tipoNombre
    );

    if (!licenciaValidada.valido) {
      return res.status(400).json({
        message: "Los datos de la licencia son inválidos.",
        errores: licenciaValidada.errores
      });
    }

    const sqlServerValidado = validarSqlServer(
      datos,
      tipoNombre
    );

    if (!sqlServerValidado.valido) {
      return res.status(400).json({
        message:
          "La modalidad no corresponde a la edición.",
        errores: sqlServerValidado.errores
      });
    }

    const software = datos.SOFTWARE.trim();
    const version = datos.VERSION.trim();
    const activador = datos.ACTIVADOR?.trim() || null;
    const comentarios = datos.COMENTARIOS?.trim() || null;
    const configuracion = JSON.stringify(datos.CONFIGURACION);

    transaccion = new sql.Transaction(pool);
    await transaccion.begin(
      sql.ISOLATION_LEVEL.READ_COMMITTED
    );
    iniciada = true;

    // Las gratuitas son entradas compartidas:
    // solo puede existir una por software y versión.
    if (tipoNombre === "GRATUITA") {
      const clave = [
        software.normalize("NFKC").trim().toUpperCase(),
        version.normalize("NFKC").trim().toUpperCase()
      ].join("|");

      // HASHBYTES evita exceder el límite de 255
      // caracteres del recurso de sp_getapplock.
      const bloqueo = await new sql.Request(transaccion)
        .input("CLAVE", sql.NVarChar(400), clave)
        .query(`
          DECLARE @recurso NVARCHAR(255) =
            'LIC_GRATUITA_' +
            CONVERT(
              VARCHAR(64),
              HASHBYTES(
                'SHA2_256',
                @CLAVE
              ),
              2
            );

          DECLARE @resultado INT;

          EXEC @resultado = sys.sp_getapplock
            @Resource = @recurso,
            @LockMode = 'Exclusive',
            @LockOwner = 'Transaction',
            @LockTimeout = 10000;

          SELECT @resultado AS Resultado;
        `);

      if (bloqueo.recordset[0].Resultado < 0) {
        await transaccion.rollback();
        iniciada = false;

        return res.status(503).json({
          message:
            "No se pudo verificar la unicidad. Intenta nuevamente."
        });
      }

      const duplicada = await new sql.Request(transaccion)
        .input("SOFTWARE", sql.NVarChar(150), software)
        .input("VERSION", sql.NVarChar(100), version)
        .query(`
          SELECT TOP (1)
            L.ID_LICENCIA,
            L.SOFTWARE,
            L.VERSION,
            L.ESTADO
          FROM dbo.LICENCIAS L WITH (UPDLOCK, HOLDLOCK)
          INNER JOIN dbo.TIPOS_LICENCIA T
            ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
          WHERE T.NOMBRE = 'GRATUITA'
            AND UPPER(LTRIM(RTRIM(L.SOFTWARE))) =
                UPPER(LTRIM(RTRIM(@SOFTWARE)))
            AND UPPER(LTRIM(RTRIM(L.VERSION))) =
                UPPER(LTRIM(RTRIM(@VERSION)))
          ORDER BY L.ID_LICENCIA;
        `);

      if (duplicada.recordset.length > 0) {
        await transaccion.rollback();
        iniciada = false;

        return res.status(409).json({
          message:
            "Esta edición gratuita ya está registrada. Utiliza el registro existente para asignarla a más equipos.",
          licenciaExistente: duplicada.recordset[0]
        });
      }
    }

    const resultado = await new sql.Request(transaccion)
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
      .input(
        "CONFIGURACION",
        sql.NVarChar(sql.MAX),
        configuracion
      )
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
        );
      `);

    await transaccion.commit();
    iniciada = false;

    return res.status(201).json({
      message: "Licencia registrada correctamente.",
      licencia: resultado.recordset[0]
    });

  } catch (error) {
    if (iniciada && transaccion) {
      try {
        await transaccion.rollback();
      } catch (errorRollback) {
        console.error(
          "Error revirtiendo creación:",
          errorRollback
        );
      }
    }

    console.error("Error registrando licencia:", error);

    if ([2601, 2627].includes(error.number)) {
      return res.status(409).json({
        message: "Ya existe un registro equivalente."
      });
    }

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
      CAST(
        CASE
          WHEN T.NOMBRE = 'GRATUITA' THEN 1
          ELSE 0
        END AS BIT
      ) AS ES_COMPARTIDA,
      COALESCE(C.TOTAL_EQUIPOS, 0) AS EQUIPOS_VINCULADOS,
      A.ID_ASIGNACION,
      A.ID_EQUIPO,
      A.NOMBRE_EQUIPO,
      A.ID_UNIDAD,
      A.FECHA_ASIGNACION
    FROM dbo.LICENCIAS AS L
    INNER JOIN dbo.TIPOS_LICENCIA AS T
      ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
    OUTER APPLY (
      SELECT COUNT(*) AS TOTAL_EQUIPOS
      FROM dbo.LICENCIAS_ASIGNACIONES AS X
      INNER JOIN dbo.INVENTARIO_M AS EX
        ON EX.id = X.ID_EQUIPO
      WHERE X.ID_LICENCIA = L.ID_LICENCIA
        AND X.FECHA_LIBERACION IS NULL
        AND (
          @ES_ADMIN = 1
          OR EXISTS (
            SELECT 1
            FROM dbo.Usuario_Unidades AS UX
            WHERE UX.IdUsuario = @ID_USUARIO
              AND UX.IdUnidad = EX.ID_UNIDAD
          )
        )
        AND (
          @ID_UNIDAD IS NULL
          OR EX.ID_UNIDAD = @ID_UNIDAD
        )
    ) AS C
    OUTER APPLY (
      SELECT TOP (1)
        X.ID_ASIGNACION,
        X.ID_EQUIPO,
       COALESCE(
  CASE
    WHEN UPPER(LTRIM(RTRIM(EX.NOMBRE_EQUIPO))) NOT IN
      ('', 'NA', 'N/A')
    THEN LTRIM(RTRIM(EX.NOMBRE_EQUIPO))
  END,
  NULLIF(LTRIM(RTRIM(EX.UBICACION)), ''),
  'Sin identificar'
) AS NOMBRE_EQUIPO,
        EX.ID_UNIDAD,
        X.FECHA_ASIGNACION
      FROM dbo.LICENCIAS_ASIGNACIONES AS X
      INNER JOIN dbo.INVENTARIO_M AS EX
        ON EX.id = X.ID_EQUIPO
      WHERE X.ID_LICENCIA = L.ID_LICENCIA
        AND X.FECHA_LIBERACION IS NULL
        AND (
          @ES_ADMIN = 1
          OR EXISTS (
            SELECT 1
            FROM dbo.Usuario_Unidades AS UX
            WHERE UX.IdUsuario = @ID_USUARIO
              AND UX.IdUnidad = EX.ID_UNIDAD
          )
        )
        AND (
          @ID_UNIDAD IS NULL
          OR EX.ID_UNIDAD = @ID_UNIDAD
        )
      ORDER BY X.ID_ASIGNACION DESC
    ) AS A
    WHERE
      (
        @ESTADO IS NULL
        OR L.ESTADO = @ESTADO
      )
      AND (
        @SIN_ASIGNAR = 0
        OR NOT EXISTS (
          SELECT 1
          FROM dbo.LICENCIAS_ASIGNACIONES AS X
          WHERE X.ID_LICENCIA = L.ID_LICENCIA
            AND X.FECHA_LIBERACION IS NULL
        )
      )
      AND (
        (
          @ES_ADMIN = 1
          AND (
            @ID_UNIDAD IS NULL
            OR C.TOTAL_EQUIPOS > 0
          )
        )
        OR (
          @ES_ADMIN = 0
          AND C.TOTAL_EQUIPOS > 0
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
  const idEquipoSolicitado = Number(req.body?.ID_EQUIPO);

  const esIdValido = (valor) =>
    Number.isSafeInteger(valor) &&
    valor > 0 &&
    valor <= 2147483647;

  if (!esIdValido(idLicencia)) {
    return res.status(400).json({
      message: "ID de licencia inválido."
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

    // 1. Bloquear la licencia.
    const licenciaResult =
      await new sql.Request(transaccion)
        .input("ID_LICENCIA", sql.Int, idLicencia)
        .query(`
          SELECT
            L.ID_LICENCIA,
            L.SOFTWARE,
            L.VERSION,
            L.ESTADO,
            T.NOMBRE AS TIPO_LICENCIA
          FROM dbo.LICENCIAS AS L
            WITH (UPDLOCK, HOLDLOCK)
          INNER JOIN dbo.TIPOS_LICENCIA AS T
            ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
          WHERE L.ID_LICENCIA = @ID_LICENCIA;
        `);

    if (!licenciaResult.recordset.length) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(404).json({
        message: "La licencia no existe."
      });
    }

    const licencia = licenciaResult.recordset[0];

    const esCompartida =
      licencia.TIPO_LICENCIA === "GRATUITA";

    // Para gratuitas es obligatorio identificar
    // el equipo que se va a desvincular.
    if (esCompartida && !esIdValido(idEquipoSolicitado)) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(400).json({
        message:
          "Para liberar una licencia gratuita debes indicar ID_EQUIPO."
      });
    }

    // 2. Buscar asignación activa.
    const requestAsignacion =
      new sql.Request(transaccion)
        .input("ID_LICENCIA", sql.Int, idLicencia)
        .input(
          "ID_EQUIPO",
          sql.Int,
          esCompartida ? idEquipoSolicitado : null
        );

    const asignacionResult =
      await requestAsignacion.query(`
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
          AND A.FECHA_LIBERACION IS NULL
          AND (
            @ID_EQUIPO IS NULL
            OR A.ID_EQUIPO = @ID_EQUIPO
          );
      `);

    if (!asignacionResult.recordset.length) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "No existe una asignación activa para esta licencia y equipo."
      });
    }

    const asignacion = asignacionResult.recordset[0];

    // 3. Verificar acceso a la unidad.
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

    // 4. Comprobar estado.
    if (licencia.ESTADO !== "EN_USO") {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "Solo se pueden liberar licencias en estado EN_USO.",
        estadoActual: licencia.ESTADO
      });
    }

    // 5. Cerrar el vínculo seleccionado.

    // ============================================
    // 5. LIBERAR ASIGNACIÓN
    // Compatible con trigger AFTER UPDATE.
    // ============================================

    const liberacionResult =
      await new sql.Request(transaccion)
        .input(
          "ID_ASIGNACION",
          sql.Int,
          asignacion.ID_ASIGNACION
        )
        .query(`
          DECLARE @AsignacionLiberada TABLE (
            ID_ASIGNACION INT,
            ID_LICENCIA INT,
            ID_EQUIPO INT,
            FECHA_ASIGNACION DATETIME2,
            FECHA_LIBERACION DATETIME2
          );

          UPDATE dbo.LICENCIAS_ASIGNACIONES
          SET FECHA_LIBERACION = SYSUTCDATETIME()
          OUTPUT
            INSERTED.ID_ASIGNACION,
            INSERTED.ID_LICENCIA,
            INSERTED.ID_EQUIPO,
            INSERTED.FECHA_ASIGNACION,
            INSERTED.FECHA_LIBERACION
          INTO @AsignacionLiberada (
            ID_ASIGNACION,
            ID_LICENCIA,
            ID_EQUIPO,
            FECHA_ASIGNACION,
            FECHA_LIBERACION
          )
          WHERE ID_ASIGNACION = @ID_ASIGNACION
            AND FECHA_LIBERACION IS NULL;

          SELECT
            ID_ASIGNACION,
            ID_LICENCIA,
            ID_EQUIPO,
            FECHA_ASIGNACION,
            FECHA_LIBERACION
          FROM @AsignacionLiberada;
        `);

    if (liberacionResult.recordset.length !== 1) {
      throw new Error(
        "No se pudo cerrar la asignación activa."
      );
    }


    if (liberacionResult.recordset.length !== 1) {
      throw new Error(
        "No se pudo cerrar la asignación activa."
      );
    }

    let nuevoEstado;

    if (esCompartida) {
      // 6A. Contar vínculos gratuitos restantes.
      const restantesResult =
        await new sql.Request(transaccion)
          .input("ID_LICENCIA", sql.Int, idLicencia)
          .query(`
            SELECT COUNT(*) AS TOTAL
            FROM dbo.LICENCIAS_ASIGNACIONES
            WHERE ID_LICENCIA = @ID_LICENCIA
              AND FECHA_LIBERACION IS NULL;
          `);

      const restantes =
        restantesResult.recordset[0].TOTAL;

      nuevoEstado = restantes > 0
        ? "EN_USO"
        : "DISPONIBLE";

    } else {
      // 6B. Regla comercial original.
      nuevoEstado = "OBSOLETA";
    }

    // 7. Actualizar estado de licencia.
    const estadoResult =
      await new sql.Request(transaccion)
        .input("ID_LICENCIA", sql.Int, idLicencia)
        .input("ESTADO", sql.NVarChar(20), nuevoEstado)
        .query(`
          UPDATE dbo.LICENCIAS
          SET ESTADO = @ESTADO
          WHERE ID_LICENCIA = @ID_LICENCIA
            AND ESTADO = 'EN_USO';
        `);

    if (estadoResult.rowsAffected[0] !== 1) {
      throw new Error(
        "No se pudo actualizar el estado de la licencia."
      );
    }

    // 8. Confirmar la transacción.
    await transaccion.commit();
    iniciada = false;

    return res.status(200).json({
      message: esCompartida
        ? "Licencia gratuita desvinculada del equipo correctamente."
        : "Licencia liberada correctamente.",

      licencia: {
        ID_LICENCIA: licencia.ID_LICENCIA,
        SOFTWARE: licencia.SOFTWARE,
        VERSION: licencia.VERSION,
        TIPO_LICENCIA: licencia.TIPO_LICENCIA,
        ESTADO: nuevoEstado,
        ES_COMPARTIDA: esCompartida,
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

    // 1. Bloquear la licencia y consultar su modalidad.
    const licenciaResult = await new sql.Request(transaccion)
      .input("ID_LICENCIA", sql.Int, idLicencia)
      .query(`
        SELECT
          L.ID_LICENCIA,
          L.SOFTWARE,
          L.VERSION,
          L.ESTADO,
          T.NOMBRE AS TIPO_LICENCIA
        FROM dbo.LICENCIAS AS L
          WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.TIPOS_LICENCIA AS T
          ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
        WHERE L.ID_LICENCIA = @ID_LICENCIA;
      `);

    if (licenciaResult.recordset.length === 0) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(404).json({
        message: "La licencia no existe."
      });
    }

    const licencia = licenciaResult.recordset[0];

    const esCompartida =
      licencia.TIPO_LICENCIA === "GRATUITA";

    // 2. Comprobar existencia del equipo.
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

    // 3. Validar autorización sobre la unidad.
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

    // 4. Validar estado según modalidad.
    const estadoPermitido = esCompartida
      ? ["DISPONIBLE", "EN_USO"].includes(
          licencia.ESTADO
        )
      : licencia.ESTADO === "DISPONIBLE";

    if (!estadoPermitido) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "La licencia no está disponible para asignación.",
        estadoActual: licencia.ESTADO
      });
    }

    // 5. Obtener asignaciones activas de la licencia.
    const asignacionesResult =
      await new sql.Request(transaccion)
        .input("ID_LICENCIA", sql.Int, idLicencia)
        .query(`
          SELECT
            ID_ASIGNACION,
            ID_EQUIPO
          FROM dbo.LICENCIAS_ASIGNACIONES
          WHERE ID_LICENCIA = @ID_LICENCIA
            AND FECHA_LIBERACION IS NULL;
        `);

    const asignacionesActivas =
      asignacionesResult.recordset;

    // 6. Evitar duplicar la licencia en el mismo equipo.
    const yaAsignadaAlEquipo =
      asignacionesActivas.some(
        asignacion =>
          asignacion.ID_EQUIPO === idEquipo
      );

    if (yaAsignadaAlEquipo) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "Esta licencia ya está asignada al equipo seleccionado."
      });
    }

    // 7. Las comerciales siguen siendo exclusivas.
    if (
      !esCompartida &&
      asignacionesActivas.length > 0
    ) {
      await transaccion.rollback();
      iniciada = false;

      return res.status(409).json({
        message:
          "La licencia comercial ya tiene una asignación activa."
      });
    }

    // 8. Crear la asignación con clasificación correcta.

    // ============================================
    // 8. CREAR ASIGNACIÓN
    // Compatible con trigger AFTER INSERT.
    // ============================================

    const nuevaAsignacion =
      await new sql.Request(transaccion)
        .input("ID_LICENCIA", sql.Int, idLicencia)
        .input("ID_EQUIPO", sql.Int, idEquipo)
        .input(
          "ES_COMPARTIDA",
          sql.Bit,
          esCompartida ? 1 : 0
        )
        .query(`
          DECLARE @NuevaAsignacion TABLE (
            ID_ASIGNACION INT,
            ID_LICENCIA INT,
            ID_EQUIPO INT,
            FECHA_ASIGNACION DATETIME2,
            ES_COMPARTIDA BIT
          );

          INSERT INTO dbo.LICENCIAS_ASIGNACIONES (
            ID_LICENCIA,
            ID_EQUIPO,
            FECHA_ASIGNACION,
            ES_COMPARTIDA
          )
          OUTPUT
            INSERTED.ID_ASIGNACION,
            INSERTED.ID_LICENCIA,
            INSERTED.ID_EQUIPO,
            INSERTED.FECHA_ASIGNACION,
            INSERTED.ES_COMPARTIDA
          INTO @NuevaAsignacion (
            ID_ASIGNACION,
            ID_LICENCIA,
            ID_EQUIPO,
            FECHA_ASIGNACION,
            ES_COMPARTIDA
          )
          VALUES (
            @ID_LICENCIA,
            @ID_EQUIPO,
            SYSUTCDATETIME(),
            @ES_COMPARTIDA
          );

          SELECT
            ID_ASIGNACION,
            ID_LICENCIA,
            ID_EQUIPO,
            FECHA_ASIGNACION,
            ES_COMPARTIDA
          FROM @NuevaAsignacion;
        `);

    if (nuevaAsignacion.recordset.length !== 1) {
      throw new Error(
        "No se pudo recuperar la asignación creada."
      );
    }


    // 9. Para gratuitas que ya estén EN_USO,
    // no hace falta cambiar el estado.
    if (licencia.ESTADO === "DISPONIBLE") {
      const estadoResult =
        await new sql.Request(transaccion)
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
    }

    // 10. Confirmar transacción.
    await transaccion.commit();
    iniciada = false;

    return res.status(201).json({
      message: esCompartida
        ? "Licencia gratuita vinculada correctamente al equipo."
        : "Licencia asignada correctamente.",

      asignacion: nuevaAsignacion.recordset[0],

      licencia: {
        ID_LICENCIA: licencia.ID_LICENCIA,
        SOFTWARE: licencia.SOFTWARE,
        VERSION: licencia.VERSION,
        TIPO_LICENCIA: licencia.TIPO_LICENCIA,
        ES_COMPARTIDA: esCompartida,
        ESTADO: "EN_USO",
        ID_UNIDAD: equipo.ID_UNIDAD
      },

      equipo: {
        id: equipo.id,
        NOMBRE_EQUIPO: equipo.NOMBRE_EQUIPO,
        ID_UNIDAD: equipo.ID_UNIDAD
      },

      totalAsignacionesActivas:
        asignacionesActivas.length + 1
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

    if ([2601, 2627].includes(error.number)) {
      return res.status(409).json({
        message:
          "La licencia ya tiene una asignación activa incompatible o duplicada."
      });
    }

    return res.status(500).json({
      message: "Error interno al asignar la licencia."
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
        L.COMENTARIOS,
        CASE
          WHEN T.NOMBRE = 'GRATUITA'
            THEN CAST(1 AS BIT)
          ELSE CAST(0 AS BIT)
        END AS ES_COMPARTIDA,
        (
          SELECT COUNT(*)
          FROM dbo.LICENCIAS_ASIGNACIONES A
          WHERE A.ID_LICENCIA = L.ID_LICENCIA
            AND A.FECHA_LIBERACION IS NULL
        ) AS TOTAL_EQUIPOS

      FROM dbo.LICENCIAS AS L
      INNER JOIN dbo.TIPOS_LICENCIA AS T
        ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA

      WHERE
        (
          T.NOMBRE = 'GRATUITA'
          AND L.ESTADO IN ('DISPONIBLE', 'EN_USO')
        )
        OR
        (
          T.NOMBRE <> 'GRATUITA'
          AND L.ESTADO = 'DISPONIBLE'
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.LICENCIAS_ASIGNACIONES A
            WHERE A.ID_LICENCIA = L.ID_LICENCIA
              AND A.FECHA_LIBERACION IS NULL
          )
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
CAST(
  CASE
    WHEN R.NOMBRE = 'Administrador' THEN 1
    ELSE 0
  END AS BIT
) AS PUEDE_EDITAR_ACTIVADOR,
          A.ID_ASIGNACION,
          A.ID_EQUIPO,
          A.FECHA_ASIGNACION,
          COALESCE(
  CASE
    WHEN UPPER(LTRIM(RTRIM(E.NOMBRE_EQUIPO))) NOT IN
      ('', 'NA', 'N/A')
    THEN LTRIM(RTRIM(E.NOMBRE_EQUIPO))
  END,
  NULLIF(LTRIM(RTRIM(E.UBICACION)), ''),
  'Sin identificar'
) AS NOMBRE_EQUIPO,
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
            PUEDE_EDITAR_ACTIVADOR:
      Boolean(licencia.PUEDE_EDITAR_ACTIVADOR),

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

  const idValido =
    Number.isSafeInteger(idLicencia) &&
    idLicencia > 0 &&
    idLicencia <= 2147483647;

  if (!idValido) {
    return res.status(400).json({
      message: "ID de licencia inválido."
    });
  }

  const {
    SOFTWARE,
    VERSION,
    ACTIVADOR,
    COMENTARIOS,
    CONFIGURACION
  } = req.body ?? {};

  // Validar todos los campos editables.
  if (
    typeof SOFTWARE !== "string" ||
    !SOFTWARE.trim() ||
    SOFTWARE.trim().length > 150 ||
    typeof VERSION !== "string" ||
    !VERSION.trim() ||
    VERSION.trim().length > 100 ||
    (ACTIVADOR != null &&
      typeof ACTIVADOR !== "string") ||
    (typeof ACTIVADOR === "string" &&
      ACTIVADOR.trim().length > 150) ||
    (COMENTARIOS != null &&
      typeof COMENTARIOS !== "string") ||
    !CONFIGURACION ||
    typeof CONFIGURACION !== "object" ||
    Array.isArray(CONFIGURACION)
  ) {
    return res.status(400).json({
      message: "Datos de licencia inválidos."
    });
  }

  const software = SOFTWARE.trim();
  const version = VERSION.trim();
  const activador = ACTIVADOR?.trim() || null;
  const comentarios = COMENTARIOS?.trim() || null;

  let configuracion;

  try {
    configuracion = JSON.stringify(CONFIGURACION);
  } catch {
    return res.status(400).json({
      message: "Configuración de licencia inválida."
    });
  }

  try {
    const pool = await poolPromise;

    const resultado = await pool.request()
      .input(
        "ID_LICENCIA",
        sql.Int,
        idLicencia
      )
      .input(
        "SOFTWARE",
        sql.NVarChar(150),
        software
      )
      .input(
        "VERSION",
        sql.NVarChar(100),
        version
      )
      .input(
        "ACTIVADOR",
        sql.NVarChar(150),
        activador
      )
      .input(
        "COMENTARIOS",
        sql.NVarChar(sql.MAX),
        comentarios
      )
      .input(
        "CONFIGURACION",
        sql.NVarChar(sql.MAX),
        configuracion
      )
      .query(`
        UPDATE dbo.LICENCIAS
        SET
          SOFTWARE = @SOFTWARE,
          VERSION = @VERSION,
          ACTIVADOR = @ACTIVADOR,
          COMENTARIOS = @COMENTARIOS,
          CONFIGURACION = @CONFIGURACION
        OUTPUT
          INSERTED.ID_LICENCIA,
          INSERTED.SOFTWARE,
          INSERTED.VERSION,
          INSERTED.COMENTARIOS,
          INSERTED.CONFIGURACION,
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
    console.error(
      "Error actualizando licencia:",
      error
    );

    return res.status(500).json({
      message: "No se pudo actualizar la licencia."
    });
  }
};

const obtenerEquiposDeLicencia = async (req, res) => {
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

 
const resultado = await pool.request()
  .input("ID_LICENCIA", sql.Int, idLicencia)
  .input("ID_USUARIO", sql.Int, idUsuario)
  .query(`
    WITH UsuarioAutorizado AS (
      SELECT TOP (1)
        CASE
          WHEN R.NOMBRE = 'Administrador'
            THEN 1
          ELSE 0
        END AS ES_ADMIN
      FROM dbo.Usuarios AS U
      INNER JOIN dbo.Roles AS R
        ON R.ID_ROL = U.IdRol
       AND R.ACTIVO = 1
      WHERE U.IdUsuario = @ID_USUARIO
        AND U.Activo = 1
    )
    SELECT
      A.ID_ASIGNACION,
      A.ID_LICENCIA,
      A.ID_EQUIPO,
      COALESCE(
  CASE
    WHEN UPPER(LTRIM(RTRIM(E.NOMBRE_EQUIPO))) NOT IN
      ('', 'NA', 'N/A')
    THEN LTRIM(RTRIM(E.NOMBRE_EQUIPO))
  END,
  NULLIF(LTRIM(RTRIM(E.UBICACION)), ''),
  'Sin identificar'
) AS NOMBRE_EQUIPO,
      E.ID_UNIDAD,
      UN.id_marca AS ID_MARCA,
      R.Marca AS NOMBRE_RESTAURANTE,
      UN.Ubicacion AS NOMBRE_UNIDAD,
      A.FECHA_ASIGNACION,
      A.ES_COMPARTIDA
    FROM dbo.LICENCIAS_ASIGNACIONES AS A
    INNER JOIN dbo.INVENTARIO_M AS E
      ON E.id = A.ID_EQUIPO
    LEFT JOIN dbo.UNIDADES AS UN
      ON UN.id = E.ID_UNIDAD
    LEFT JOIN dbo.RESTAURANTES AS R
      ON R.id_marca = UN.id_marca
    CROSS JOIN UsuarioAutorizado AS UA
    WHERE A.ID_LICENCIA = @ID_LICENCIA
      AND A.FECHA_LIBERACION IS NULL
      AND (
        UA.ES_ADMIN = 1
        OR EXISTS (
          SELECT 1
          FROM dbo.Usuario_Unidades AS UU
          WHERE UU.IdUsuario = @ID_USUARIO
            AND UU.IdUnidad = E.ID_UNIDAD
        )
      )
    ORDER BY
      E.NOMBRE_EQUIPO,
      A.ID_ASIGNACION;
  `);


    // No revelar detalles de licencias ajenas.

const acceso = await pool.request()
  .input("ID_LICENCIA", sql.Int, idLicencia)
  .input("ID_USUARIO", sql.Int, idUsuario)
  .query(`
    SELECT TOP (1)
      L.ID_LICENCIA,
      L.SOFTWARE,
      L.VERSION,
      T.NOMBRE AS TIPO_LICENCIA
    FROM dbo.LICENCIAS AS L
    INNER JOIN dbo.TIPOS_LICENCIA AS T
      ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA
    INNER JOIN dbo.Usuarios AS U
      ON U.IdUsuario = @ID_USUARIO
     AND U.Activo = 1
    INNER JOIN dbo.Roles AS R
      ON R.ID_ROL = U.IdRol
     AND R.ACTIVO = 1
    WHERE L.ID_LICENCIA = @ID_LICENCIA
      AND (
        R.NOMBRE = 'Administrador'
        OR EXISTS (
          SELECT 1
          FROM dbo.LICENCIAS_ASIGNACIONES AS A
          INNER JOIN dbo.INVENTARIO_M AS E
            ON E.id = A.ID_EQUIPO
          INNER JOIN dbo.Usuario_Unidades AS UU
            ON UU.IdUnidad = E.ID_UNIDAD
           AND UU.IdUsuario = @ID_USUARIO
          WHERE A.ID_LICENCIA = L.ID_LICENCIA
            AND A.FECHA_LIBERACION IS NULL
        )
      );
  `);


    if (!acceso.recordset.length) {
      return res.status(404).json({
        message: "Licencia no encontrada o no disponible."
      });
    }

    return res.status(200).json({
      licencia: acceso.recordset[0],
      total: resultado.recordset.length,
      equipos: resultado.recordset
    });

  } catch (error) {
    console.error(
      "Error consultando equipos de licencia:",
      error
    );

    return res.status(500).json({
      message: "Error consultando equipos vinculados."
    });
  }
};


const exportarLicenciasExcel = async (req, res) => {
  const idUsuario = Number(req.usuario?.IdUsuario);

  if (
    !Number.isSafeInteger(idUsuario) ||
    idUsuario <= 0
  ) {
    return res.status(401).json({
      message: "Usuario no autenticado."
    });
  }

  const {
    segmento = "todas",
    estado = "",
    busqueda = ""
  } = req.query;

  const segmentosPermitidos = [
    "comerciales", "gratuitas", "todas"
  ];
  const estadosPermitidos = [
    "",
    "DISPONIBLE",
    "EN_USO",
    "OBSOLETA"
  ];
if (
  typeof segmento !== "string" ||
  !segmentosPermitidos.includes(segmento)
) {
  return res.status(400).json({
    message: "Segmento de licencias inválido."
  });
}

if (
  typeof estado !== "string" ||
  !estadosPermitidos.includes(estado)
) {
  return res.status(400).json({
    message: "Estado de licencia inválido."
  });
}

if (
  typeof busqueda !== "string" ||
  busqueda.length > 150
) {
  return res.status(400).json({
    message: "Búsqueda inválida."
  });
}
  try {
    const pool = await poolPromise;

    const resultado = await pool.request()
      .input("ID_USUARIO", sql.Int, idUsuario)
        .input(
    "SEGMENTO",
    sql.VarChar(20),
    segmento
  )
  .input(
    "ESTADO",
    sql.VarChar(20),
    estado || null
  )
  .input(
    "BUSQUEDA",
    sql.NVarChar(150),
    busqueda.trim() || null
  )
      .query(`
        WITH UsuarioAutorizado AS (
          SELECT
            CASE
              WHEN R.NOMBRE = 'Administrador'
                THEN 1 ELSE 0
            END AS ES_ADMIN
          FROM dbo.Usuarios AS U
          INNER JOIN dbo.Roles AS R
            ON R.ID_ROL = U.IdRol
           AND R.ACTIVO = 1
          WHERE U.IdUsuario = @ID_USUARIO
            AND U.Activo = 1
        ),
        LicenciasVisibles AS (
          SELECT
            L.ID_LICENCIA,
            L.SOFTWARE,
            L.VERSION,
            T.NOMBRE AS TIPO_LICENCIA,
            L.ESTADO,
            L.COMENTARIOS,
            L.FECHA_ACTIVACION,
            L.FECHA_REGISTRO,

            A.ID_ASIGNACION,
            A.ID_EQUIPO,
            A.FECHA_ASIGNACION,

            E.NOMBRE_EQUIPO AS NOMBRE_ORIGINAL,
            E.UBICACION AS UBICACION_INTERNA,
            E.ID_UNIDAD,

            UN.Ubicacion AS LOCALIDAD,
            RST.Marca AS RESTAURANTE

          FROM dbo.LICENCIAS AS L
          INNER JOIN dbo.TIPOS_LICENCIA AS T
            ON T.ID_TIPO_LICENCIA =
               L.ID_TIPO_LICENCIA

          CROSS JOIN UsuarioAutorizado AS UA

          LEFT JOIN dbo.LICENCIAS_ASIGNACIONES AS A
            ON A.ID_LICENCIA = L.ID_LICENCIA
           AND A.FECHA_LIBERACION IS NULL

          LEFT JOIN dbo.INVENTARIO_M AS E
            ON E.id = A.ID_EQUIPO

          LEFT JOIN dbo.UNIDADES AS UN
            ON UN.id = E.ID_UNIDAD

          LEFT JOIN dbo.RESTAURANTES AS RST
            ON RST.id_marca = UN.id_marca

          WHERE
            UA.ES_ADMIN = 1
            OR (
              A.ID_ASIGNACION IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM dbo.Usuario_Unidades AS UU
                WHERE UU.IdUsuario = @ID_USUARIO
                  AND UU.IdUnidad = E.ID_UNIDAD
              )
            )
        )

        SELECT
          ID_LICENCIA,
          SOFTWARE,
          VERSION,
          TIPO_LICENCIA,
          ESTADO,
          COMENTARIOS,

          COUNT(ID_ASIGNACION) OVER (
            PARTITION BY ID_LICENCIA
          ) AS TOTAL_EQUIPOS,

          ID_EQUIPO,

          COALESCE(
            CASE
              WHEN UPPER(
                LTRIM(RTRIM(NOMBRE_ORIGINAL))
              ) NOT IN ('', 'NA', 'N/A')
                THEN LTRIM(RTRIM(NOMBRE_ORIGINAL))
            END,
            NULLIF(
              LTRIM(RTRIM(UBICACION_INTERNA)),
              ''
            ),
            CASE
              WHEN ID_EQUIPO IS NOT NULL
                THEN 'Sin identificar'
              ELSE NULL
            END
          ) AS NOMBRE_EQUIPO,

          ID_UNIDAD,
          RESTAURANTE,
          LOCALIDAD,
          UBICACION_INTERNA,
          FECHA_ASIGNACION,
          FECHA_ACTIVACION,
          FECHA_REGISTRO

       FROM LicenciasVisibles
WHERE
  (
    @SEGMENTO = 'todas'
    OR (
      @SEGMENTO = 'gratuitas'
      AND TIPO_LICENCIA = 'GRATUITA'
    )
    OR (
      @SEGMENTO = 'comerciales'
      AND TIPO_LICENCIA <> 'GRATUITA'
    )
  )
  AND (
    @ESTADO IS NULL
    OR ESTADO = @ESTADO
  )
  AND (
    @BUSQUEDA IS NULL
    OR CHARINDEX(
      UPPER(@BUSQUEDA),
      UPPER(COALESCE(SOFTWARE, ''))
    ) > 0
    OR CHARINDEX(
      UPPER(@BUSQUEDA),
      UPPER(COALESCE(VERSION, ''))
    ) > 0
  )
ORDER BY
  SOFTWARE,
  VERSION,
  ID_LICENCIA,
  RESTAURANTE,
  NOMBRE_EQUIPO;
      `);

    const buffer = await generarLicenciasExcel(
      resultado.recordset
    );

    const nombreArchivo =
      `Licencias_GA_${
        new Date().toISOString().slice(0, 10)
      }.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.status(200).send(
      Buffer.from(buffer)
    );

  } catch (error) {
    console.error(
      "Error exportando licencias a Excel:",
      error
    );

    return res.status(500).json({
      message:
        "No fue posible exportar las licencias."
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
  obtenerEquiposDeLicencia,
  obtenerDetalleLicencia, actualizarLicencia, exportarLicenciasExcel
};
