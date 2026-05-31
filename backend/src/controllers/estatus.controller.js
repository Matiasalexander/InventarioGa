const { poolPromise } = require("../config/db");

const obtenerEstatus = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT Id, Estatus_equipo
      FROM Estatus
      ORDER BY Estatus_equipo
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo estatus",
      error: error.message
    });
  }
};

const crearEstatus = async (req, res) => {
  try {
    const { Estatus_equipo } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("Estatus_equipo", Estatus_equipo)
      .query(`
        INSERT INTO Estatus (Estatus_equipo)
        VALUES (@Estatus_equipo)
      `);

    res.status(201).json({
      message: "Estatus creado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando estatus",
      error: error.message
    });
  }
};

const actualizarEstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { Estatus_equipo } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Estatus_equipo", Estatus_equipo)
      .query(`
        UPDATE Estatus
        SET Estatus_equipo = @Estatus_equipo
        WHERE Id = @id
      `);

    res.json({
      message: "Estatus actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando estatus",
      error: error.message
    });
  }
};

const eliminarEstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM Estatus
        WHERE Id = @id
      `);

    res.json({
      message: "Estatus eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando estatus",
      error: error.message
    });
  }
};

module.exports = {
  obtenerEstatus,
  crearEstatus,
  actualizarEstatus,
  eliminarEstatus
};