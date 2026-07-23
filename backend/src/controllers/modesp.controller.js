const { poolPromise } = require("../config/db");

const obtenerModesp = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, Mod_esp
      FROM modesp
      ORDER BY Mod_esp
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo modelos especiales",
      error: error.message
    });
  }
};

const crearModesp = async (req, res) => {
  try {
    const { Mod_esp } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("Mod_esp", Mod_esp)
      .query(`
        INSERT INTO modesp (Mod_esp)
        VALUES (@Mod_esp)
      `);

    res.status(201).json({
      message: "Modelo especial creado correctamente"
    });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({
        message: "Ya existe un modelo con ese nombre"
      });
    }
    res.status(500).json({
      message: "Error creando modelo",
      error: error.message
    });

  }
};

const actualizarModesp = async (req, res) => {
  try {
    const { id } = req.params;
    const { Mod_esp } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Mod_esp", Mod_esp)
      .query(`
        UPDATE modesp
        SET Mod_esp = @Mod_esp
        WHERE id = @id
      `);

    res.json({
      message: "Modelo especial actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando modelo especial",
      error: error.message
    });
  }
};

const eliminarModesp = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM modesp
        WHERE id = @id
      `);

    res.json({
      message: "Modelo especial eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando modelo especial",
      error: error.message
    });
  }
};

module.exports = {
  obtenerModesp,
  crearModesp,
  actualizarModesp,
  eliminarModesp
};