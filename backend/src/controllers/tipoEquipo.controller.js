const { poolPromise } = require("../config/db");

const obtenerTiposEquipo = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, tequipo
      FROM Tipo_equipo
      ORDER BY tequipo
    `);

    res.json(result.recordset);

  } catch (error) {

    res.status(500).json({
      message: "Error obteniendo tipos de equipo",
      error: error.message
    });

  }
};

const obtenerTipoEquipoPorId = async (req, res) => {
  try {

    const { id } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", id)
      .query(`
        SELECT id, tequipo
        FROM Tipo_equipo
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Tipo de equipo no encontrado"
      });
    }

    res.json(result.recordset[0]);

  } catch (error) {

    res.status(500).json({
      message: "Error obteniendo tipo de equipo",
      error: error.message
    });

  }
};

const crearTipoEquipo = async (req, res) => {
  try {

    const { tequipo } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("tequipo", tequipo)
      .query(`
        INSERT INTO Tipo_equipo (tequipo)
        VALUES (@tequipo)
      `);

    res.status(201).json({
      message: "Tipo de equipo creado correctamente"
    });

  } catch (error) {

    res.status(500).json({
      message: "Error creando tipo de equipo",
      error: error.message
    });

  }
};

const actualizarTipoEquipo = async (req, res) => {
  try {

    const { id } = req.params;
    const { tequipo } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("tequipo", tequipo)
      .query(`
        UPDATE Tipo_equipo
        SET tequipo = @tequipo
        WHERE id = @id
      `);

    res.json({
      message: "Tipo de equipo actualizado correctamente"
    });

  } catch (error) {

    res.status(500).json({
      message: "Error actualizando tipo de equipo",
      error: error.message
    });

  }
};

const eliminarTipoEquipo = async (req, res) => {
  try {

    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM Tipo_equipo
        WHERE id = @id
      `);

    res.json({
      message: "Tipo de equipo eliminado correctamente"
    });

  } catch (error) {

    res.status(500).json({
      message: "Error eliminando tipo de equipo",
      error: error.message
    });

  }
};

module.exports = {
  obtenerTiposEquipo,
  obtenerTipoEquipoPorId,
  crearTipoEquipo,
  actualizarTipoEquipo,
  eliminarTipoEquipo
};