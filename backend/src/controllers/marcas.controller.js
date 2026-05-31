const { poolPromise } = require("../config/db");

const obtenerMarcas = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, Marca
      FROM Marcas
      ORDER BY Marca
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo marcas",
      error: error.message
    });
  }
};

const obtenerMarcaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", id)
      .query(`
        SELECT id, Marca
        FROM Marcas
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Marca no encontrada"
      });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo marca",
      error: error.message
    });
  }
};

const crearMarca = async (req, res) => {
  try {
    const { Marca } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("Marca", Marca)
      .query(`
        INSERT INTO Marcas (Marca)
        VALUES (@Marca)
      `);

    res.status(201).json({
      message: "Marca creada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando marca",
      error: error.message
    });
  }
};

const actualizarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { Marca } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Marca", Marca)
      .query(`
        UPDATE Marcas
        SET Marca = @Marca
        WHERE id = @id
      `);

    res.json({
      message: "Marca actualizada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando marca",
      error: error.message
    });
  }
};

const eliminarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM Marcas
        WHERE id = @id
      `);

    res.json({
      message: "Marca eliminada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando marca",
      error: error.message
    });
  }
};

module.exports = {
  obtenerMarcas,
  obtenerMarcaPorId,
  crearMarca,
  actualizarMarca,
  eliminarMarca
};