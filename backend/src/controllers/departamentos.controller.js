const { poolPromise } = require("../config/db");

const obtenerDepartamentos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT Id, Nombre_departamento
      FROM DEPARTAMENTOS
      ORDER BY Nombre_departamento
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo departamentos",
      error: error.message
    });
  }
};

const crearDepartamento = async (req, res) => {
  try {
    const { Nombre_departamento } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("Nombre_departamento", Nombre_departamento)
      .query(`
        INSERT INTO DEPARTAMENTOS (Nombre_departamento)
        VALUES (@Nombre_departamento)
      `);

    res.status(201).json({
      message: "Departamento creado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando departamento",
      error: error.message
    });
  }
};

const actualizarDepartamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre_departamento } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Nombre_departamento", Nombre_departamento)
      .query(`
        UPDATE DEPARTAMENTOS
        SET Nombre_departamento = @Nombre_departamento
        WHERE Id = @id
      `);

    res.json({
      message: "Departamento actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando departamento",
      error: error.message
    });
  }
};

const eliminarDepartamento = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM DEPARTAMENTOS
        WHERE Id = @id
      `);

    res.json({
      message: "Departamento eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando departamento",
      error: error.message
    });
  }
};

module.exports = {
  obtenerDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento
};