const { poolPromise } = require("../config/db");

const obtenerRoles = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        ID_ROL,
        NOMBRE,
        DESCRIPCION,
        ACTIVO
      FROM Roles
      ORDER BY NOMBRE
    `);

    return res.json(result.recordset);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error obteniendo roles",
      error: error.message
    });
  }
};

const obtenerPermisos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        ID_PERMISO,
        CODIGO,
        DESCRIPCION AS NOMBRE,
        MODULO,
        ACCION
      FROM Permisos
      WHERE ACTIVO = 1
      ORDER BY MODULO, ACCION
    `);

    return res.json(result.recordset);

  } catch (error) {
    console.error("Error obteniendo permisos:", error);

    return res.status(500).json({
      message: "Error obteniendo permisos",
      error: error.message
    });
  }
};
const obtenerPermisosRol = async (req, res) => {
  try {
    const { idRol } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("IdRol", idRol)
      .query(`
        SELECT
          P.ID_PERMISO,
          P.CODIGO,
          P.DESCRIPCION AS NOMBRE,
          P.MODULO,
          P.ACCION
        FROM Roles_Permisos RP
        INNER JOIN Permisos P
          ON RP.ID_PERMISO = P.ID_PERMISO
        WHERE RP.ID_ROL = @IdRol
          AND P.ACTIVO = 1
        ORDER BY P.MODULO, P.ACCION
      `);

    return res.json(result.recordset);

  } catch (error) {
    console.error(
      "Error obteniendo permisos del rol:",
      error
    );

    return res.status(500).json({
      message: "Error obteniendo permisos del rol",
      error: error.message
    });
  }
};

const actualizarPermisosRol = async (req, res) => {

  try {

    const { idRol } = req.params;

    const { permisos } = req.body;

    if (!Array.isArray(permisos)) {
      return res.status(400).json({
        message: "Debe enviar un arreglo de permisos"
      });
    }

    const pool = await poolPromise;

    const transaction = pool.transaction();

    await transaction.begin();

    try {

      await transaction.request()
        .input("IdRol", idRol)
        .query(`
          DELETE
          FROM Roles_Permisos
          WHERE ID_ROL=@IdRol
        `);

      for (const idPermiso of permisos) {

        await transaction.request()
          .input("IdRol", idRol)
          .input("IdPermiso", idPermiso)
          .query(`
            INSERT INTO Roles_Permisos
            (
              ID_ROL,
              ID_PERMISO
            )
            VALUES
            (
              @IdRol,
              @IdPermiso
            )
          `);

      }

      await transaction.commit();

      return res.json({
        message: "Permisos actualizados correctamente"
      });

    } catch (err) {

      await transaction.rollback();
      throw err;

    }

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error actualizando permisos",
      error: error.message
    });

  }

};

module.exports = {
  obtenerRoles,
  obtenerPermisos,
  obtenerPermisosRol,
  actualizarPermisosRol
};