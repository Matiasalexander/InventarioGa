const { poolPromise } = require("../config/db");

const obtenerRam = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, modelo_ram, capacidad
      FROM MEMORIA_RAM
      ORDER BY modelo_ram
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
    const { modelo_ram, capacidad } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("modelo_ram", modelo_ram)
      .input("capacidad", capacidad)
      .query(`
        INSERT INTO MEMORIA_RAM (modelo_ram, capacidad)
        VALUES (@modelo_ram, @capacidad)
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
    const { modelo_ram, capacidad } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("modelo_ram", modelo_ram)
      .input("capacidad", capacidad)
      .query(`
        UPDATE MEMORIA_RAM
        SET
          modelo_ram = @modelo_ram,
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