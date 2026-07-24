const { poolPromise } = require("../config/db");
const generarNombreEquipo = require("../helpers/generarNombreEquipo");
const sql = require("mssql");
// NUEVO: Servicio de exportación a Excel
const {
  generarInventarioExcel,
} = require("../services/excel/inventarioExcel.service");
const normalizarTexto = (valor) => {
  return (valor || "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

const formatearDiasComoAniosYDias = (diasTotales) => {
  const años = Math.floor(diasTotales / 365);
  const dias = diasTotales % 365;

  if (años === 0) {
    return `${dias} ${dias === 1 ? "día" : "días"}`;
  }

  return `${años} ${años === 1 ? "año" : "años"} y ${dias} ${
    dias === 1 ? "día" : "días"
  }`;
};

const formatearTiempoUso = (fechaFabricacion) => {
  if (!fechaFabricacion) return "";

  const inicio = new Date(fechaFabricacion);
  const hoy = new Date();

  if (isNaN(inicio.getTime())) return "";

  const diferenciaMs = hoy - inicio;
  const diasTotales = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  if (diasTotales < 0) return "0 días";

  return formatearDiasComoAniosYDias(diasTotales);
};

const formatearGarantiaRestante = (fechaGarantia) => {
  if (!fechaGarantia) return "";

  const fin = new Date(fechaGarantia);
  const hoy = new Date();

  if (isNaN(fin.getTime())) return "";

  const diferenciaMs = fin - hoy;
  const diasTotales = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  if (diasTotales < 0) return "Garantía vencida";

  return formatearDiasComoAniosYDias(diasTotales);
};

const aplicarCalculosInventario = (item) => {
  return {
    ...item,
    Auso: formatearTiempoUso(item.FECHA_FABRICACION),
    Grestante: formatearGarantiaRestante(item.FECHA_GARANTIA)
  };
};

const debeGenerarNombreEquipo = async (
  pool,
  ID_UNIDAD,
  LOCALIDAD,
  ID_TIPO_EQUIPO
) => {
  if (!ID_UNIDAD || !ID_TIPO_EQUIPO) return false;

  const tipoEquipoPermitido =
    Number(ID_TIPO_EQUIPO) === 1 || Number(ID_TIPO_EQUIPO) === 2;

  if (!tipoEquipoPermitido) return false;

  const result = await pool.request()
    .input("ID_UNIDAD", ID_UNIDAD)
    .query(`
      SELECT r.Marca AS UNIDAD
      FROM Unidades u
      LEFT JOIN Restaurantes r ON u.id_marca = r.id_marca
      WHERE u.id = @ID_UNIDAD
    `);

  const unidad = normalizarTexto(result.recordset[0]?.UNIDAD);
  const localidad = normalizarTexto(LOCALIDAD);

  return unidad === "CORPORATIVO" && localidad === "CANCUN";
};

const obtenerInventario = async (req, res) => {
  try {
    const pool = await poolPromise;

    // NUEVO: recibimos el filtro desde la URL
    // Ejemplo: /api/inventario?unidad=19
    const { unidad } = req.query;

    const request = pool.request();

    let where = "";

    // NUEVO: si viene unidad, agregamos filtro seguro con parámetro SQL
    if (unidad) {
      request.input("unidad", sql.Int, Number(unidad));
      where = "WHERE i.ID_UNIDAD = @unidad";
    }

    const result = await request.query(`
      SELECT TOP 100
        i.id,
        i.ID_UNIDAD,
        r.Marca AS UNIDAD,
        i.LOCALIDAD,
        i.UBICACION,
        i.ID_TIPO_EQUIPO,
        te.tequipo AS TIPO_EQUIPO,
        i.TIPO_IMPRESORA,
        i.NOMBRE_EQUIPO,
        i.ID_DEPARTAMENTO,
        d.Nombre_departamento AS DEPARTAMENTO,
        i.PUESTO,
        i.SERIAL,
        i.FECHA_FABRICACION,
        i.FECHA_GARANTIA,
        i.FECHA_INICIO,
        i.Grestante,
        i.Auso,
        i.FECHA_REGISTRO,
        i.ID_DISCO,
        i.ID_RAM,
        i.ID_PROCESADOR,
        p.Nombre AS PROCESADOR,
        i.MODELO_PROCESADOR,
        i.SISTEMA_OPERATIVO,
        i.LECTOR_DE_HUELLA,
        i.CONEXION,
        i.ID_MARCA,
        m.Marca AS MARCA,
        i.MODELO,
        i.IP,
        i.PUERTO,
        i.ID_ESTATUS,
        e.Estatus_equipo AS ESTATUS,
        i.ESTADO_FISICO,
        i.CORREO,
        i.COMENTARIO
      FROM INVENTARIO_M i
      LEFT JOIN Unidades u ON i.ID_UNIDAD = u.id
      LEFT JOIN Restaurantes r ON u.id_marca = r.id_marca
      LEFT JOIN Tipo_equipo te ON i.ID_TIPO_EQUIPO = te.id
      LEFT JOIN DEPARTAMENTOS d ON i.ID_DEPARTAMENTO = d.Id
      LEFT JOIN PROCESADORES p ON i.ID_PROCESADOR = p.id
      LEFT JOIN MEMORIA_RAM mr ON i.ID_RAM = mr.id
      LEFT JOIN DISCO_DURO dd on i.ID_DISCO = dd.id
      LEFT JOIN Marcas m ON i.ID_MARCA = m.id
      LEFT JOIN Estatus e ON i.ID_ESTATUS = e.Id
      ${where}
      ORDER BY i.id DESC
    `);

    const inventario = result.recordset.map(aplicarCalculosInventario);

    res.json(inventario);
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
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Equipo no encontrado"
      });
    }

    const equipo = aplicarCalculosInventario(result.recordset[0]);

    // Convertir la imagen a Base64
    if (equipo.FOTO) {
      equipo.FOTO = equipo.FOTO.toString("base64");
    }

    return res.json(equipo);

  } catch (error) {
    return res.status(500).json({
      message: "Error obteniendo equipo",
      error: error.message
    });
  }
};

