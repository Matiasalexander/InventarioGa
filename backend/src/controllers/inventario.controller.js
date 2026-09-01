const sql = require("mssql");

const { poolPromise } = require("../config/db");

const generarNombreEquipo = require(
  "../helpers/generarNombreEquipo"
);

const {
  obtenerPermisosInventario
} = require("../helpers/permisosInventario");

const {
  generarInventarioExcel
} = require(
  "../services/excel/inventarioExcel.service"
);

/* =========================================================
   FUNCIONES GENERALES
========================================================= */

const normalizarTexto = (valor) => {
  return (valor || "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

const formatearDiasComoAniosYDias = (
  diasTotales
) => {
  const años = Math.floor(diasTotales / 365);
  const dias = diasTotales % 365;

  if (años === 0) {
    return `${dias} ${
      dias === 1 ? "día" : "días"
    }`;
  }

  return `${años} ${
    años === 1 ? "año" : "años"
  } y ${dias} ${
    dias === 1 ? "día" : "días"
  }`;
};

const formatearTiempoUso = (
  fechaFabricacion
) => {
  if (!fechaFabricacion) return "";

  const inicio = new Date(fechaFabricacion);
  const hoy = new Date();

  if (Number.isNaN(inicio.getTime())) {
    return "";
  }

  const diferenciaMs = hoy - inicio;

  const diasTotales = Math.floor(
    diferenciaMs / (1000 * 60 * 60 * 24)
  );

  if (diasTotales < 0) {
    return "0 días";
  }

  return formatearDiasComoAniosYDias(
    diasTotales
  );
};

const formatearGarantiaRestante = (
  fechaGarantia
) => {
  if (!fechaGarantia) return "";

  const fin = new Date(fechaGarantia);
  const hoy = new Date();

  if (Number.isNaN(fin.getTime())) {
    return "";
  }

  const diferenciaMs = fin - hoy;

  const diasTotales = Math.floor(
    diferenciaMs / (1000 * 60 * 60 * 24)
  );

  if (diasTotales < 0) {
    return "Garantía vencida";
  }

  return formatearDiasComoAniosYDias(
    diasTotales
  );
};

const aplicarCalculosInventario = (item) => {
  return {
    ...item,
    Auso: formatearTiempoUso(
      item.FECHA_FABRICACION
    ),
    Grestante: formatearGarantiaRestante(
      item.FECHA_GARANTIA
    )
  };
};

/* =========================================================
   FUNCIONES DE PERMISOS POR UNIDAD
========================================================= */

const obtenerIdUsuarioAutenticado = (req) => {
  const idUsuario = Number(
    req.usuario?.IdUsuario
  );

  if (
    !Number.isInteger(idUsuario) ||
    idUsuario <= 0
  ) {
    throw new Error(
      "No fue posible identificar al usuario autenticado."
    );
  }

  return idUsuario;
};

const convertirIdUnidad = (valor) => {
  const idUnidad = Number(valor);

  if (
    !Number.isInteger(idUnidad) ||
    idUnidad <= 0
  ) {
    return null;
  }

  return idUnidad;
};

const puedeAccederUnidad = (
  permisos,
  idUnidad
) => {
  if (permisos.verTodas) {
    return true;
  }

  const unidadNumerica =
    convertirIdUnidad(idUnidad);

  if (!unidadNumerica) {
    return false;
  }

  return permisos.unidades
    .map(Number)
    .includes(unidadNumerica);
};

const crearFiltroUnidades = ({
  request,
  permisos,
  columna = "i.ID_UNIDAD",
  prefijo = "UnidadPermitida"
}) => {
  if (permisos.verTodas) {
    return null;
  }

  const unidadesPermitidas = [
    ...new Set(
      (permisos.unidades || [])
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) && id > 0
        )
    )
  ];

  if (unidadesPermitidas.length === 0) {
    return "1 = 0";
  }

  const parametros =
    unidadesPermitidas.map(
      (idUnidad, index) => {
        const nombreParametro =
          `${prefijo}${index}`;

        request.input(
          nombreParametro,
          sql.Int,
          idUnidad
        );

        return `@${nombreParametro}`;
      }
    );

  return `${columna} IN (${parametros.join(
    ", "
  )})`;
};

const obtenerPermisosDesdeRequest = async (
  req
) => {
  const idUsuario =
    obtenerIdUsuarioAutenticado(req);

  return obtenerPermisosInventario(
    idUsuario
  );
};

/* =========================================================
   GENERACIÓN AUTOMÁTICA DEL NOMBRE DEL EQUIPO
========================================================= */

const debeGenerarNombreEquipo = async (
  pool,
  ID_UNIDAD,
  LOCALIDAD,
  ID_TIPO_EQUIPO
) => {
  if (!ID_UNIDAD || !ID_TIPO_EQUIPO) {
    return false;
  }

  const tipoEquipoPermitido =
    Number(ID_TIPO_EQUIPO) === 1 ||
    Number(ID_TIPO_EQUIPO) === 2;

  if (!tipoEquipoPermitido) {
    return false;
  }

  const result = await pool
    .request()
    .input(
      "ID_UNIDAD",
      sql.Int,
      Number(ID_UNIDAD)
    )
    .query(`
      SELECT
        r.Marca AS UNIDAD
      FROM Unidades u
      LEFT JOIN Restaurantes r
        ON u.id_marca = r.id_marca
      WHERE u.id = @ID_UNIDAD
    `);

  const unidad = normalizarTexto(
    result.recordset[0]?.UNIDAD
  );

  const localidad = normalizarTexto(
    LOCALIDAD
  );

  return (
    unidad === "CORPORATIVO" &&
    localidad === "CANCUN"
  );
};

