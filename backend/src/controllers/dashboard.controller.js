const { poolPromise } = require("../config/db");

const obtenerDashboard = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        COUNT(*) AS TotalEquipos,
        SUM(CASE WHEN ISNULL(RESPONSIVA_DIGITAL, 0) = 1 THEN 1 ELSE 0 END) AS EquiposAsignados,
        SUM(CASE WHEN ISNULL(RESPONSIVA_DIGITAL, 0) = 0 THEN 1 ELSE 0 END) AS EquiposDisponibles,
        SUM(CASE WHEN ESTADO_FISICO = 'Dañado' THEN 1 ELSE 0 END) AS EquiposDanados,
        SUM(CASE WHEN Grestante BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS GarantiasPorVencer,
        SUM(CASE WHEN Grestante < 0 THEN 1 ELSE 0 END) AS GarantiasVencidas
      FROM INVENTARIO_M
    `);

    const porTipo = await pool.request().query(`
      SELECT
        te.tequipo AS TipoEquipo,
        COUNT(*) AS Total
      FROM INVENTARIO_M i
      LEFT JOIN Tipo_equipo te ON i.ID_TIPO_EQUIPO = te.id
      GROUP BY te.tequipo
      ORDER BY Total DESC
    `);

    const porRestaurante = await pool.request().query(`
      SELECT
        r.Marca AS Restaurante,
        COUNT(*) AS Total
      FROM INVENTARIO_M i
      LEFT JOIN Unidades u ON i.ID_UNIDAD = u.id
      LEFT JOIN Restaurantes r ON u.id_marca = r.id_marca
      GROUP BY r.Marca
      ORDER BY Total DESC
    `);

    const porEstatus = await pool.request().query(`
      SELECT
        e.Estatus_equipo AS Estatus,
        COUNT(*) AS Total
      FROM INVENTARIO_M i
      LEFT JOIN Estatus e ON i.ID_ESTATUS = e.Id
      GROUP BY e.Estatus_equipo
      ORDER BY Total DESC
    `);

    res.json({
      resumen: result.recordset[0],
      porTipo: porTipo.recordset,
      porRestaurante: porRestaurante.recordset,
      porEstatus: porEstatus.recordset
    });
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo dashboard",
      error: error.message
    });
  }
};

module.exports = {
  obtenerDashboard
};