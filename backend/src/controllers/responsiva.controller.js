const responsivaService = require("../services/responsiva.service");

const responderError = (res, error, mensaje) => {
  res.status(error.statusCode || 500).json({
    message: mensaje,
    error: error.message
  });
};

const crearResponsiva = async (req, res) => {
  try {
    const data = await responsivaService.crearResponsiva(req.body);

    res.status(201).json({
      message: data.correoEnviado
        ? "Responsiva creada correctamente y enviada por correo"
        : "Responsiva creada correctamente",
      ...data
    });
  } catch (error) {
    responderError(res, error, "Error creando responsiva");
  }
};

const actualizarResponsiva = async (req, res) => {
  try {
    const data = await responsivaService.actualizarResponsiva(
      req.params.id,
      req.body
    );

    res.json(data);
  } catch (error) {
    responderError(res, error, "Error actualizando responsiva");
  }
};

const obtenerResponsivas = async (req, res) => {
  try {
    const data = await responsivaService.obtenerResponsivas();
    res.json(data);
  } catch (error) {
    responderError(res, error, "Error obteniendo responsivas");
  }
};

const obtenerResponsivaPorId = async (req, res) => {
  try {
    const data = await responsivaService.obtenerResponsivaPorId(req.params.id);
    res.json(data);
  } catch (error) {
    responderError(res, error, "Error obteniendo responsiva");
  }
};

const obtenerResponsivasPorEquipo = async (req, res) => {
  try {
    const data = await responsivaService.obtenerResponsivasPorEquipo(
      req.params.idInventario
    );

    res.json(data);
  } catch (error) {
    responderError(res, error, "Error obteniendo historial de responsivas");
  }
};

const descargarResponsivaPdf = async (req, res) => {
  try {
    const { pdfBuffer, folio } = await responsivaService.generarPdfPorId(
      req.params.id
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${folio}.pdf`);
    res.end(pdfBuffer);
  } catch (error) {
    responderError(res, error, "Error descargando responsiva PDF");
  }
};

const reenviarResponsivaCorreo = async (req, res) => {
  try {
    const data = await responsivaService.reenviarResponsivaCorreo(
      req.params.id
    );

    res.json(data);
  } catch (error) {
    responderError(res, error, "Error reenviando responsiva por correo");
  }
};

const marcarEquipoDevuelto = async (req, res) => {
  try {
    const data = await responsivaService.marcarEquipoDevuelto(
      req.params.idDetalle,
      req.body.ComentariosDevolucion
    );

    res.json(data);
  } catch (error) {
    responderError(res, error, "Error marcando devolución");
  }
};

const obtenerEquiposDisponibles = async (req, res) => {
  try {
    const data = await responsivaService.obtenerEquiposDisponibles();
    res.json(data);
  } catch (error) {
    responderError(res, error, "Error obteniendo equipos disponibles");
  }
};

const eliminarResponsiva = async (req, res) => {
  try {
    const data = await responsivaService.eliminarResponsiva(req.params.id);
    res.json(data);
  } catch (error) {
    responderError(res, error, "Error eliminando responsiva");
  }
};

module.exports = {
  crearResponsiva,
  actualizarResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  obtenerResponsivasPorEquipo,
  descargarResponsivaPdf,
  reenviarResponsivaCorreo,
  eliminarResponsiva,
  marcarEquipoDevuelto,
  obtenerEquiposDisponibles
};