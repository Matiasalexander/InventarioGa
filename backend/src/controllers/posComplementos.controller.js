const sql = require("mssql");
const { poolPromise } = require("../config/db");

    const {
      obtenerPermisosInventario
    } = require("../helpers/permisosInventario");


const obtenerComplementosPorInventario = async (req, res) => {
  try {
    const idInventario = Number(req.params.id);

    if (!Number.isInteger(idInventario) || idInventario <= 0) {
      return res.status(400).json({
        message: "El identificador del equipo no es válido.",
      });
    }

    const pool = await poolPromise;

    /*
    =========================================================
    VALIDAR QUE EL EQUIPO EXISTA Y SEA POS
    =========================================================
    */

    const equipoResult = await pool
      .request()
      .input("IdInventario", sql.Int, idInventario).query(`
        SELECT
          i.id,
          i.ID_UNIDAD,
          te.tequipo AS TIPO_EQUIPO
        FROM INVENTARIO_M i
        INNER JOIN Tipo_equipo te
          ON i.ID_TIPO_EQUIPO = te.id
        WHERE i.id = @IdInventario
          AND UPPER(LTRIM(RTRIM(te.tequipo))) = 'POS'
      `);

    if (equipoResult.recordset.length === 0) {
      return res.status(404).json({
        message: "El equipo no existe o no corresponde a un equipo POS.",
      });
    }

    /*
    =========================================================
    OBTENER COMPLEMENTOS
    =========================================================
    */

    const result = await pool
      .request()
      .input("IdInventario", sql.Int, idInventario).query(`
        SELECT
          ID_COMPLEMENTO,
          ID_INVENTARIO,
          TERMINAL_YCS,
          INSTALACION_NOBREAK,
          IP_YCS,
          NUMERO_SERIE,
          CODIGO_ACTIVACION,
          ESTADO,
          FECHA_ASIGNACION,
          FECHA_BAJA,
          FECHA_REGISTRO,
          FECHA_ACTUALIZACION,
          COMENTARIOS
        FROM POS_COMPLEMENTOS
        WHERE ID_INVENTARIO = @IdInventario
        ORDER BY
          CASE
            WHEN ESTADO = 'Asignada' THEN 1
            WHEN ESTADO = 'Nueva' THEN 2
            WHEN ESTADO = 'Dañada' THEN 3
            ELSE 4
          END,
          ID_COMPLEMENTO DESC
      `);

    return res.json(result.recordset);
  } catch (error) {
    console.error("Error obteniendo complementos POS:", error);

    return res.status(500).json({
      message: "Error obteniendo complementos POS",
      error: error.message,
    });
  }
};

