const sql = require("mssql");
const { poolPromise } = require("../config/db");

/**
 * Obtiene los permisos de inventario de un usuario.
 * Devuelve:
 * {
 *   verTodas: true|false,
 *   unidades: [1,2,3]
 * }
 */
const obtenerPermisosInventario = async (idUsuario) => {
  const pool = await poolPromise;

  // Buscar si el usuario puede ver todas las unidades
  const usuarioResult = await pool
    .request()
    .input("IdUsuario", sql.Int, idUsuario)
    .query(`
      SELECT VerTodasUnidades
      FROM Usuarios
      WHERE IdUsuario = @IdUsuario
    `);

  if (usuarioResult.recordset.length === 0) {
    throw new Error("Usuario no encontrado.");
  }

  const verTodas = Boolean(
    usuarioResult.recordset[0].VerTodasUnidades
  );

  // Si tiene acceso total ya no buscamos unidades
  if (verTodas) {
    return {
      verTodas: true,
      unidades: []
    };
  }

  // Obtener unidades permitidas
  const unidadesResult = await pool
    .request()
    .input("IdUsuario", sql.Int, idUsuario)
    .query(`
      SELECT IdUnidad
      FROM Usuario_Unidades
      WHERE IdUsuario = @IdUsuario
      ORDER BY IdUnidad
    `);

  return {
    verTodas: false,
    unidades: unidadesResult.recordset.map(
      (u) => u.IdUnidad
    )
  };
};

module.exports = {
  obtenerPermisosInventario
};