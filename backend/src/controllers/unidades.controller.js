const { poolPromise } = require("../config/db");

const obtenerUnidades = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        u.id,
        u.id_marca,
        r.Marca AS Restaurante,
        u.Ubicacion,
        u.Estado
      FROM Unidades u
      LEFT JOIN Restaurantes r ON u.id_marca = r.id_marca
      ORDER BY r.Marca, u.Ubicacion
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo unidades",
      error: error.message
    });
  }
};

const crearUnidad = async (req, res) => {
  try {
    const { id_marca, Ubicacion, Estado } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("id_marca", id_marca || null)
      .input("Ubicacion", Ubicacion)
      .input("Estado", Estado)
      .query(`
        INSERT INTO Unidades (
          id_marca,
          Ubicacion,
          Estado
        )
        VALUES (
          @id_marca,
          @Ubicacion,
          @Estado
        )
      `);

    res.status(201).json({
      message: "Unidad creada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando unidad",
      error: error.message
    });
  }
};

const actualizarUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_marca, Ubicacion, Estado } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("id_marca", id_marca || null)
      .input("Ubicacion", Ubicacion)
      .input("Estado", Estado)
      .query(`
        UPDATE Unidades
        SET
          id_marca = @id_marca,
          Ubicacion = @Ubicacion,
          Estado = @Estado
        WHERE id = @id
      `);

    res.json({
      message: "Unidad actualizada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando unidad",
      error: error.message
    });
  }
};

const eliminarUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM Unidades
        WHERE id = @id
      `);

    res.json({
      message: "Unidad eliminada correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando unidad",
      error: error.message
    });
  }
};

module.exports = {
  obtenerUnidades,
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad
};