const crearComplementoPOS = async (req, res) => {
  try {
    const {
      ID_INVENTARIO,
      TERMINAL_YCS,
      INSTALACION_NOBREAK,
      IP_YCS,
      NUMERO_SERIE,
      CODIGO_ACTIVACION,
      ESTADO,
      COMENTARIOS,
    } = req.body;

    const idInventario = Number(ID_INVENTARIO);

    /* =====================================================
       VALIDAR ID DEL INVENTARIO
    ===================================================== */

    if (!Number.isInteger(idInventario) || idInventario <= 0) {
      return res.status(400).json({
        message: "El identificador del equipo no es válido.",
      });
    }

    /* =====================================================
       VALIDAR ESTADO
    ===================================================== */

    const estadosPermitidos = ["Nueva", "Asignada", "Dañada"];

    if (!estadosPermitidos.includes(ESTADO)) {
      return res.status(400).json({
        message: "El estado del complemento no es válido.",
      });
    }

    const pool = await poolPromise;

    /* =====================================================
       VALIDAR EQUIPO Y QUE SEA POS
    ===================================================== */

    const equipoResult = await pool
      .request()
      .input("IdInventario", sql.Int, idInventario).query(`
        SELECT
          i.id,
          i.ID_UNIDAD,
          te.tequipo AS TIPO_EQUIPO
        FROM INVENTARIO_M i
        INNER JOIN Tipo_equipo te
          ON i.ID_TIPO_EQUIPO = te.id
        WHERE i.id = @IdInventario
          AND UPPER(LTRIM(RTRIM(te.tequipo))) = 'POS'
      `);

    if (equipoResult.recordset.length === 0) {
      return res.status(404).json({
        message: "El equipo no existe o no corresponde a un equipo POS.",
      });
    }

    const idUnidad = equipoResult.recordset[0].ID_UNIDAD;

    /* =====================================================
       VALIDAR PERMISOS DE LA UNIDAD
    ===================================================== */

    const idUsuario = Number(req.usuario?.IdUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(401).json({
        message: "No fue posible identificar al usuario autenticado.",
      });
    }

    const permisos = await obtenerPermisosInventario(idUsuario);

    if (!permisos.verTodas) {
      const unidadesPermitidas = (permisos.unidades || []).map(Number);

      if (!unidadesPermitidas.includes(Number(idUnidad))) {
        return res.status(403).json({
          message:
            "No tienes permiso para registrar complementos en esta unidad.",
        });
      }
    }

    /* =====================================================
       VALIDAR COMPLEMENTO ASIGNADO EXISTENTE
    ===================================================== */

    if (ESTADO === "Asignada") {
      const asignadaResult = await pool
        .request()
        .input("IdInventario", sql.Int, idInventario).query(`
          SELECT COUNT(*) AS total
          FROM POS_COMPLEMENTOS
          WHERE ID_INVENTARIO = @IdInventario
            AND ESTADO = 'Asignada'
        `);

      const totalAsignadas = Number(asignadaResult.recordset[0]?.total || 0);

      if (totalAsignadas > 0) {
        return res.status(400).json({
          message: "El equipo ya tiene un complemento POS asignado.",
        });
      }
    }

    /* =====================================================
       FECHAS SEGÚN ESTADO
    ===================================================== */

    let fechaAsignacion = null;
    let fechaBaja = null;

    if (ESTADO === "Asignada") {
      fechaAsignacion = new Date();
    }

    if (ESTADO === "Dañada") {
      fechaBaja = new Date();
    }

    /* =====================================================
       INSERTAR COMPLEMENTO
    ===================================================== */

    const result = await pool
      .request()
      .input("ID_INVENTARIO", sql.Int, idInventario)
      .input("TERMINAL_YCS", sql.VarChar(100), TERMINAL_YCS || null)
      .input(
        "INSTALACION_NOBREAK",
        sql.VarChar(100),
        INSTALACION_NOBREAK || null,
      )
      .input("IP_YCS", sql.VarChar(45), IP_YCS || null)
      .input("NUMERO_SERIE", sql.VarChar(100), NUMERO_SERIE || null)
      .input("CODIGO_ACTIVACION", sql.VarChar(255), CODIGO_ACTIVACION || null)
      .input("ESTADO", sql.VarChar(20), ESTADO)
      .input("FECHA_ASIGNACION", sql.DateTime, fechaAsignacion)
      .input("FECHA_BAJA", sql.DateTime, fechaBaja)
      .input("COMENTARIOS", sql.VarChar(500), COMENTARIOS || null).query(`
        INSERT INTO POS_COMPLEMENTOS (
          ID_INVENTARIO,
          TERMINAL_YCS,
          INSTALACION_NOBREAK,
          IP_YCS,
          NUMERO_SERIE,
          CODIGO_ACTIVACION,
          ESTADO,
          FECHA_ASIGNACION,
          FECHA_BAJA,
          COMENTARIOS
        )
        OUTPUT
          INSERTED.ID_COMPLEMENTO,
          INSERTED.ID_INVENTARIO,
          INSERTED.ESTADO
        VALUES (
          @ID_INVENTARIO,
          @TERMINAL_YCS,
          @INSTALACION_NOBREAK,
          @IP_YCS,
          @NUMERO_SERIE,
          @CODIGO_ACTIVACION,
          @ESTADO,
          @FECHA_ASIGNACION,
          @FECHA_BAJA,
          @COMENTARIOS
        )
      `);

    const complemento = result.recordset[0];

    return res.status(201).json({
      message: "Complemento POS creado correctamente",
      ...complemento,
    });
  } catch (error) {
    console.error("Error creando complemento POS:", error);

    return res.status(500).json({
      message: "Error creando complemento POS",
      error: error.message,
    });
  }
};

