const { poolPromise } = require("../config/db");

const obtenerProcesadores = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, Nombre
      FROM PROCESADORES
      ORDER BY Nombre
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo procesadores",
      error: error.message
    });
  }
};

const crearProcesador = async (req, res) => {
  try {
    const { Nombre } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("Nombre", Nombre)
      .query(`
        INSERT INTO PROCESADORES (Nombre)
        VALUES (@Nombre)
      `);

    res.status(201).json({
      message: "Procesador creado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando procesador",
      error: error.message
    });
  }
};

const actualizarProcesador = async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Nombre", Nombre)
      .query(`
        UPDATE PROCESADORES
        SET Nombre = @Nombre
        WHERE id = @id
      `);

    res.json({
      message: "Procesador actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando procesador",
      error: error.message
    });
  }
};

const eliminarProcesador = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM PROCESADORES
        WHERE id = @id
      `);

    res.json({
      message: "Procesador eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando procesador",
      error: error.message
    });
  }
};

module.exports = {
  obtenerProcesadores,
  crearProcesador,
  actualizarProcesador,
  eliminarProcesador
};