const crearInventario = async (req, res) => {
    const FOTO = req.file ? req.file.buffer : null;  
  try {
        const Correo = req.usuario.Correo;

    const {
      ID_UNIDAD,
      LOCALIDAD,
      UBICACION,
      ID_TIPO_EQUIPO,
      TIPO_IMPRESORA,
      ID_DEPARTAMENTO,
      PUESTO,
      SERIAL,
      FECHA_FABRICACION,
      FECHA_GARANTIA,
      FECHA_INICIO,
      ID_DISCO,
      ID_RAM,
      ID_PROCESADOR,
      MODELO_PROCESADOR,
      SISTEMA_OPERATIVO,
      LECTOR_DE_HUELLA,
      CONEXION,
      ID_MARCA,
      MODELO,
      IP,
      PUERTO,
      ID_ESTATUS,
      ESTADO_FISICO,
      ACCESO_TEAM_VIEWER,
      CONTRASEÑA_TEAM_VIEWER,
      ACCESO_ANYDESK,
      CONTRASEÑA_ANYDESK,
      COMENTARIO
    } = req.body;

    const pool = await poolPromise;

    if (SERIAL) {
      const serialExiste = await pool.request()
        .input("SERIAL", SERIAL)
        .query(`
          SELECT id
          FROM INVENTARIO_M
          WHERE SERIAL = @SERIAL
        `);

      if (serialExiste.recordset.length > 0) {
        return res.status(400).json({
          message: "El número de serie ya existe en el inventario"
        });
      }
    }


    const insertResult = await pool.request()
      .input("ID_UNIDAD", ID_UNIDAD || null)
      .input("LOCALIDAD", LOCALIDAD || null)
      .input("UBICACION", UBICACION || null)
      .input("ID_TIPO_EQUIPO", ID_TIPO_EQUIPO || null)
      .input("TIPO_IMPRESORA", TIPO_IMPRESORA || null)
      .input("NOMBRE_EQUIPO", "NA")
      .input("ID_DEPARTAMENTO", ID_DEPARTAMENTO || null)
      .input("PUESTO", PUESTO || null)
      .input("SERIAL", SERIAL || null)
      .input("FECHA_FABRICACION", FECHA_FABRICACION || null)
      .input("FECHA_GARANTIA", FECHA_GARANTIA || null)
      .input("FECHA_INICIO", FECHA_INICIO || null)
      .input("ID_DISCO", ID_DISCO || null)
      .input("ID_RAM", ID_RAM || null)
      .input("ID_PROCESADOR", ID_PROCESADOR || null)
      .input("MODELO_PROCESADOR", MODELO_PROCESADOR || null)
      .input("SISTEMA_OPERATIVO", SISTEMA_OPERATIVO || null)
      .input("LECTOR_DE_HUELLA", LECTOR_DE_HUELLA || null)
      .input("CONEXION", CONEXION || null)
      .input("ID_MARCA", ID_MARCA || null)
      .input("MODELO", MODELO || null)
      .input("IP", IP || null)
      .input("PUERTO", PUERTO || null)
      .input("ID_ESTATUS", ID_ESTATUS || null)
      .input("ESTADO_FISICO", ESTADO_FISICO || null)
      .input("CORREO", Correo)
      .input("ACCESO_TEAM_VIEWER", ACCESO_TEAM_VIEWER || null)
      .input("CONTRASEÑA_TEAM_VIEWER", CONTRASEÑA_TEAM_VIEWER || null)
      .input("ACCESO_ANYDESK", ACCESO_ANYDESK || null)
      .input("CONTRASEÑA_ANYDESK", CONTRASEÑA_ANYDESK || null)
      .input("FOTO", sql.VarBinary(sql.MAX), FOTO)
      .input("COMENTARIO", COMENTARIO || null)
      .query(`
        INSERT INTO INVENTARIO_M (
          ID_UNIDAD,
          LOCALIDAD,
          UBICACION,
          ID_TIPO_EQUIPO,
          TIPO_IMPRESORA,
          NOMBRE_EQUIPO,
          ID_DEPARTAMENTO,
          PUESTO,
          SERIAL,
          FECHA_FABRICACION,
          FECHA_GARANTIA,
          FECHA_INICIO,
          ID_DISCO,
          ID_RAM,
          ID_PROCESADOR,
          MODELO_PROCESADOR,
          SISTEMA_OPERATIVO,
          LECTOR_DE_HUELLA,
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
          FOTO,
          COMENTARIO
        ) OUTPUT INSERTED.id
        VALUES (
          @ID_UNIDAD,
          @LOCALIDAD,
          @UBICACION,
          @ID_TIPO_EQUIPO,
          @TIPO_IMPRESORA,
          @NOMBRE_EQUIPO,
          @ID_DEPARTAMENTO,
          @PUESTO,
          @SERIAL,
          @FECHA_FABRICACION,
          @FECHA_GARANTIA,
          @FECHA_INICIO,
          @ID_DISCO,
          @ID_RAM,
          @ID_PROCESADOR,
          @MODELO_PROCESADOR,
          @SISTEMA_OPERATIVO,
          @LECTOR_DE_HUELLA,
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
          @FOTO,
          @COMENTARIO
        )
      `);

      const idGenerado = insertResult.recordset[0].id;
let NOMBRE_EQUIPO = "NA";
const aplicaNombre = await debeGenerarNombreEquipo(pool, ID_UNIDAD, LOCALIDAD, ID_TIPO_EQUIPO);
if (aplicaNombre) {
  NOMBRE_EQUIPO = await generarNombreEquipo(
    pool,
    ID_TIPO_EQUIPO,
    SISTEMA_OPERATIVO,
    FECHA_FABRICACION
  );

  await pool.request()
    .input("id", idGenerado)
    .input("NOMBRE_EQUIPO", NOMBRE_EQUIPO)
    .query(`
      UPDATE INVENTARIO_M
      SET NOMBRE_EQUIPO = @NOMBRE_EQUIPO
      WHERE id = @id
    `);
}
    res.status(201).json({
      message: "Equipo agregado correctamente",
      NOMBRE_EQUIPO,
      Auso: formatearTiempoUso(FECHA_FABRICACION),
      Grestante: formatearGarantiaRestante(FECHA_GARANTIA)
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
    const Correo = req.usuario.Correo;

    const FOTO = req.file ? req.file.buffer : null;
    const { id } = req.params;

    const {
      ID_UNIDAD,
      LOCALIDAD,
      UBICACION,
      ID_TIPO_EQUIPO,
      TIPO_IMPRESORA,
      ID_DEPARTAMENTO,
      PUESTO,
      SERIAL,
      FECHA_FABRICACION,
      FECHA_GARANTIA,
      FECHA_INICIO,
      ID_DISCO,
      ID_RAM,
      ID_PROCESADOR,
      MODELO_PROCESADOR,
      SISTEMA_OPERATIVO,
      LECTOR_DE_HUELLA,
      CONEXION,
      ID_MARCA,
      MODELO,
      IP,
      PUERTO,
      ID_ESTATUS,
      ESTADO_FISICO,
      ACCESO_TEAM_VIEWER,
      CONTRASEÑA_TEAM_VIEWER,
      ACCESO_ANYDESK,
      CONTRASEÑA_ANYDESK,
      COMENTARIO
    } = req.body;

    const pool = await poolPromise;

    const equipoActual = await pool.request()
      .input("id", id)
      .query(`
        SELECT NOMBRE_EQUIPO
        FROM INVENTARIO_M
        WHERE id = @id
      `);

    if (equipoActual.recordset.length === 0) {
      return res.status(404).json({ message: "Equipo no encontrado" });
    }

    let NOMBRE_EQUIPO = equipoActual.recordset[0].NOMBRE_EQUIPO || "NA";

    const aplicaNombre = await debeGenerarNombreEquipo(
      pool,
      ID_UNIDAD,
      LOCALIDAD,
      ID_TIPO_EQUIPO
    );

    if (!aplicaNombre) {
      NOMBRE_EQUIPO = "NA";
    }

    await pool.request()
      .input("id", id)
      .input("ID_UNIDAD", ID_UNIDAD || null)
      .input("LOCALIDAD", LOCALIDAD || null)
      .input("UBICACION", UBICACION || null)
      .input("ID_TIPO_EQUIPO", ID_TIPO_EQUIPO || null)
      .input("TIPO_IMPRESORA", TIPO_IMPRESORA || null)
      .input("NOMBRE_EQUIPO", NOMBRE_EQUIPO)
      .input("ID_DEPARTAMENTO", ID_DEPARTAMENTO || null)
      .input("PUESTO", PUESTO || null)
      .input("SERIAL", SERIAL || null)
      .input("FECHA_FABRICACION", FECHA_FABRICACION || null)
      .input("FECHA_GARANTIA", FECHA_GARANTIA || null)
      .input("FECHA_INICIO", FECHA_INICIO || null)
      .input("ID_DISCO", ID_DISCO || null)
      .input("ID_RAM", ID_RAM || null)
      .input("ID_PROCESADOR", ID_PROCESADOR || null)
      .input("MODELO_PROCESADOR", MODELO_PROCESADOR || null)
      .input("SISTEMA_OPERATIVO", SISTEMA_OPERATIVO || null)
      .input("LECTOR_DE_HUELLA", LECTOR_DE_HUELLA || null)
      .input("CONEXION", CONEXION || null)
      .input("ID_MARCA", ID_MARCA || null)
      .input("MODELO", MODELO || null)
      .input("IP", IP || null)
      .input("PUERTO", PUERTO || null)
      .input("ID_ESTATUS", ID_ESTATUS || null)
      .input("ESTADO_FISICO", ESTADO_FISICO || null)
      .input("CORREO", Correo)
      .input("ACCESO_TEAM_VIEWER", ACCESO_TEAM_VIEWER || null)
      .input("CONTRASEÑA_TEAM_VIEWER", CONTRASEÑA_TEAM_VIEWER || null)
      .input("ACCESO_ANYDESK", ACCESO_ANYDESK || null)
      .input("CONTRASEÑA_ANYDESK", CONTRASEÑA_ANYDESK || null)
      .input("FOTO", sql.VarBinary(sql.MAX), FOTO)
      .input("COMENTARIO", COMENTARIO || null)
      .query(`
        UPDATE INVENTARIO_M
        SET
          ID_UNIDAD = @ID_UNIDAD,
          LOCALIDAD = @LOCALIDAD,
          UBICACION = @UBICACION,
          ID_TIPO_EQUIPO = @ID_TIPO_EQUIPO,
          TIPO_IMPRESORA = @TIPO_IMPRESORA,
          NOMBRE_EQUIPO = @NOMBRE_EQUIPO,
          ID_DEPARTAMENTO = @ID_DEPARTAMENTO,
          PUESTO = @PUESTO,
          SERIAL = @SERIAL,
          FECHA_FABRICACION = @FECHA_FABRICACION,
          FECHA_GARANTIA = @FECHA_GARANTIA,
          FECHA_INICIO = @FECHA_INICIO,
          ID_DISCO = @ID_DISCO,
          ID_RAM = @ID_RAM,
          ID_PROCESADOR = @ID_PROCESADOR,
          MODELO_PROCESADOR = @MODELO_PROCESADOR,
          SISTEMA_OPERATIVO = @SISTEMA_OPERATIVO,
          LECTOR_DE_HUELLA = @LECTOR_DE_HUELLA,
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
          FOTO = @FOTO,
          COMENTARIO = @COMENTARIO
        WHERE id = @id
      `);

    res.json({
      message: "Equipo actualizado correctamente",
      NOMBRE_EQUIPO,
      Auso: formatearTiempoUso(FECHA_FABRICACION),
      Grestante: formatearGarantiaRestante(FECHA_GARANTIA)
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

const obtenerArbolUnidades = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        r.id_marca,
        r.Marca,
        u.id AS idUnidad,
        u.Ubicacion,
        COUNT(i.id) AS total
      FROM Unidades u
      INNER JOIN Restaurantes r
        ON u.id_marca = r.id_marca
      LEFT JOIN INVENTARIO_M i
        ON i.ID_UNIDAD = u.id
      GROUP BY
        r.id_marca,
        r.Marca,
        u.id,
        u.Ubicacion
      ORDER BY
        r.Marca,
        u.Ubicacion
    `);

    const arbol = [];

    result.recordset.forEach((item) => {
      let restaurante = arbol.find((x) => x.id === item.id_marca);

      if (!restaurante) {
        restaurante = {
          id: item.id_marca,
          nombre: item.Marca,
          total: 0,
          children: []
        };

        arbol.push(restaurante);
      }

      restaurante.total += item.total;

      restaurante.children.push({
        id: item.idUnidad,
        nombre: item.Ubicacion,
        total: item.total
      });
    });

    res.json(arbol);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error obteniendo árbol de unidades.",
      error: error.message
    });
  }
};

const exportarInventarioExcel = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { unidad } = req.query;

    const request = pool.request();
    let where = "";

    // NUEVO:
    // Si llega una unidad, exporta únicamente esa unidad.
    // Si no llega, exporta todo el inventario.
    if (unidad) {
      const idUnidad = Number(unidad);

      if (!Number.isInteger(idUnidad) || idUnidad <= 0) {
        return res.status(400).json({
          message: "La unidad enviada no es válida"
        });
      }

      request.input("unidad", sql.Int, idUnidad);
      where = "WHERE i.ID_UNIDAD = @unidad";
    }

    // CAMBIO:
    // Esta consulta ahora incluye toda la información técnica del equipo,
    // no solamente las columnas visibles en la tabla del frontend.
    const result = await request.query(`
      SELECT
        i.id,

        i.ID_UNIDAD,
        r.Marca AS UNIDAD,
        i.LOCALIDAD,
        i.UBICACION,

        i.ID_DEPARTAMENTO,
        d.Nombre_departamento AS DEPARTAMENTO,
        i.PUESTO,

        i.ID_TIPO_EQUIPO,
        te.tequipo AS TIPO_EQUIPO,
        i.TIPO_IMPRESORA,
        i.NOMBRE_EQUIPO,

        i.SERIAL,

        i.FECHA_FABRICACION,
        i.FECHA_GARANTIA,
        i.FECHA_INICIO,
        i.FECHA_REGISTRO,

        i.ID_DISCO,
        CONCAT(dd.modelo_disco, ' ', dd.capacidad) AS DISCO_DURO,
        i.ID_RAM,
        mr.capacidad AS MEMORIA_RAM,

        i.ID_PROCESADOR,
        p.Nombre AS PROCESADOR,
        i.MODELO_PROCESADOR,

        i.SISTEMA_OPERATIVO,
        i.LECTOR_DE_HUELLA,
        i.CONEXION,

        i.ID_MARCA,
        m.Marca AS MARCA,
        i.MODELO,

        i.IP,
        i.PUERTO,

        i.ID_ESTATUS,
        e.Estatus_equipo AS ESTATUS,
        i.ESTADO_FISICO,

        i.CORREO,

        i.ACCESO_TEAM_VIEWER,
        i.CONTRASEÑA_TEAM_VIEWER,
        i.ACCESO_ANYDESK,
        i.CONTRASEÑA_ANYDESK,
        i.FOTO,

        i.COMENTARIO

      FROM INVENTARIO_M i

      LEFT JOIN Unidades u
        ON i.ID_UNIDAD = u.id

      LEFT JOIN Restaurantes r
        ON u.id_marca = r.id_marca

      LEFT JOIN Tipo_equipo te
        ON i.ID_TIPO_EQUIPO = te.id

      LEFT JOIN DEPARTAMENTOS d
        ON i.ID_DEPARTAMENTO = d.Id

      LEFT JOIN PROCESADORES p
        ON i.ID_PROCESADOR = p.id

      LEFT JOIN MEMORIA_RAM mr
        ON i.ID_RAM = mr.id

      LEFT JOIN DISCO_DURO dd
        ON i.ID_DISCO = dd.id

      LEFT JOIN Marcas m
        ON i.ID_MARCA = m.id

      LEFT JOIN Estatus e
        ON i.ID_ESTATUS = e.Id

      ${where}

      ORDER BY
        r.Marca,
        i.LOCALIDAD,
        i.NOMBRE_EQUIPO,
        i.id
    `);

    // NUEVO:
    // Calcula tiempo de uso y garantía restante antes de crear el Excel.
    const inventario = result.recordset.map(aplicarCalculosInventario);

    const excel = await generarInventarioExcel(inventario);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="InventarioGA.xlsx"'
    );

    return res.send(excel);
  } catch (error) {
    console.error("Error exportando inventario a Excel:", error);

    return res.status(500).json({
      message: "Error exportando Excel",
      error: error.message
    });
  }
};
module.exports = {
  obtenerInventario,
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario,
  obtenerArbolUnidades,
  exportarInventarioExcel,
 
};