const { poolPromise } = require("../config/db");

const obtenerModelosProcesador = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        mp.Id,
        mp.Id_procesador,
        p.Nombre,
        mp.Modelo
      FROM MODELOS_PROCESADOR mp
      LEFT JOIN PROCESADORES p
        ON mp.Id_procesador = p.id
      ORDER BY p.Nombre, mp.Modelo
    `);

    res.json(result.recordset);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const crearModeloProcesador = async (req, res) => {
  try {
    const { Id_procesador, Modelo } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("Id_procesador", Id_procesador)
      .input("Modelo", Modelo)
      .query(`
        INSERT INTO MODELOS_PROCESADOR (
          Id_procesador,
          Modelo
        )
        VALUES (
          @Id_procesador,
          @Modelo
        )
      `);

    res.json({
      mensaje: "Modelo procesador creado correctamente"
    });

 } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({
        message: "Ya existe un modelo con ese nombre"
      });
    }
    res.status(500).json({
      message: "Ya existe un modelo con ese nombre",
      error: error.message
    });

  }
};

const actualizarModeloProcesador = async (req, res) => {
  try {
    const { id } = req.params;
    const { Id_procesador, Modelo } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Id_procesador", Id_procesador)
      .input("Modelo", Modelo)
      .query(`
        UPDATE MODELOS_PROCESADOR
        SET
          Id_procesador = @Id_procesador,
          Modelo = @Modelo
        WHERE Id = @id
      `);

    res.json({
      mensaje: "Modelo procesador actualizado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const eliminarModeloProcesador = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM MODELOS_PROCESADOR
        WHERE Id = @id
      `);

    res.json({
      mensaje: "Modelo procesador eliminado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  obtenerModelosProcesador,
  crearModeloProcesador,
  actualizarModeloProcesador,
  eliminarModeloProcesador
};