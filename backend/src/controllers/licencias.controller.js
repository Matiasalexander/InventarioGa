
const sql = require("mssql");
const { poolPromise } = require("../config/db");
require ("../validators/licencias.validator");
    const {validarSqlServer} = require("../validators/sqlServer.validator");

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
    const { estado } = req.query;

    const estadosPermitidos = [
      "DISPONIBLE",
      "EN_USO",
      "OBSOLETA"
    ];

    if (estado && !estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        message: "Estado de licencia inválido."
      });
    }

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input("ESTADO", sql.NVarChar(20), estado || null)
      .query(`
        SELECT
          L.ID_LICENCIA,
          L.SOFTWARE,
          L.VERSION,
          L.ID_TIPO_LICENCIA,
          T.NOMBRE AS TIPO_LICENCIA,
          L.FECHA_ACTIVACION,
          L.ESTADO,
          L.ACTIVADOR,
          L.COMENTARIOS,
          L.CONFIGURACION,
          L.FECHA_REGISTRO,

          A.ID_ASIGNACION,
          A.ID_EQUIPO,
          E.NOMBRE_EQUIPO,
          A.FECHA_ASIGNACION

        FROM dbo.LICENCIAS AS L

        INNER JOIN dbo.TIPOS_LICENCIA AS T
          ON T.ID_TIPO_LICENCIA = L.ID_TIPO_LICENCIA

        LEFT JOIN dbo.LICENCIAS_ASIGNACIONES AS A
          ON A.ID_LICENCIA = L.ID_LICENCIA
          AND A.FECHA_LIBERACION IS NULL

        LEFT JOIN dbo.INVENTARIO_M AS E
          ON E.id = A.ID_EQUIPO

        WHERE (
          @ESTADO IS NULL
          OR L.ESTADO = @ESTADO
        )

        ORDER BY L.ID_LICENCIA DESC
      `);


    const licencias = resultado.recordset.map((item) => {
      const { ACTIVADOR, ...datosPublicos } = item;
      return datosPublicos;
    });

    return res.status(200).json(licencias);

  } catch (error) {
    console.error("Error consultando licencias:", error);

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

module.exports = {
  obtenerTiposLicencia,
  obtenerLicencias,
  obtenerOpcionesLicencias,
  crearLicencia
};
