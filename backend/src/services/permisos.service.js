const { poolPromise } = require("../config/db");

/**
 * Obtiene los permisos concedidos a un usuario
 * mediante su rol activo.
 *
 * @param {number} idUsuario
 * @returns {Promise<string[]>}
 */
const obtenerPermisosPorUsuario = async (idUsuario) => {
  if (!idUsuario) {
    return [];
  }

  const pool = await poolPromise;

  const result = await pool.request()
    .input("IdUsuario", idUsuario)
    .query(`
      SELECT DISTINCT
        P.CODIGO
      FROM dbo.Usuarios U
      INNER JOIN dbo.Roles R
        ON R.ID_ROL = U.IdRol
       AND R.ACTIVO = 1
      INNER JOIN dbo.Roles_Permisos RP
        ON RP.ID_ROL = R.ID_ROL
       AND RP.CONCEDIDO = 1
      INNER JOIN dbo.Permisos P
        ON P.ID_PERMISO = RP.ID_PERMISO
       AND P.ACTIVO = 1
      WHERE U.IdUsuario = @IdUsuario
        AND U.Activo = 1
      ORDER BY P.CODIGO;
    `);

  return result.recordset.map((permiso) => permiso.CODIGO);
};

/**
 * Comprueba directamente en base de datos si un usuario
 * cuenta con un permiso determinado.
 *
 * @param {number} idUsuario
 * @param {string} codigoPermiso
 * @returns {Promise<boolean>}
 */
const usuarioTienePermiso = async (
  idUsuario,
  codigoPermiso
) => {
  if (!idUsuario || !codigoPermiso) {
    return false;
  }

  const pool = await poolPromise;

  const result = await pool.request()
    .input("IdUsuario", idUsuario)
    .input("CodigoPermiso", codigoPermiso)
    .query(`
      SELECT TOP 1
        1 AS TienePermiso
      FROM dbo.Usuarios U
      INNER JOIN dbo.Roles R
        ON R.ID_ROL = U.IdRol
       AND R.ACTIVO = 1
      INNER JOIN dbo.Roles_Permisos RP
        ON RP.ID_ROL = R.ID_ROL
       AND RP.CONCEDIDO = 1
      INNER JOIN dbo.Permisos P
        ON P.ID_PERMISO = RP.ID_PERMISO
       AND P.ACTIVO = 1
      WHERE U.IdUsuario = @IdUsuario
        AND U.Activo = 1
        AND P.CODIGO = @CodigoPermiso;
    `);

  return result.recordset.length > 0;
};

module.exports = {
  obtenerPermisosPorUsuario,
  usuarioTienePermiso
};