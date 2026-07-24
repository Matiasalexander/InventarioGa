const { poolPromise } = require("../config/db");

const obtenerRestaurantes = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id_marca, Marca, Estado
      FROM Restaurantes
      ORDER BY Marca
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo restaurantes",
      error: error.message
    });
  }
};

const obtenerRestaurantePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", id)
      .query(`
        SELECT id_marca, Marca, Estado
        FROM Restaurantes
        WHERE id_marca = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Restaurante no encontrado"
      });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo restaurante",
      error: error.message
    });
  }
};

const crearRestaurante = async (req, res) => {
  try {
    const { Marca, Estado } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("Marca", Marca)
      .input("Estado", Estado)
      .query(`
        INSERT INTO Restaurantes (Marca, Estado)
        VALUES (@Marca, @Estado)
      `);

    res.status(201).json({
      message: "Restaurante creado correctamente"
    });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({
        message: "Ya existe un restaurante con ese nombre"
      });
    }
    res.status(500).json({
      message: "Ya existe un restaurante con ese nombre",
      error: error.message
    });

  }
};

const actualizarRestaurante = async (req, res) => {
  try {
    const { id } = req.params;
    const { Marca, Estado } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Marca", Marca)
      .input("Estado", Estado)
      .query(`
        UPDATE Restaurantes
        SET
          Marca = @Marca,
          Estado = @Estado
        WHERE id_marca = @id
      `);

    res.json({
      message: "Restaurante actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando restaurante",
      error: error.message
    });
  }
};

const eliminarRestaurante = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM Restaurantes
        WHERE id_marca = @id
      `);

    res.json({
      message: "Restaurante eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando restaurante",
      error: error.message
    });
  }
};

module.exports = {
  obtenerRestaurantes,
  obtenerRestaurantePorId,
  crearRestaurante,
  actualizarRestaurante,
  eliminarRestaurante
};