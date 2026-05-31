const { poolPromise } = require("../config/db");

const obtenerCatalogos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const unidades = await pool.request().query(`
      SELECT id, Ubicacion, Estado
      FROM Unidades
      ORDER BY Ubicacion
    `);

    const tiposEquipo = await pool.request().query(`
      SELECT id, tequipo
      FROM Tipo_equipo
      ORDER BY tequipo
    `);

    const marcas = await pool.request().query(`
      SELECT id, Marca
      FROM Marcas
      ORDER BY Marca
    `);

    const modelos = await pool.request().query(`
      SELECT id, tequipo, marca, Modelos
      FROM Modelos
      ORDER BY Modelos
    `);

    const estatus = await pool.request().query(`
      SELECT Id, Estatus_equipo
      FROM Estatus
      ORDER BY Estatus_equipo
    `);

    const departamentos = await pool.request().query(`
      SELECT Id, Nombre_departamento
      FROM DEPARTAMENTOS
      ORDER BY Nombre_departamento
    `);

    res.json({
      unidades: unidades.recordset,
      tiposEquipo: tiposEquipo.recordset,
      marcas: marcas.recordset,
      modelos: modelos.recordset,
      estatus: estatus.recordset,
      departamentos: departamentos.recordset
    });

  } catch (error) {
    console.error("Error obteniendo catálogos:", error);

    res.status(500).json({
      message: "Error obteniendo catálogos",
      error: error.message
    });
  }
};

module.exports = {
  obtenerCatalogos
};