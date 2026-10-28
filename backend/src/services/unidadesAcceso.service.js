
const sql = require("mssql");
const { poolPromise } = require("../config/db");

/**
 * Verifica si el usuario puede acceder
 * a una unidad de Inventario GA.
 */
const usuarioPuedeAccederUnidad = async (
  idUsuario,
  idUnidad,
  transaccion = null
) => {
  const usuario = Number(idUsuario);
  const unidad = Number(idUnidad);

  if (
    !Number.isSafeInteger(usuario) ||
    usuario <= 0 ||
    !Number.isSafeInteger(unidad) ||
    unidad <= 0
  ) {
    return false;
  }

  const pool = transaccion
    ? null
    : await poolPromise;

  const request = transaccion
    ? new sql.Request(transaccion)
    : pool.request();

  const resultado = await request
    .input("IdUsuario", sql.Int, usuario)
    .input("IdUnidad", sql.Int, unidad)
    .query(`
      SELECT TOP (1)
        1 AS Autorizado
      FROM dbo.Usuarios AS U
      INNER JOIN dbo.Roles AS R
        ON R.ID_ROL = U.IdRol
       AND R.ACTIVO = 1
      WHERE U.IdUsuario = @IdUsuario
        AND U.Activo = 1
        AND (
          R.NOMBRE = 'Administrador'
          OR EXISTS (
            SELECT 1
            FROM dbo.Usuario_Unidades AS UU
            WHERE UU.IdUsuario = U.IdUsuario
              AND UU.IdUnidad = @IdUnidad
          )
        );
    `);

  return resultado.recordset.length > 0;
};

module.exports = {
  usuarioPuedeAccederUnidad
};
