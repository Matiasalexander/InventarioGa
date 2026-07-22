const { poolPromise } = require("../config/db");

const obtenerRam = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, capacidad
      FROM MEMORIA_RAM
      ORDER BY capacidad
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo memorias RAM",
      error: error.message
    });
  }
};

const crearRAM = async (req, res) => {
  try {
    const { capacidad } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("capacidad", capacidad)
      .query(`
        INSERT INTO MEMORIA_RAM (capacidad)
        VALUES (@capacidad)
      `);

    res.status(201).json({
      message: "Memoria RAM creada exitosamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando memoria RAM",
      error: error.message
    });
  }
};

const actualizarRAM = async (req, res) => {
  try {
    const { id } = req.params;
    const { capacidad } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("capacidad", capacidad)
      .query(`
        UPDATE MEMORIA_RAM
        SET
          capacidad = @capacidad
        WHERE id = @id
      `);

    res.json({
      message: "Memoria RAM actualizada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando memoria RAM",
      error: error.message
    });
  }
};

const eliminarRAM = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM MEMORIA_RAM
        WHERE id = @id
      `);

    res.json({
      message: "Memoria RAM eliminada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando memoria RAM",
      error: error.message
    });
  }
};

module.exports = {
  obtenerRam,
  crearRAM,
  actualizarRAM,
  eliminarRAM
};