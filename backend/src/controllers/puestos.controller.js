const { poolPromise } = require("../config/db");

const obtenerPuestos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        p.Id,
        p.Id_departamento,
        d.Nombre_departamento,
        p.Nombre_puesto
      FROM PUESTO p
      LEFT JOIN DEPARTAMENTOS d
        ON p.Id_departamento = d.Id
      ORDER BY d.Nombre_departamento, p.Nombre_puesto
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const crearPuesto = async (req, res) => {
  try {
    const { Id_departamento, Nombre_puesto } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("Id_departamento", Id_departamento)
      .input("Nombre_puesto", Nombre_puesto)
      .query(`
        INSERT INTO PUESTO (
          Id_departamento,
          Nombre_puesto
        )
        VALUES (
          @Id_departamento,
          @Nombre_puesto
        )
      `);

    res.json({
      mensaje: "Puesto creado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const actualizarPuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { Id_departamento, Nombre_puesto } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Id_departamento", Id_departamento)
      .input("Nombre_puesto", Nombre_puesto)
      .query(`
        UPDATE PUESTO
        SET
          Id_departamento = @Id_departamento,
          Nombre_puesto = @Nombre_puesto
        WHERE Id = @id
      `);

    res.json({
      mensaje: "Puesto actualizado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const eliminarPuesto = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM PUESTO
        WHERE Id = @id
      `);

    res.json({
      mensaje: "Puesto eliminado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto
};