/* =========================================================
   OBTENER INVENTARIO
========================================================= */

const obtenerInventario = async (
  req,
  res
) => {
  try {
    const pool = await poolPromise;

    const permisos =
      await obtenerPermisosDesdeRequest(req);

    const { unidad } = req.query;

    const request = pool.request();
    const condiciones = [];

    const filtroPermisos =
      crearFiltroUnidades({
        request,
        permisos,
        columna: "i.ID_UNIDAD",
        prefijo: "InventarioUnidad"
      });

    if (filtroPermisos) {
      condiciones.push(filtroPermisos);
    }

    if (
      unidad !== undefined &&
      unidad !== null &&
      unidad !== ""
    ) {
      const idUnidad =
        convertirIdUnidad(unidad);

      if (!idUnidad) {
        return res.status(400).json({
          message:
            "La unidad enviada no es válida."
        });
      }

      if (
        !puedeAccederUnidad(
          permisos,
          idUnidad
        )
      ) {
        return res.status(403).json({
          message:
            "No tienes acceso a la unidad solicitada."
        });
      }

      request.input(
        "UnidadSeleccionada",
        sql.Int,
        idUnidad
      );

      condiciones.push(
        "i.ID_UNIDAD = @UnidadSeleccionada"
      );
    }

    const where =
      condiciones.length > 0
        ? `WHERE ${condiciones.join(
            " AND "
          )}`
        : "";

    const result = await request.query(`
      SELECT TOP 100
        i.id,
        i.ID_UNIDAD,
        r.Marca AS UNIDAD,
        i.LOCALIDAD,
        i.UBICACION,
        i.ID_TIPO_EQUIPO,
        te.tequipo AS TIPO_EQUIPO,
        i.TIPO_IMPRESORA,
        i.NOMBRE_EQUIPO,
        i.ID_DEPARTAMENTO,
        d.Nombre_departamento AS DEPARTAMENTO,
        i.PUESTO,
        i.SERIAL,
        i.FECHA_FABRICACION,
        i.FECHA_GARANTIA,
        i.FECHA_INICIO,
        i.Grestante,
        i.Auso,
        i.FECHA_REGISTRO,
        i.ID_DISCO,
        i.ID_RAM,
        i.ID_PROCESADOR,
        p.Nombre AS PROCESADOR,
        i.MODELO_PROCESADOR,

        i.id_sistema_operativo AS ID_SISTEMA_OPERATIVO,
        so.Nombre AS SISTEMA_OPERATIVO,
        so.N_Version AS VERSION_SISTEMA_OPERATIVO,

        i.LECTOR_DE_HUELLA,
        i.CONEXION,
        i.ID_MARCA,
        m.Marca AS MARCA,
        i.MODELO,
        i.IP,
        i.PUERTO,
        i.ID_ESTATUS,
        e.Estatus_equipo AS ESTATUS,
        i.ESTADO_FISICO,
        i.CORREO,
        i.COMENTARIO

      FROM INVENTARIO_M i

      LEFT JOIN Unidades u
        ON i.ID_UNIDAD = u.id

      LEFT JOIN Restaurantes r
        ON u.id_marca = r.id_marca

      LEFT JOIN Tipo_equipo te
        ON i.ID_TIPO_EQUIPO = te.id

      LEFT JOIN DEPARTAMENTOS d
        ON i.ID_DEPARTAMENTO = d.Id

      LEFT JOIN PROCESADORES p
        ON i.ID_PROCESADOR = p.id

      LEFT JOIN MEMORIA_RAM mr
        ON i.ID_RAM = mr.id

      LEFT JOIN DISCO_DURO dd
        ON i.ID_DISCO = dd.id

      LEFT JOIN SISTEMAS_OPERATIVOS so
        ON i.id_sistema_operativo = so.id

      LEFT JOIN Marcas m
        ON i.ID_MARCA = m.id

      LEFT JOIN Estatus e
        ON i.ID_ESTATUS = e.Id

      ${where}

      ORDER BY i.id DESC
    `);

    const inventario =
      result.recordset.map(
        aplicarCalculosInventario
      );

    return res.json(inventario);
  } catch (error) {
    console.error(
      "Error obteniendo inventario:",
      error
    );

    return res.status(500).json({
      message: "Error obteniendo inventario",
      error: error.message
    });
  }
};

/* =========================================================
   OBTENER INVENTARIO POR ID
========================================================= */

