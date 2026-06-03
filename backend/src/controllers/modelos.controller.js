const { poolPromise } = require("../config/db");

const obtenerModelos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        mo.id,
        mo.id_tequipo,
        te.tequipo,
        mo.id_marca,
        ma.Marca,
        mo.id_modelos,
        me.Mod_esp AS Modelo
      FROM Modelos mo
      LEFT JOIN Tipo_equipo te ON mo.id_tequipo = te.id
      LEFT JOIN Marcas ma ON mo.id_marca = ma.id
      LEFT JOIN modesp me ON mo.id_modelos = me.id
      ORDER BY ma.Marca, me.Mod_esp
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo modelos",
      error: error.message
    });
  }
};

const obtenerModeloPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", id)
      .query(`
        SELECT 
          id,
          id_tequipo,
          id_marca,
          id_modelos
        FROM Modelos
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Modelo no encontrado"
      });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo modelo",
      error: error.message
    });
  }
};

const crearModelo = async (req, res) => {
  try {
    const { id_tequipo, id_marca, id_modelos } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("id_tequipo", id_tequipo || null)
      .input("id_marca", id_marca || null)
      .input("id_modelos", id_modelos || null)
      .query(`
        INSERT INTO Modelos (
          id_tequipo,
          id_marca,
          id_modelos
        )
        VALUES (
          @id_tequipo,
          @id_marca,
          @id_modelos
        )
      `);

    res.status(201).json({
      message: "Modelo creado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando modelo",
      error: error.message
    });
  }
};

const actualizarModelo = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_tequipo, id_marca, id_modelos } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("id_tequipo", id_tequipo || null)
      .input("id_marca", id_marca || null)
      .input("id_modelos", id_modelos || null)
      .query(`
        UPDATE Modelos
        SET
          id_tequipo = @id_tequipo,
          id_marca = @id_marca,
          id_modelos = @id_modelos
        WHERE id = @id
      `);

    res.json({
      message: "Modelo actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando modelo",
      error: error.message
    });
  }
};

const eliminarModelo = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM Modelos
        WHERE id = @id
      `);

    res.json({
      message: "Modelo eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando modelo",
      error: error.message
    });
  }
};

module.exports = {
  obtenerModelos,
  obtenerModeloPorId,
  crearModelo,
  actualizarModelo,
  eliminarModelo
};