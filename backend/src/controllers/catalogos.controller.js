const { poolPromise } = require("../config/db");

const obtenerCatalogos = async (req, res) => {
  try {
    const pool = await poolPromise;

   const unidades = await pool.request().query(`
  SELECT 
    u.id,
    u.id_marca,
    r.Marca AS unidad,
    u.Ubicacion AS localidad,
    u.Estado
  FROM Unidades u
  INNER JOIN Restaurantes r ON u.id_marca = r.id_marca
  ORDER BY r.Marca, u.Ubicacion
`);

// CAMBIO: usamos tabla Restaurantes, no Restaurantesck
const restaurantes = await pool.request().query(`
  SELECT
    id_marca AS Id,
    Marca AS Restaurante,
    Estado
  FROM Restaurantes
  ORDER BY Marca
`);
    const tiposEquipo = await pool.request().query(`
      SELECT 
        id,
        tequipo
      FROM Tipo_equipo
      ORDER BY tequipo
    `);

    const marcas = await pool.request().query(`
      SELECT 
        id,
        Marca
      FROM Marcas
      ORDER BY Marca
    `);

    const modelos = await pool.request().query(`
      SELECT 
        mo.id,
        mo.id_tequipo,
        te.tequipo,
        mo.id_marca,
        ma.Marca,
        mo.id_modelos,
        me.Mod_esp AS Modelo
      FROM Modelos mo
      LEFT JOIN Tipo_equipo te ON mo.id_tequipo = te.id
      LEFT JOIN Marcas ma ON mo.id_marca = ma.id
      LEFT JOIN modesp me ON mo.id_modelos = me.id
      ORDER BY ma.Marca, me.Mod_esp
    `);

    const estatus = await pool.request().query(`
      SELECT 
        Id,
        Estatus_equipo
      FROM Estatus
      ORDER BY Estatus_equipo
    `);

    const departamentos = await pool.request().query(`
      SELECT 
        Id,
        Nombre_departamento
      FROM DEPARTAMENTOS
      ORDER BY Nombre_departamento
    `);

    const puestos = await pool.request().query(`
      SELECT 
        Id,
        Id_departamento,
        Nombre_puesto
      FROM PUESTO
      ORDER BY Nombre_puesto
    `);

    const procesadores = await pool.request().query(`
      SELECT 
        id,
        Nombre
      FROM PROCESADORES
      ORDER BY Nombre
    `);

    const modelosProcesador = await pool.request().query(`
      SELECT
        mp.Id,
        mp.Id_procesador,
        p.Nombre AS Procesador,
        mp.Modelo
      FROM Modelos_procesador mp
      LEFT JOIN PROCESADORES p ON mp.Id_procesador = p.id
      ORDER BY p.Nombre, mp.Modelo
    `);
    const modelosEspeciales = await pool.request().query(`
  SELECT id, Mod_esp
  FROM modesp
  ORDER BY Mod_esp
`);

const roles = await pool.request().query(`
  SELECT
    ID_ROL AS IdRol,
    NOMBRE AS Rol
  FROM Roles
  WHERE ACTIVO = 1
  ORDER BY NOMBRE
`);

    res.json({
      unidades: unidades.recordset,
      restaurantes: restaurantes.recordset,
      tiposEquipo: tiposEquipo.recordset,
      marcas: marcas.recordset,
      modelos: modelos.recordset,
      estatus: estatus.recordset,
      departamentos: departamentos.recordset,
      puestos: puestos.recordset,
      procesadores: procesadores.recordset,
      modelosProcesador: modelosProcesador.recordset,
     modelosEspeciales: modelosEspeciales.recordset,
roles: roles.recordset
    });

  } catch (error) {
    console.error("Error obteniendo catálogos:", error);

    res.status(500).json({
      message: "Error obteniendo catálogos",
      error: error.message
    });
  }
};

module.exports = {
  obtenerCatalogos
};