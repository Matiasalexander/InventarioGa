const { poolPromise } = require("../config/db");

const obtenerInventario = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT TOP 100
        id, -- AQUÍ ESTABA MAL: tenías @id
        UNIDAD,
        LOCALIDAD,
        UBICACION,
        TIPO_EQUIPO,
        NOMBRE_EQUIPO,
        SERIAL,
        MARCA,
        MODELO,
        IP,
        ESTATUS,
        ESTADO_FISICO,
        CORREO
      FROM INVENTARIO_M
      ORDER BY UNIDAD, TIPO_EQUIPO
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo inventario",
      error: error.message
    });
  }
};

const obtenerInventarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", id)
      .query(`
        SELECT *
        FROM INVENTARIO_M
        WHERE id = @id -- AQUÍ ESTABA MAL: tenías WHERE @id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Equipo no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo equipo",
      error: error.message
    });
  }
};

const crearInventario = async (req, res) => {
  try {
    const {
      UNIDAD,
      LOCALIDAD,
      UBICACION,
      TIPO_EQUIPO,
      NOMBRE_EQUIPO,
      SERIAL,
      MARCA,
      MODELO,
      IP,
      ESTATUS,
      ESTADO_FISICO,
      CORREO
    } = req.body;

    const pool = await poolPromise;

    await pool.request()
      // AQUÍ YA NO VA .input("id", id) porque id es IDENTITY
      .input("UNIDAD", UNIDAD)
      .input("LOCALIDAD", LOCALIDAD)
      .input("UBICACION", UBICACION)
      .input("TIPO_EQUIPO", TIPO_EQUIPO)
      .input("NOMBRE_EQUIPO", NOMBRE_EQUIPO)
      .input("SERIAL", SERIAL)
      .input("MARCA", MARCA)
      .input("MODELO", MODELO)
      .input("IP", IP)
      .input("ESTATUS", ESTATUS)
      .input("ESTADO_FISICO", ESTADO_FISICO)
      .input("CORREO", CORREO)
      .query(`
        INSERT INTO INVENTARIO_M (
          -- AQUÍ ESTABA MAL: tenías @id en la lista de columnas
          UNIDAD,
          LOCALIDAD,
          UBICACION,
          TIPO_EQUIPO,
          NOMBRE_EQUIPO,
          SERIAL,
          MARCA,
          MODELO,
          IP,
          ESTATUS,
          ESTADO_FISICO,
          CORREO
        )
        VALUES (
          -- AQUÍ ESTABA MAL: tenías @id en VALUES
          @UNIDAD,
          @LOCALIDAD,
          @UBICACION,
          @TIPO_EQUIPO,
          @NOMBRE_EQUIPO,
          @SERIAL,
          @MARCA,
          @MODELO,
          @IP,
          @ESTATUS,
          @ESTADO_FISICO,
          @CORREO
        )
      `);

    res.status(201).json({
      message: "Equipo agregado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando inventario",
      error: error.message
    });
  }
};

const actualizarInventario = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      UNIDAD,
      LOCALIDAD,
      UBICACION,
      TIPO_EQUIPO,
      NOMBRE_EQUIPO,
      SERIAL,
      MARCA,
      MODELO,
      IP,
      ESTATUS,
      ESTADO_FISICO,
      CORREO
    } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("UNIDAD", UNIDAD)
      .input("LOCALIDAD", LOCALIDAD)
      .input("UBICACION", UBICACION)
      .input("TIPO_EQUIPO", TIPO_EQUIPO)
      .input("NOMBRE_EQUIPO", NOMBRE_EQUIPO)
      .input("SERIAL", SERIAL)
      .input("MARCA", MARCA)
      .input("MODELO", MODELO)
      .input("IP", IP)
      .input("ESTATUS", ESTATUS)
      .input("ESTADO_FISICO", ESTADO_FISICO)
      .input("CORREO", CORREO)
      .query(`
        UPDATE INVENTARIO_M
        SET
          UNIDAD = @UNIDAD,
          LOCALIDAD = @LOCALIDAD,
          UBICACION = @UBICACION,
          TIPO_EQUIPO = @TIPO_EQUIPO,
          NOMBRE_EQUIPO = @NOMBRE_EQUIPO,
          SERIAL = @SERIAL,
          MARCA = @MARCA,
          MODELO = @MODELO,
          IP = @IP,
          ESTATUS = @ESTATUS,
          ESTADO_FISICO = @ESTADO_FISICO,
          CORREO = @CORREO
        WHERE id = @id
      `);

    res.json({
      message: "Equipo actualizado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando inventario",
      error: error.message
    });
  }
};

const eliminarInventario = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM INVENTARIO_M
        WHERE id = @id
      `);

    res.json({
      message: "Equipo eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando inventario",
      error: error.message
    });
  }
};

module.exports = {
  obtenerInventario,
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario
};