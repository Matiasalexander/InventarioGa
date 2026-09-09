const sql = require("mssql");
const { poolPromise } = require("../config/db");

const obtenerComplementosPorInventario = async (req, res) => {
  try {
    const idInventario = Number(req.params.id);

    if (
      !Number.isInteger(idInventario) ||
      idInventario <= 0
    ) {
      return res.status(400).json({
        message: "El identificador del equipo no es válido."
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
      .input(
        "IdInventario",
        sql.Int,
        idInventario
      )
      .query(`
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
        message:
          "El equipo no existe o no corresponde a un equipo POS."
      });
    }

    /*
    =========================================================
    OBTENER COMPLEMENTOS
    =========================================================
    */

    const result = await pool
      .request()
      .input(
        "IdInventario",
        sql.Int,
        idInventario
      )
      .query(`
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

    console.error(
      "Error obteniendo complementos POS:",
      error
    );

    return res.status(500).json({
      message: "Error obteniendo complementos POS",
      error: error.message
    });
  }
};

module.exports = {
  obtenerComplementosPorInventario
};