export const CAMPOS_ESPECIFICACIONES = Object.freeze([
  "ID_SISTEMA_OPERATIVO",
  "ID_RAM",
  "ID_DISCO",
  "ID_PROCESADOR",
  "MODELO_PROCESADOR",
]);

const ESPECIFICACIONES_COMPLETAS = CAMPOS_ESPECIFICACIONES;
const SIN_ESPECIFICACIONES = Object.freeze([]);
const CAMPOS_IMPRESORA = Object.freeze(["TIPO_IMPRESORA", "CONEXION"]);

const definirEquipo = (nombre, campos, mostrarIP, mostrarAccesos) =>
  Object.freeze({ nombre, campos, mostrarIP, mostrarAccesos });

export const EQUIPOS_CONFIG = Object.freeze({
  1: definirEquipo("Laptop", ESPECIFICACIONES_COMPLETAS, false, true),
  2: definirEquipo("Desktop", ESPECIFICACIONES_COMPLETAS, false, true),
  3: definirEquipo("Impresora", CAMPOS_IMPRESORA, "segunConexion", false),
  4: definirEquipo("Pantalla POS", SIN_ESPECIFICACIONES, false, true),
  7: definirEquipo("Workstation POS", ESPECIFICACIONES_COMPLETAS, true, true),
  13: definirEquipo("Tablet POS", ESPECIFICACIONES_COMPLETAS, true, true),
  14: definirEquipo("Tablet", ESPECIFICACIONES_COMPLETAS, false, false),
  15: definirEquipo("Teléfono", ESPECIFICACIONES_COMPLETAS, false, false),
  17: definirEquipo("Switch", SIN_ESPECIFICACIONES, true, false),
  19: definirEquipo("Access Point", SIN_ESPECIFICACIONES, true, false),
  20: definirEquipo("CCTV", SIN_ESPECIFICACIONES, true, false),
  21: definirEquipo("KDS", SIN_ESPECIFICACIONES, true, true),
  38: definirEquipo("Servidor", ESPECIFICACIONES_COMPLETAS, true, true),
});

const CONEXIONES_CON_IP = new Set(["WIFI", "ETHERNET", "SERIAL Y ETHERNET"]);

const normalizarConexion = (conexion) =>
  String(conexion ?? "").trim().toUpperCase();

export const obtenerConfigEquipo = (idTipoEquipo) =>
  EQUIPOS_CONFIG[String(idTipoEquipo)] ?? null;

export const tieneCampoEquipo = (config, campo) =>
  Boolean(config?.campos.includes(campo));

export const tieneEspecificacionesTecnicas = (config) =>
  tieneCampoEquipo(config, "ID_SISTEMA_OPERATIVO");

export const requiereIP = (config, conexion) => {
  if (!config) return false;
  if (config.mostrarIP === "segunConexion") {
    return CONEXIONES_CON_IP.has(normalizarConexion(conexion));
  }
  return config.mostrarIP === true;
};

export const permiteAccesosRemotos = (config) =>
  config?.mostrarAccesos === true;
