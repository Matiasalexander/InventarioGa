//controlador de sistmasoperativos.

const { poolPromise } = require("../config/db");

const obtenerSistemasOperativos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        id,
        Nombre,
        N_Version
      FROM SISTEMAS_OPERATIVOS
      ORDER BY Nombre, N_Version
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo sistemas operativos",
      error: error.message
    });
  }
};

const crearSistemaOperativo = async (req, res) => {
  try {
    const { Nombre, N_Version } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("Nombre", Nombre)
      .input("N_Version", N_Version)
      .query(`
        INSERT INTO SISTEMAS_OPERATIVOS (
          Nombre,
          N_Version
        )
        VALUES (
          @Nombre,
          @N_Version
        )
      `);

    res.status(201).json({
      message: "Sistema operativo creado exitosamente"
    });

  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({
        message: "Ya existe un sistema operativo con esos datos"
      });
    }

    res.status(500).json({
      message: "Error creando sistema operativo",
      error: error.message
    });
  }
};

const actualizarSistemaOperativo = async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre, N_Version } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("Nombre", Nombre)
      .input("N_Version", N_Version)
      .query(`
        UPDATE SISTEMAS_OPERATIVOS
        SET
          Nombre = @Nombre,
          N_Version = @N_Version
        WHERE id = @id
      `);

    res.json({
      message: "Sistema operativo actualizado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error actualizando sistema operativo",
      error: error.message
    });
  }
};

const eliminarSistemaOperativo = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM SISTEMAS_OPERATIVOS
        WHERE id = @id
      `);

    res.json({
      message: "Sistema operativo eliminado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error eliminando sistema operativo",
      error: error.message
    });
  }
};

module.exports = {
  obtenerSistemasOperativos,
  crearSistemaOperativo,
  actualizarSistemaOperativo,
  eliminarSistemaOperativo
};