const obtenerInventarioPorId = async (
  req,
  res
) => {
  try {
    const idEquipo = Number(req.params.id);

    if (
      !Number.isInteger(idEquipo) ||
      idEquipo <= 0
    ) {
      return res.status(400).json({
        message:
          "El identificador del equipo no es válido."
      });
    }

    const pool = await poolPromise;

    const permisos =
      await obtenerPermisosDesdeRequest(req);

    const request = pool
      .request()
      .input(
        "IdEquipo",
        sql.Int,
        idEquipo
      );

    const condiciones = [
      "i.id = @IdEquipo"
    ];

    const filtroPermisos =
      crearFiltroUnidades({
        request,
        permisos,
        columna: "i.ID_UNIDAD",
        prefijo: "DetalleUnidad"
      });

    if (filtroPermisos) {
      condiciones.push(filtroPermisos);
    }

    const result = await request.query(`
      SELECT
        i.*,

        so.Nombre AS SISTEMA_OPERATIVO,
        so.N_Version AS VERSION_SISTEMA_OPERATIVO

      FROM INVENTARIO_M i

      LEFT JOIN SISTEMAS_OPERATIVOS so
        ON i.id_sistema_operativo = so.id

      WHERE ${condiciones.join(" AND ")}
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message:
          "Equipo no encontrado o no tienes acceso a su unidad."
      });
    }

    const equipo =
      aplicarCalculosInventario(
        result.recordset[0]
      );

    if (equipo.FOTO) {
      equipo.FOTO =
        equipo.FOTO.toString("base64");
    }

    return res.json(equipo);
  } catch (error) {
    console.error(
      "Error obteniendo equipo:",
      error
    );

    return res.status(500).json({
      message: "Error obteniendo equipo",
      error: error.message
    });
  }
};

/* =========================================================
   CREAR INVENTARIO
========================================================= */

const crearInventario = async (
  req,
  res
) => {
  const FOTO = req.file
    ? req.file.buffer
    : null;

  try {
    const Correo = req.usuario.Correo;

    const {
      ID_UNIDAD,
      LOCALIDAD,
      UBICACION,
      ID_TIPO_EQUIPO,
      TIPO_IMPRESORA,
      ID_DEPARTAMENTO,
      PUESTO,
      SERIAL,
      FECHA_FABRICACION,
      FECHA_GARANTIA,
      FECHA_INICIO,
      ID_DISCO,
      ID_RAM,
      ID_PROCESADOR,
      MODELO_PROCESADOR,
      ID_SISTEMA_OPERATIVO,
      LECTOR_DE_HUELLA,
      CONEXION,
      ID_MARCA,
      MODELO,
      IP,
      PUERTO,
      ID_ESTATUS,
      ESTADO_FISICO,
      ACCESO_TEAM_VIEWER,
      CONTRASEÑA_TEAM_VIEWER,
      ACCESO_ANYDESK,
      CONTRASEÑA_ANYDESK,
      COMENTARIO
    } = req.body;

    const idUnidad =
      convertirIdUnidad(ID_UNIDAD);

    if (!idUnidad) {
      return res.status(400).json({
        message:
          "Selecciona una unidad válida."
      });
    }

    const permisos =
      await obtenerPermisosDesdeRequest(req);

    if (
      !puedeAccederUnidad(
        permisos,
        idUnidad
      )
    ) {
      return res.status(403).json({
        message:
          "No tienes permiso para registrar equipos en esta unidad."
      });
    }

    const pool = await poolPromise;

    /* =====================================================
       VALIDAR SISTEMA OPERATIVO
    ===================================================== */

    let nombreSistemaOperativo = null;

    if (ID_SISTEMA_OPERATIVO) {
      const sistemaResult = await pool
        .request()
        .input(
          "ID_SISTEMA_OPERATIVO",
          sql.Int,
          Number(ID_SISTEMA_OPERATIVO)
        )
        .query(`
          SELECT
            id,
            Nombre,
            N_Version
          FROM SISTEMAS_OPERATIVOS
          WHERE id = @ID_SISTEMA_OPERATIVO
        `);

      if (
        sistemaResult.recordset.length === 0
      ) {
        return res.status(400).json({
          message:
            "El sistema operativo seleccionado no existe."
        });
      }

      nombreSistemaOperativo =
        sistemaResult.recordset[0].Nombre;
    }

    /* =====================================================
       VALIDAR SERIAL
    ===================================================== */

    if (SERIAL) {
      const serialExiste = await pool
        .request()
        .input(
          "SERIAL",
          sql.NVarChar,
          SERIAL
        )
        .query(`
          SELECT id
          FROM INVENTARIO_M
          WHERE SERIAL = @SERIAL
        `);

      if (
        serialExiste.recordset.length > 0
      ) {
        return res.status(400).json({
          message:
            "El número de serie ya existe en el inventario."
        });
      }
    }

    /* =====================================================
       INSERTAR INVENTARIO
    ===================================================== */

    const insertResult = await pool
      .request()
      .input(
        "ID_UNIDAD",
        sql.Int,
        idUnidad
      )
      .input(
        "LOCALIDAD",
        LOCALIDAD || null
      )
      .input(
        "UBICACION",
        UBICACION || null
      )
      .input(
        "ID_TIPO_EQUIPO",
        ID_TIPO_EQUIPO || null
      )
      .input(
        "TIPO_IMPRESORA",
        TIPO_IMPRESORA || null
      )
      .input(
        "NOMBRE_EQUIPO",
        "NA"
      )
      .input(
        "ID_DEPARTAMENTO",
        ID_DEPARTAMENTO || null
      )
      .input(
        "PUESTO",
        PUESTO || null
      )
      .input(
        "SERIAL",
        SERIAL || null
      )
      .input(
        "FECHA_FABRICACION",
        FECHA_FABRICACION || null
      )
      .input(
        "FECHA_GARANTIA",
        FECHA_GARANTIA || null
      )
      .input(
        "FECHA_INICIO",
        FECHA_INICIO || null
      )
      .input(
        "ID_DISCO",
        ID_DISCO || null
      )
      .input(
        "ID_RAM",
        ID_RAM || null
      )
      .input(
        "ID_PROCESADOR",
        ID_PROCESADOR || null
      )
      .input(
        "MODELO_PROCESADOR",
        MODELO_PROCESADOR || null
      )
      .input(
        "ID_SISTEMA_OPERATIVO",
        ID_SISTEMA_OPERATIVO
          ? Number(ID_SISTEMA_OPERATIVO)
          : null
      )
      .input(
        "LECTOR_DE_HUELLA",
        LECTOR_DE_HUELLA || null
      )
      .input(
        "CONEXION",
        CONEXION || null
      )
      .input(
        "ID_MARCA",
        ID_MARCA || null
      )
      .input(
        "MODELO",
        MODELO || null
      )
      .input(
        "IP",
        IP || null
      )
      .input(
        "PUERTO",
        PUERTO || null
      )
      .input(
        "ID_ESTATUS",
        ID_ESTATUS || null
      )
      .input(
        "ESTADO_FISICO",
        ESTADO_FISICO || null
      )
      .input(
        "CORREO",
        Correo
      )
      .input(
        "ACCESO_TEAM_VIEWER",
        ACCESO_TEAM_VIEWER || null
      )
      .input(
        "CONTRASEÑA_TEAM_VIEWER",
        CONTRASEÑA_TEAM_VIEWER || null
      )
      .input(
        "ACCESO_ANYDESK",
        ACCESO_ANYDESK || null
      )
      .input(
        "CONTRASEÑA_ANYDESK",
        CONTRASEÑA_ANYDESK || null
      )
      .input(
        "FOTO",
        sql.VarBinary(sql.MAX),
        FOTO
      )
      .input(
        "COMENTARIO",
        COMENTARIO || null
      )
      .query(`
        INSERT INTO INVENTARIO_M (
          ID_UNIDAD,
          LOCALIDAD,
          UBICACION,
          ID_TIPO_EQUIPO,
          TIPO_IMPRESORA,
          NOMBRE_EQUIPO,
          ID_DEPARTAMENTO,
          PUESTO,
          SERIAL,
          FECHA_FABRICACION,
          FECHA_GARANTIA,
          FECHA_INICIO,
          ID_DISCO,
          ID_RAM,
          ID_PROCESADOR,
          MODELO_PROCESADOR,
          id_sistema_operativo,
          LECTOR_DE_HUELLA,
          CONEXION,
          ID_MARCA,
          MODELO,
          IP,
          PUERTO,
          ID_ESTATUS,
          ESTADO_FISICO,
          CORREO,
          ACCESO_TEAM_VIEWER,
          CONTRASEÑA_TEAM_VIEWER,
          ACCESO_ANYDESK,
          CONTRASEÑA_ANYDESK,
          FOTO,
          COMENTARIO
        )
        OUTPUT INSERTED.id
        VALUES (
          @ID_UNIDAD,
          @LOCALIDAD,
          @UBICACION,
          @ID_TIPO_EQUIPO,
          @TIPO_IMPRESORA,
          @NOMBRE_EQUIPO,
          @ID_DEPARTAMENTO,
          @PUESTO,
          @SERIAL,
          @FECHA_FABRICACION,
          @FECHA_GARANTIA,
          @FECHA_INICIO,
          @ID_DISCO,
          @ID_RAM,
          @ID_PROCESADOR,
          @MODELO_PROCESADOR,
          @ID_SISTEMA_OPERATIVO,
          @LECTOR_DE_HUELLA,
          @CONEXION,
          @ID_MARCA,
          @MODELO,
          @IP,
          @PUERTO,
          @ID_ESTATUS,
          @ESTADO_FISICO,
          @CORREO,
          @ACCESO_TEAM_VIEWER,
          @CONTRASEÑA_TEAM_VIEWER,
          @ACCESO_ANYDESK,
          @CONTRASEÑA_ANYDESK,
          @FOTO,
          @COMENTARIO
        )
      `);

    const idGenerado =
      insertResult.recordset[0].id;

    /* =====================================================
       GENERAR NOMBRE DEL EQUIPO
    ===================================================== */

    let NOMBRE_EQUIPO = "NA";

    const aplicaNombre =
      await debeGenerarNombreEquipo(
        pool,
        idUnidad,
        LOCALIDAD,
        ID_TIPO_EQUIPO
      );

    if (aplicaNombre) {

      if (
        !ID_SISTEMA_OPERATIVO ||
        !nombreSistemaOperativo ||
        !FECHA_FABRICACION
      ) {
        return res.status(400).json({
          message:
            "El sistema operativo y la fecha de fabricación son obligatorios para generar el nombre del equipo."
        });
      }

      NOMBRE_EQUIPO =
        await generarNombreEquipo(
          pool,
          ID_TIPO_EQUIPO,
          nombreSistemaOperativo,
          FECHA_FABRICACION
        );

      await pool
        .request()
        .input(
          "id",
          sql.Int,
          idGenerado
        )
        .input(
          "NOMBRE_EQUIPO",
          NOMBRE_EQUIPO
        )
        .query(`
          UPDATE INVENTARIO_M
          SET NOMBRE_EQUIPO =
            @NOMBRE_EQUIPO
          WHERE id = @id
        `);
    }

    return res.status(201).json({
      message:
        "Equipo agregado correctamente",
      id: idGenerado,
      NOMBRE_EQUIPO,
      Auso: formatearTiempoUso(
        FECHA_FABRICACION
      ),
      Grestante:
        formatearGarantiaRestante(
          FECHA_GARANTIA
        )
    });

  } catch (error) {
    console.error(
      "Error creando inventario:",
      error
    );

    return res.status(500).json({
      message: "Error creando inventario",
      error: error.message
    });
  }
};

/* =========================================================
   ACTUALIZAR INVENTARIO
========================================================= */

const actualizarInventario = async (
  req,
  res
) => {
  try {
    const Correo = req.usuario.Correo;

    const FOTO = req.file
      ? req.file.buffer
      : null;

    const idEquipo = Number(req.params.id);

    if (
      !Number.isInteger(idEquipo) ||
      idEquipo <= 0
    ) {
      return res.status(400).json({
        message:
          "El identificador del equipo no es válido."
      });
    }

    const {
      ID_UNIDAD,
      LOCALIDAD,
      UBICACION,
      ID_TIPO_EQUIPO,
      TIPO_IMPRESORA,
      ID_DEPARTAMENTO,
      PUESTO,
      SERIAL,
      FECHA_FABRICACION,
      FECHA_GARANTIA,
      FECHA_INICIO,
      ID_DISCO,
      ID_RAM,
      ID_PROCESADOR,
      MODELO_PROCESADOR,
      ID_SISTEMA_OPERATIVO,
      LECTOR_DE_HUELLA,
      CONEXION,
      ID_MARCA,
      MODELO,
      IP,
      PUERTO,
      ID_ESTATUS,
      ESTADO_FISICO,
      ACCESO_TEAM_VIEWER,
      CONTRASEÑA_TEAM_VIEWER,
      ACCESO_ANYDESK,
      CONTRASEÑA_ANYDESK,
      COMENTARIO
    } = req.body;

    const idUnidadNueva =
      convertirIdUnidad(ID_UNIDAD);

    if (!idUnidadNueva) {
      return res.status(400).json({
        message:
          "Selecciona una unidad válida."
      });
    }

    const permisos =
      await obtenerPermisosDesdeRequest(req);

    if (
      !puedeAccederUnidad(
        permisos,
        idUnidadNueva
      )
    ) {
      return res.status(403).json({
        message:
          "No tienes permiso para mover el equipo a esta unidad."
      });
    }

    const pool = await poolPromise;

    /* =====================================================
       VALIDAR SISTEMA OPERATIVO
    ===================================================== */

    let nombreSistemaOperativo = null;

    if (ID_SISTEMA_OPERATIVO) {
      const sistemaResult = await pool
        .request()
        .input(
          "ID_SISTEMA_OPERATIVO",
          sql.Int,
          Number(ID_SISTEMA_OPERATIVO)
        )
        .query(`
          SELECT
            id,
            Nombre,
            N_Version
          FROM SISTEMAS_OPERATIVOS
          WHERE id = @ID_SISTEMA_OPERATIVO
        `);

      if (
        sistemaResult.recordset.length === 0
      ) {
        return res.status(400).json({
          message:
            "El sistema operativo seleccionado no existe."
        });
      }

      nombreSistemaOperativo =
        sistemaResult.recordset[0].Nombre;
    }

    /* =====================================================
       EQUIPO ACTUAL
    ===================================================== */

    const requestEquipo = pool
      .request()
      .input(
        "IdEquipo",
        sql.Int,
        idEquipo
      );

    const condicionesEquipo = [
      "i.id = @IdEquipo"
    ];

    const filtroPermisos =
      crearFiltroUnidades({
        request: requestEquipo,
        permisos,
        columna: "i.ID_UNIDAD",
        prefijo: "EditarUnidadActual"
      });

    if (filtroPermisos) {
      condicionesEquipo.push(
        filtroPermisos
      );
    }

    const equipoActual =
      await requestEquipo.query(`
        SELECT
          i.id,
          i.ID_UNIDAD,
          i.NOMBRE_EQUIPO,
          i.FOTO
        FROM INVENTARIO_M i
        WHERE ${condicionesEquipo.join(
          " AND "
        )}
      `);

    if (
      equipoActual.recordset.length === 0
    ) {
      return res.status(404).json({
        message:
          "Equipo no encontrado o no tienes permiso para editarlo."
      });
    }

    /* =====================================================
       VALIDAR SERIAL
    ===================================================== */

    if (SERIAL) {
      const serialExiste = await pool
        .request()
        .input(
          "SERIAL",
          sql.NVarChar,
          SERIAL
        )
        .input(
          "IdEquipo",
          sql.Int,
          idEquipo
        )
        .query(`
          SELECT id
          FROM INVENTARIO_M
          WHERE SERIAL = @SERIAL
            AND id <> @IdEquipo
        `);

      if (
        serialExiste.recordset.length > 0
      ) {
        return res.status(400).json({
          message:
            "El número de serie ya existe en otro equipo."
        });
      }
    }

    /* =====================================================
       GENERAR NOMBRE
    ===================================================== */

    let NOMBRE_EQUIPO =
      equipoActual.recordset[0]
        .NOMBRE_EQUIPO || "NA";

    const aplicaNombre =
      await debeGenerarNombreEquipo(
        pool,
        idUnidadNueva,
        LOCALIDAD,
        ID_TIPO_EQUIPO
      );

    if (!aplicaNombre) {
      NOMBRE_EQUIPO = "NA";
    }

    if (aplicaNombre) {

      if (
        !ID_SISTEMA_OPERATIVO ||
        !nombreSistemaOperativo ||
        !FECHA_FABRICACION
      ) {
        return res.status(400).json({
          message:
            "El sistema operativo y la fecha de fabricación son obligatorios para generar el nombre del equipo."
        });
      }

      NOMBRE_EQUIPO =
        await generarNombreEquipo(
          pool,
          ID_TIPO_EQUIPO,
          nombreSistemaOperativo,
          FECHA_FABRICACION
        );
    }

    /* =====================================================
       FOTO
    ===================================================== */

    const fotoActual =
      equipoActual.recordset[0].FOTO;

    const fotoGuardada =
      FOTO || fotoActual || null;

    /* =====================================================
       ACTUALIZAR INVENTARIO
    ===================================================== */

    await pool
      .request()
      .input(
        "id",
        sql.Int,
        idEquipo
      )
      .input(
        "ID_UNIDAD",
        sql.Int,
        idUnidadNueva
      )
      .input(
        "LOCALIDAD",
        LOCALIDAD || null
      )
      .input(
        "UBICACION",
        UBICACION || null
      )
      .input(
        "ID_TIPO_EQUIPO",
        ID_TIPO_EQUIPO || null
      )
      .input(
        "TIPO_IMPRESORA",
        TIPO_IMPRESORA || null
      )
      .input(
        "NOMBRE_EQUIPO",
        NOMBRE_EQUIPO
      )
      .input(
        "ID_DEPARTAMENTO",
        ID_DEPARTAMENTO || null
      )
      .input(
        "PUESTO",
        PUESTO || null
      )
      .input(
        "SERIAL",
        SERIAL || null
      )
      .input(
        "FECHA_FABRICACION",
        FECHA_FABRICACION || null
      )
      .input(
        "FECHA_GARANTIA",
        FECHA_GARANTIA || null
      )
      .input(
        "FECHA_INICIO",
        FECHA_INICIO || null
      )
      .input(
        "ID_DISCO",
        ID_DISCO || null
      )
      .input(
        "ID_RAM",
        ID_RAM || null
      )
      .input(
        "ID_PROCESADOR",
        ID_PROCESADOR || null
      )
      .input(
        "MODELO_PROCESADOR",
        MODELO_PROCESADOR || null
      )
      .input(
        "ID_SISTEMA_OPERATIVO",
        ID_SISTEMA_OPERATIVO
          ? Number(ID_SISTEMA_OPERATIVO)
          : null
      )
      .input(
        "LECTOR_DE_HUELLA",
        LECTOR_DE_HUELLA || null
      )
      .input(
        "CONEXION",
        CONEXION || null
      )
      .input(
        "ID_MARCA",
        ID_MARCA || null
      )
      .input(
        "MODELO",
        MODELO || null
      )
      .input(
        "IP",
        IP || null
      )
      .input(
        "PUERTO",
        PUERTO || null
      )
      .input(
        "ID_ESTATUS",
        ID_ESTATUS || null
      )
      .input(
        "ESTADO_FISICO",
        ESTADO_FISICO || null
      )
      .input(
        "CORREO",
        Correo
      )
      .input(
        "ACCESO_TEAM_VIEWER",
        ACCESO_TEAM_VIEWER || null
      )
      .input(
        "CONTRASEÑA_TEAM_VIEWER",
        CONTRASEÑA_TEAM_VIEWER || null
      )
      .input(
        "ACCESO_ANYDESK",
        ACCESO_ANYDESK || null
      )
      .input(
        "CONTRASEÑA_ANYDESK",
        CONTRASEÑA_ANYDESK || null
      )
      .input(
        "FOTO",
        sql.VarBinary(sql.MAX),
        fotoGuardada
      )
      .input(
        "COMENTARIO",
        COMENTARIO || null
      )
      .query(`
        UPDATE INVENTARIO_M
        SET
          ID_UNIDAD = @ID_UNIDAD,
          LOCALIDAD = @LOCALIDAD,
          UBICACION = @UBICACION,
          ID_TIPO_EQUIPO =
            @ID_TIPO_EQUIPO,
          TIPO_IMPRESORA =
            @TIPO_IMPRESORA,
          NOMBRE_EQUIPO =
            @NOMBRE_EQUIPO,
          ID_DEPARTAMENTO =
            @ID_DEPARTAMENTO,
          PUESTO = @PUESTO,
          SERIAL = @SERIAL,
          FECHA_FABRICACION =
            @FECHA_FABRICACION,
          FECHA_GARANTIA =
            @FECHA_GARANTIA,
          FECHA_INICIO =
            @FECHA_INICIO,
          ID_DISCO = @ID_DISCO,
          ID_RAM = @ID_RAM,
          ID_PROCESADOR =
            @ID_PROCESADOR,
          MODELO_PROCESADOR =
            @MODELO_PROCESADOR,
          id_sistema_operativo =
            @ID_SISTEMA_OPERATIVO,
          LECTOR_DE_HUELLA =
            @LECTOR_DE_HUELLA,
          CONEXION = @CONEXION,
          ID_MARCA = @ID_MARCA,
          MODELO = @MODELO,
          IP = @IP,
          PUERTO = @PUERTO,
          ID_ESTATUS = @ID_ESTATUS,
          ESTADO_FISICO =
            @ESTADO_FISICO,
          CORREO = @CORREO,
          ACCESO_TEAM_VIEWER =
            @ACCESO_TEAM_VIEWER,
          CONTRASEÑA_TEAM_VIEWER =
            @CONTRASEÑA_TEAM_VIEWER,
          ACCESO_ANYDESK =
            @ACCESO_ANYDESK,
          CONTRASEÑA_ANYDESK =
            @CONTRASEÑA_ANYDESK,
          FOTO = @FOTO,
          COMENTARIO = @COMENTARIO
        WHERE id = @id
      `);

    return res.json({
      message:
        "Equipo actualizado correctamente",
      NOMBRE_EQUIPO,
      Auso: formatearTiempoUso(
        FECHA_FABRICACION
      ),
      Grestante:
        formatearGarantiaRestante(
          FECHA_GARANTIA
        )
    });

  } catch (error) {
    console.error(
      "Error actualizando inventario:",
      error
    );

    return res.status(500).json({
      message:
        "Error actualizando inventario",
      error: error.message
    });
  }
};

/* =========================================================
   ELIMINAR INVENTARIO
========================================================= */

const eliminarInventario = async (
  req,
  res
) => {
  try {
    const idEquipo = Number(req.params.id);

    if (
      !Number.isInteger(idEquipo) ||
      idEquipo <= 0
    ) {
      return res.status(400).json({
        message:
          "El identificador del equipo no es válido."
      });
    }

    const pool = await poolPromise;

    const permisos =
      await obtenerPermisosDesdeRequest(req);

    const request = pool
      .request()
      .input(
        "IdEquipo",
        sql.Int,
        idEquipo
      );

    const condiciones = [
      "id = @IdEquipo"
    ];

    const filtroPermisos =
      crearFiltroUnidades({
        request,
        permisos,
        columna: "ID_UNIDAD",
        prefijo: "EliminarUnidad"
      });

    if (filtroPermisos) {
      condiciones.push(filtroPermisos);
    }

    const result = await request.query(`
      DELETE FROM INVENTARIO_M
      WHERE ${condiciones.join(" AND ")}
    `);

    if (
      !result.rowsAffected ||
      result.rowsAffected[0] === 0
    ) {
      return res.status(404).json({
        message:
          "Equipo no encontrado o no tienes permiso para eliminarlo."
      });
    }

    return res.json({
      message:
        "Equipo eliminado correctamente"
    });
  } catch (error) {
    console.error(
      "Error eliminando inventario:",
      error
    );

    return res.status(500).json({
      message:
        "Error eliminando inventario",
      error: error.message
    });
  }
};

/* =========================================================
   ÁRBOL DE UNIDADES
========================================================= */

const obtenerArbolUnidades = async (
  req,
  res
) => {
  try {
    const pool = await poolPromise;

    const permisos =
      await obtenerPermisosDesdeRequest(req);

    const request = pool.request();
    const condiciones = [];

    const filtroPermisos =
      crearFiltroUnidades({
        request,
        permisos,
        columna: "u.id",
        prefijo: "ArbolUnidad"
      });

    if (filtroPermisos) {
      condiciones.push(filtroPermisos);
    }

    const where =
      condiciones.length > 0
        ? `WHERE ${condiciones.join(
            " AND "
          )}`
        : "";

    const result = await request.query(`
      SELECT
        r.id_marca,
        r.Marca,
        u.id AS idUnidad,
        u.Ubicacion,
        COUNT(i.id) AS total
      FROM Unidades u
      INNER JOIN Restaurantes r
        ON u.id_marca = r.id_marca
      LEFT JOIN INVENTARIO_M i
        ON i.ID_UNIDAD = u.id
      ${where}
      GROUP BY
        r.id_marca,
        r.Marca,
        u.id,
        u.Ubicacion
      ORDER BY
        r.Marca,
        u.Ubicacion
    `);

    const arbol = [];

    result.recordset.forEach((item) => {
      let restaurante = arbol.find(
        (x) =>
          Number(x.id) ===
          Number(item.id_marca)
      );

      if (!restaurante) {
        restaurante = {
          id: item.id_marca,
          nombre: item.Marca,
          total: 0,
          children: []
        };

        arbol.push(restaurante);
      }

      restaurante.total += Number(
        item.total || 0
      );

      restaurante.children.push({
        id: item.idUnidad,
        nombre: item.Ubicacion,
        total: Number(item.total || 0)
      });
    });

    return res.json(arbol);
  } catch (error) {
    console.error(
      "Error obteniendo árbol de unidades:",
      error
    );

    return res.status(500).json({
      message:
        "Error obteniendo árbol de unidades.",
      error: error.message
    });
  }
};

/* =========================================================
   EXPORTAR INVENTARIO A EXCEL
========================================================= */

const exportarInventarioExcel = async (
  req,
  res
) => {
  try {
    const pool = await poolPromise;

    const permisos =
      await obtenerPermisosDesdeRequest(req);

    const { unidad } = req.query;

    const request = pool.request();
    const condiciones = [];

    const filtroPermisos =
      crearFiltroUnidades({
        request,
        permisos,
        columna: "i.ID_UNIDAD",
        prefijo: "ExcelUnidad"
      });

    if (filtroPermisos) {
      condiciones.push(filtroPermisos);
    }

    if (
      unidad !== undefined &&
      unidad !== null &&
      unidad !== ""
    ) {
      const idUnidad =
        convertirIdUnidad(unidad);

      if (!idUnidad) {
        return res.status(400).json({
          message:
            "La unidad enviada no es válida."
        });
      }

      if (
        !puedeAccederUnidad(
          permisos,
          idUnidad
        )
      ) {
        return res.status(403).json({
          message:
            "No tienes permiso para exportar esta unidad."
        });
      }

      request.input(
        "UnidadExcelSeleccionada",
        sql.Int,
        idUnidad
      );

      condiciones.push(
        "i.ID_UNIDAD = @UnidadExcelSeleccionada"
      );
    }

    const where =
      condiciones.length > 0
        ? `WHERE ${condiciones.join(
            " AND "
          )}`
        : "";

    const result = await request.query(`
      SELECT
        i.id,

        i.ID_UNIDAD,
        r.Marca AS UNIDAD,
        i.LOCALIDAD,
        i.UBICACION,

        i.ID_DEPARTAMENTO,
        d.Nombre_departamento AS DEPARTAMENTO,
        i.PUESTO,

        i.ID_TIPO_EQUIPO,
        te.tequipo AS TIPO_EQUIPO,
        i.TIPO_IMPRESORA,
        i.NOMBRE_EQUIPO,

        i.SERIAL,

        i.FECHA_FABRICACION,
        i.FECHA_GARANTIA,
        i.FECHA_INICIO,
        i.FECHA_REGISTRO,

        i.ID_DISCO,
        CONCAT(
          dd.modelo_disco,
          ' ',
          dd.capacidad
        ) AS DISCO_DURO,

        i.ID_RAM,
        mr.capacidad AS MEMORIA_RAM,

        i.ID_PROCESADOR,
        p.Nombre AS PROCESADOR,
        i.MODELO_PROCESADOR,

        i.id_sistema_operativo AS ID_SISTEMA_OPERATIVO,
        so.Nombre AS SISTEMA_OPERATIVO,
        so.N_Version AS VERSION_SISTEMA_OPERATIVO,

        i.LECTOR_DE_HUELLA,
        i.CONEXION,

        i.ID_MARCA,
        m.Marca AS MARCA,
        i.MODELO,

        i.IP,
        i.PUERTO,

        i.ID_ESTATUS,
        e.Estatus_equipo AS ESTATUS,
        i.ESTADO_FISICO,

        i.CORREO,

        i.ACCESO_TEAM_VIEWER,
        i.CONTRASEÑA_TEAM_VIEWER,
        i.ACCESO_ANYDESK,
        i.CONTRASEÑA_ANYDESK,
        i.FOTO,

        i.COMENTARIO

      FROM INVENTARIO_M i

      LEFT JOIN Unidades u
        ON i.ID_UNIDAD = u.id

      LEFT JOIN Restaurantes r
        ON u.id_marca = r.id_marca

      LEFT JOIN Tipo_equipo te
        ON i.ID_TIPO_EQUIPO = te.id

      LEFT JOIN DEPARTAMENTOS d
        ON i.ID_DEPARTAMENTO = d.Id

      LEFT JOIN PROCESADORES p
        ON i.ID_PROCESADOR = p.id

      LEFT JOIN MEMORIA_RAM mr
        ON i.ID_RAM = mr.id

      LEFT JOIN DISCO_DURO dd
        ON i.ID_DISCO = dd.id

      LEFT JOIN SISTEMAS_OPERATIVOS so
        ON i.id_sistema_operativo = so.id

      LEFT JOIN Marcas m
        ON i.ID_MARCA = m.id

      LEFT JOIN Estatus e
        ON i.ID_ESTATUS = e.Id

      ${where}

      ORDER BY
        r.Marca,
        i.LOCALIDAD,
        i.NOMBRE_EQUIPO,
        i.id
    `);

    const inventario =
      result.recordset.map(
        aplicarCalculosInventario
      );

    const excel =
      await generarInventarioExcel(
        inventario
      );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="InventarioGA.xlsx"'
    );

    return res.send(excel);

  } catch (error) {
    console.error(
      "Error exportando inventario a Excel:",
      error
    );

    return res.status(500).json({
      message: "Error exportando Excel",
      error: error.message
    });
  }
};

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  obtenerInventario,
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario,
  obtenerArbolUnidades,
  exportarInventarioExcel
};