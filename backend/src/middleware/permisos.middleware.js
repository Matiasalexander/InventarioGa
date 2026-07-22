const {
  usuarioTienePermiso
} = require("../services/permisos.service");

const verificarPermiso = (codigoPermiso) => {
  return async (req, res, next) => {
    try {
      if (!codigoPermiso) {
        return res.status(500).json({
          message: "No se configuró el permiso requerido"
        });
      }

      if (!req.usuario?.IdUsuario) {
        return res.status(401).json({
          message: "Usuario no autenticado"
        });
      }

      const tienePermiso = await usuarioTienePermiso(
        req.usuario.IdUsuario,
        codigoPermiso
      );

      if (!tienePermiso) {
        return res.status(403).json({
          message: "No tienes permiso para realizar esta acción",
          permisoRequerido: codigoPermiso
        });
      }

      return next();

    } catch (error) {
      console.error(
        `Error validando permiso ${codigoPermiso}:`,
        error
      );

      return res.status(500).json({
        message: "Error validando permisos",
        error: error.message
      });
    }
  };
};

module.exports = {
  verificarPermiso
};