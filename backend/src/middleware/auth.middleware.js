const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        message: "Token de autenticación requerido"
      });
    }

    const partes = authorization.split(" ");

    if (
      partes.length !== 2 ||
      partes[0] !== "Bearer" ||
      !partes[1]
    ) {
      return res.status(401).json({
        message: "Formato de token inválido"
      });
    }

    const token = partes[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "InventarioGA2026"
    );

    if (!decoded.IdUsuario) {
      return res.status(401).json({
        message: "El token no contiene un usuario válido"
      });
    }

    req.usuario = {
      IdUsuario: decoded.IdUsuario,
      Nombre: decoded.Nombre,
      Correo: decoded.Correo,
      IdRol: decoded.IdRol,
      Rol: decoded.Rol,
      DebeCambiarPassword: Boolean(
        decoded.DebeCambiarPassword
      )
    };

    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "La sesión expiró. Inicia sesión nuevamente"
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token inválido"
      });
    }

    console.error("Error validando token:", error);

    return res.status(500).json({
      message: "Error validando la sesión",
      error: error.message
    });
  }
};

module.exports = {
  verificarToken
};