const actualizarComplementoPOS = async (req, res) => {
  try {
    const idComplemento = Number(req.params.id);

    if (!Number.isInteger(idComplemento) || idComplemento <= 0) {
      return res.status(400).json({
        message: "El identificador del complemento no es válido.",
      });
    }

    const {
      TERMINAL_YCS,
      INSTALACION_NOBREAK,
      IP_YCS,
      NUMERO_SERIE,
      CODIGO_ACTIVACION,
      ESTADO,
      COMENTARIOS,
    } = req.body;

    const estadosPermitidos = ["Nueva", "Asignada", "Dañada"];

    if (!estadosPermitidos.includes(ESTADO)) {
      return res.status(400).json({
        message: "El estado del complemento no es válido.",
      });
    }

    const pool = await poolPromise;

    // Obtener complemento actual
    const complementoResult = await pool
      .request()
      .input("IdComplemento", sql.Int, idComplemento).query(`
        SELECT
          pc.ID_COMPLEMENTO,
          pc.ID_INVENTARIO,
          pc.ESTADO,
          i.ID_UNIDAD
        FROM POS_COMPLEMENTOS pc
        INNER JOIN INVENTARIO_M i
          ON pc.ID_INVENTARIO = i.id
        INNER JOIN Tipo_equipo te
          ON i.ID_TIPO_EQUIPO = te.id
        WHERE pc.ID_COMPLEMENTO = @IdComplemento
          AND UPPER(LTRIM(RTRIM(te.tequipo))) = 'POS'
      `);

    if (complementoResult.recordset.length === 0) {
      return res.status(404).json({
        message: "El complemento POS no existe.",
      });
    }

    const complementoActual = complementoResult.recordset[0];

    // Validar permisos del usuario sobre la unidad
    const idUsuario = Number(req.usuario?.IdUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(401).json({
        message: "No fue posible identificar al usuario autenticado.",
      });
    }

    const permisos = await obtenerPermisosInventario(idUsuario);

    const puedeAcceder =
      permisos.verTodas ||
      permisos.unidades
        .map(Number)
        .includes(Number(complementoActual.ID_UNIDAD));

    if (!puedeAcceder) {
      return res.status(403).json({
        message: "No tienes permisos para modificar este complemento POS.",
      });
    }

    // Si se quiere asignar, verificar que no exista
    // otro complemento asignado a la misma POS
    if (ESTADO === "Asignada") {
      const asignadoResult = await pool
        .request()
        .input("IdInventario", sql.Int, complementoActual.ID_INVENTARIO)
        .input("IdComplemento", sql.Int, idComplemento).query(`
          SELECT TOP 1
            ID_COMPLEMENTO
          FROM POS_COMPLEMENTOS
          WHERE ID_INVENTARIO = @IdInventario
            AND ESTADO = 'Asignada'
            AND ID_COMPLEMENTO <> @IdComplemento
        `);

      if (asignadoResult.recordset.length > 0) {
        return res.status(400).json({
          message: "El equipo ya tiene un complemento POS asignado.",
        });
      }
    }

    /*
      Determinar fechas según el nuevo estado.
    */

    let fechaAsignacion = null;
    let fechaBaja = null;

    if (ESTADO === "Asignada") {
      fechaAsignacion =
        complementoActual.ESTADO === "Asignada" ? null : new Date();
    }

    if (ESTADO === "Dañada") {
      fechaBaja = complementoActual.ESTADO === "Dañada" ? null : new Date();
    }

    const request = pool
      .request()
      .input("IdComplemento", sql.Int, idComplemento)
      .input("TerminalYCS", sql.VarChar(100), TERMINAL_YCS || null)
      .input(
        "InstalacionNoBreak",
        sql.VarChar(100),
        INSTALACION_NOBREAK || null,
      )
      .input("IpYCS", sql.VarChar(45), IP_YCS || null)
      .input("NumeroSerie", sql.VarChar(100), NUMERO_SERIE || null)
      .input("CodigoActivacion", sql.VarChar(255), CODIGO_ACTIVACION || null)
      .input("Estado", sql.VarChar(20), ESTADO)
      .input("Comentarios", sql.VarChar(500), COMENTARIOS || null);

    /*
      Si queda Asignada:
      - conserva fecha de asignación si ya existía
      - limpia fecha de baja

      Si queda Dañada:
      - conserva fecha de asignación
      - establece fecha de baja

      Si queda Nueva:
      - ambas fechas quedan NULL
    */

    if (ESTADO === "Asignada") {
      request.input(
        "FechaAsignacion",
        sql.DateTime,
        fechaAsignacion ||
          (
            await pool.request().input("IdComplemento", sql.Int, idComplemento)
              .query(`
                SELECT FECHA_ASIGNACION
                FROM POS_COMPLEMENTOS
                WHERE ID_COMPLEMENTO = @IdComplemento
              `)
          ).recordset[0]?.FECHA_ASIGNACION ||
          new Date(),
      );

      request.input("FechaBaja", sql.DateTime, null);
    } else if (ESTADO === "Dañada") {
      const fechasActuales = await pool
        .request()
        .input("IdComplemento", sql.Int, idComplemento).query(`
          SELECT FECHA_ASIGNACION
          FROM POS_COMPLEMENTOS
          WHERE ID_COMPLEMENTO = @IdComplemento
        `);

      request.input(
        "FechaAsignacion",
        sql.DateTime,
        fechasActuales.recordset[0]?.FECHA_ASIGNACION || null,
      );

      request.input("FechaBaja", sql.DateTime, fechaBaja || new Date());
    } else {
      request.input("FechaAsignacion", sql.DateTime, null);

      request.input("FechaBaja", sql.DateTime, null);
    }

    const result = await request.query(`
      UPDATE POS_COMPLEMENTOS
      SET
        TERMINAL_YCS = @TerminalYCS,
        INSTALACION_NOBREAK = @InstalacionNoBreak,
        IP_YCS = @IpYCS,
        NUMERO_SERIE = @NumeroSerie,
        CODIGO_ACTIVACION = @CodigoActivacion,
        ESTADO = @Estado,
        FECHA_ASIGNACION = @FechaAsignacion,
        FECHA_BAJA = @FechaBaja,
        FECHA_ACTUALIZACION = GETDATE(),
        COMENTARIOS = @Comentarios
      OUTPUT
        INSERTED.ID_COMPLEMENTO,
        INSERTED.ID_INVENTARIO,
        INSERTED.ESTADO,
        INSERTED.FECHA_ASIGNACION,
        INSERTED.FECHA_BAJA
      WHERE ID_COMPLEMENTO = @IdComplemento
    `);

    return res.json({
      message: "Complemento POS actualizado correctamente",
      complemento: result.recordset[0],
    });
  } catch (error) {
    console.error("Error actualizando complemento POS:", error);

    return res.status(500).json({
      message: "Error actualizando complemento POS",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerComplementosPorInventario,
  crearComplementoPOS,
  actualizarComplementoPOS,
};
