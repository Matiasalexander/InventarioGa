const { poolPromise } = require("../config/db");

const obtenerDisco= async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, modelo_disco, capacidad
      FROM DISCO_DURO
      ORDER BY modelo_disco
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo discos duros",
      error: error.message
    });
  }
};

const crearDisco = async (req, res) => {
  try {
    const { modelo_disco, capacidad } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("modelo_disco", modelo_disco)
      .input("capacidad", capacidad)
      .query(`
        INSERT INTO DISCO_DURO (modelo_disco, capacidad)
        VALUES (@modelo_disco, @capacidad)
      `);

    res.status(201).json({
      message: "Disco duro creado exitosamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando disco duro",
      error: error.message
    });
  }
};

const actualizarDisco = async (req, res) => {
  try {
    const { id } = req.params;
    const { modelo_disco, capacidad } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("modelo_disco", modelo_disco)
      .input("capacidad", capacidad)
      .query(`
        UPDATE DISCO_DURO
        SET
          modelo_disco = @modelo_disco,
          capacidad = @capacidad
        WHERE id = @id
      `);

    res.json({
      message: "Disco duro actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando memoria Disco duro",
      error: error.message
    });
  }
};

const eliminarDisco = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM DISCO_DURO
        WHERE id = @id
      `);

    res.json({
      message: "Disco duro eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando memoria disco duro",
      error: error.message
    });
  }
};

module.exports = {
  obtenerDisco,
  crearDisco,
  actualizarDisco,
  eliminarDisco
};