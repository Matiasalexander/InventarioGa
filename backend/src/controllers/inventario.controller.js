const { poolPromise } = require("../config/db");

const obtenerInventario = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT TOP 100
        i.id,
        i.ID_UNIDAD,
        r.Marca AS UNIDAD,
        i.LOCALIDAD,
        i.UBICACION,
        i.ID_TIPO_EQUIPO,
        te.tequipo AS TIPO_EQUIPO,
        i.NOMBRE_EQUIPO,
        i.SERIAL,
        i.ID_DEPARTAMENTO,
        d.Nombre_departamento AS DEPARTAMENTO,
        i.ID_PROCESADOR,
        p.Nombre AS PROCESADOR,
        i.ID_MARCA,
        m.Marca AS MARCA,
        i.MODELO,
        i.IP,
        i.ID_ESTATUS,
        e.Estatus_equipo AS ESTATUS,
        i.ESTADO_FISICO,
        i.CORREO
      FROM INVENTARIO_M i
      LEFT JOIN Unidades u ON i.ID_UNIDAD = u.id
      LEFT JOIN Restaurantes r ON u.id_marca = r.id_marca
      LEFT JOIN Tipo_equipo te ON i.ID_TIPO_EQUIPO = te.id
      LEFT JOIN DEPARTAMENTOS d ON i.ID_DEPARTAMENTO = d.Id
      LEFT JOIN PROCESADORES p ON i.ID_PROCESADOR = p.id
      LEFT JOIN Marcas m ON i.ID_MARCA = m.id
      LEFT JOIN Estatus e ON i.ID_ESTATUS = e.Id
      ORDER BY i.id DESC
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
        SELECT
          i.*
        FROM INVENTARIO_M i
        WHERE i.id = @id
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
      ID_UNIDAD,
      LOCALIDAD,
      UBICACION,
      ID_TIPO_EQUIPO,
      NOMBRE_EQUIPO,
      ID_DEPARTAMENTO,
      SERIAL,
      DISCO_DURO,
      RAM,
      ID_PROCESADOR,
      MODELO_PROCESADOR,
      SISTEMA_OPERATIVO,
      TIPO_IMPRESORA,
      CONEXION,
      ID_MARCA,
      MODELO,
      IP,
      PUERTO,
      ID_ESTATUS,
      ESTADO_FISICO,
      CORREO,
      ACCESO_TEAM_VIEWER,
      CONTRASEÑA_TEAM_VIEWER,
      ACCESO_ANYDESK,
      CONTRASEÑA_ANYDESK,
      COMENTARIO
    } = req.body;

    const pool = await poolPromise;
    const serialExiste = await pool
      .request()
      .input('SERIAL', SERIAL)
      .query(
        'SELECT * FROM INVENTARIO_M WHERE SERIAL = @SERIAL'
      );
    if (serialExiste.recordset.length > 0) {
      return res.status(400).json({
        message: "El número de serie ya existe en el inventario"
      });
    }

    await pool.request()
      .input("ID_UNIDAD", ID_UNIDAD || null)
      .input("LOCALIDAD", LOCALIDAD || null)
      .input("UBICACION", UBICACION || null)
      .input("ID_TIPO_EQUIPO", ID_TIPO_EQUIPO || null)
      .input("NOMBRE_EQUIPO", NOMBRE_EQUIPO || null)
      .input("ID_DEPARTAMENTO", ID_DEPARTAMENTO || null)
      .input("SERIAL", SERIAL || null)
      .input("DISCO_DURO", DISCO_DURO || null)
      .input("RAM", RAM || null)
      .input("ID_PROCESADOR", ID_PROCESADOR || null)
      .input("MODELO_PROCESADOR", MODELO_PROCESADOR || null)
      .input("SISTEMA_OPERATIVO", SISTEMA_OPERATIVO || null)
      .input("TIPO_IMPRESORA", TIPO_IMPRESORA || null)
      .input("CONEXION", CONEXION || null)
      .input("ID_MARCA", ID_MARCA || null)
      .input("MODELO", MODELO || null)
      .input("IP", IP || null)
      .input("PUERTO", PUERTO || null)
      .input("ID_ESTATUS", ID_ESTATUS || null)
      .input("ESTADO_FISICO", ESTADO_FISICO || null)
      .input("CORREO", CORREO || null)
      .input("ACCESO_TEAM_VIEWER", ACCESO_TEAM_VIEWER || null)
      .input("CONTRASEÑA_TEAM_VIEWER", CONTRASEÑA_TEAM_VIEWER || null)
      .input("ACCESO_ANYDESK", ACCESO_ANYDESK || null)
      .input("CONTRASEÑA_ANYDESK", CONTRASEÑA_ANYDESK || null)
      .input("COMENTARIO", COMENTARIO || null)
      .query(`
        INSERT INTO INVENTARIO_M (
          ID_UNIDAD,
          LOCALIDAD,
          UBICACION,
          ID_TIPO_EQUIPO,
          NOMBRE_EQUIPO,
          ID_DEPARTAMENTO,
          SERIAL,
          DISCO_DURO,
          RAM,
          ID_PROCESADOR,
          MODELO_PROCESADOR,
          SISTEMA_OPERATIVO,
          TIPO_IMPRESORA,
          CONEXION,
          ID_MARCA,
          MODELO,
          IP,
          PUERTO,
          ID_ESTATUS,
          ESTADO_FISICO,
          CORREO,
          ACCESO_TEAM_VIEWER,
          CONTRASEÑA_TEAM_VIEWER,
          ACCESO_ANYDESK,
          CONTRASEÑA_ANYDESK,
          COMENTARIO
        )
        VALUES (
          @ID_UNIDAD,
          @LOCALIDAD,
          @UBICACION,
          @ID_TIPO_EQUIPO,
          @NOMBRE_EQUIPO,
          @ID_DEPARTAMENTO,
          @SERIAL,
          @DISCO_DURO,
          @RAM,
          @ID_PROCESADOR,
          @MODELO_PROCESADOR,
          @SISTEMA_OPERATIVO,
          @TIPO_IMPRESORA,
          @CONEXION,
          @ID_MARCA,
          @MODELO,
          @IP,
          @PUERTO,
          @ID_ESTATUS,
          @ESTADO_FISICO,
          @CORREO,
          @ACCESO_TEAM_VIEWER,
          @CONTRASEÑA_TEAM_VIEWER,
          @ACCESO_ANYDESK,
          @CONTRASEÑA_ANYDESK,
          @COMENTARIO
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
      ID_UNIDAD,
      LOCALIDAD,
      UBICACION,
      ID_TIPO_EQUIPO,
      NOMBRE_EQUIPO,
      ID_DEPARTAMENTO,
      SERIAL,
      DISCO_DURO,
      RAM,
      ID_PROCESADOR,
      MODELO_PROCESADOR,
      SISTEMA_OPERATIVO,
      TIPO_IMPRESORA,
      CONEXION,
      ID_MARCA,
      MODELO,
      IP,
      PUERTO,
      ID_ESTATUS,
      ESTADO_FISICO,
      CORREO,
      ACCESO_TEAM_VIEWER,
      CONTRASEÑA_TEAM_VIEWER,
      ACCESO_ANYDESK,
      CONTRASEÑA_ANYDESK,
      COMENTARIO
    } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", id)
      .input("ID_UNIDAD", ID_UNIDAD || null)
      .input("LOCALIDAD", LOCALIDAD || null)
      .input("UBICACION", UBICACION || null)
      .input("ID_TIPO_EQUIPO", ID_TIPO_EQUIPO || null)
      .input("NOMBRE_EQUIPO", NOMBRE_EQUIPO || null)
      .input("ID_DEPARTAMENTO", ID_DEPARTAMENTO || null)
      .input("SERIAL", SERIAL || null)
      .input("DISCO_DURO", DISCO_DURO || null)
      .input("RAM", RAM || null)
      .input("ID_PROCESADOR", ID_PROCESADOR || null)
      .input("MODELO_PROCESADOR", MODELO_PROCESADOR || null)
      .input("SISTEMA_OPERATIVO", SISTEMA_OPERATIVO || null)
      .input("TIPO_IMPRESORA", TIPO_IMPRESORA || null)
      .input("CONEXION", CONEXION || null)
      .input("ID_MARCA", ID_MARCA || null)
      .input("MODELO", MODELO || null)
      .input("IP", IP || null)
      .input("PUERTO", PUERTO || null)
      .input("ID_ESTATUS", ID_ESTATUS || null)
      .input("ESTADO_FISICO", ESTADO_FISICO || null)
      .input("CORREO", CORREO || null)
      .input("ACCESO_TEAM_VIEWER", ACCESO_TEAM_VIEWER || null)
      .input("CONTRASEÑA_TEAM_VIEWER", CONTRASEÑA_TEAM_VIEWER || null)
      .input("ACCESO_ANYDESK", ACCESO_ANYDESK || null)
      .input("CONTRASEÑA_ANYDESK", CONTRASEÑA_ANYDESK || null)
      .input("COMENTARIO", COMENTARIO || null)
      .query(`
        UPDATE INVENTARIO_M
        SET
          ID_UNIDAD = @ID_UNIDAD,
          LOCALIDAD = @LOCALIDAD,
          UBICACION = @UBICACION,
          ID_TIPO_EQUIPO = @ID_TIPO_EQUIPO,
          NOMBRE_EQUIPO = @NOMBRE_EQUIPO,
          ID_DEPARTAMENTO = @ID_DEPARTAMENTO,
          SERIAL = @SERIAL,
          DISCO_DURO = @DISCO_DURO,
          RAM = @RAM,
          ID_PROCESADOR = @ID_PROCESADOR,
          MODELO_PROCESADOR = @MODELO_PROCESADOR,
          SISTEMA_OPERATIVO = @SISTEMA_OPERATIVO,
          TIPO_IMPRESORA = @TIPO_IMPRESORA,
          CONEXION = @CONEXION,
          ID_MARCA = @ID_MARCA,
          MODELO = @MODELO,
          IP = @IP,
          PUERTO = @PUERTO,
          ID_ESTATUS = @ID_ESTATUS,
          ESTADO_FISICO = @ESTADO_FISICO,
          CORREO = @CORREO,
          ACCESO_TEAM_VIEWER = @ACCESO_TEAM_VIEWER,
          CONTRASEÑA_TEAM_VIEWER = @CONTRASEÑA_TEAM_VIEWER,
          ACCESO_ANYDESK = @ACCESO_ANYDESK,
          CONTRASEÑA_ANYDESK = @CONTRASEÑA_ANYDESK,
          COMENTARIO = @COMENTARIO
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