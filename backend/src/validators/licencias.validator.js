
const TIPOS = Object.freeze({
  POR_NUCLEO: "POR_NUCLEO",
  SERVER_CAL: "SERVER_CAL",
  SUSCRIPCION: "SUSCRIPCION",
  PERPETUA: "PERPETUA",
  GRATUITA: "GRATUITA"
});

const ESTADOS = Object.freeze([
  "DISPONIBLE",
  "EN_USO",
  "OBSOLETA"
]);

const esEnteroPositivo = (valor) =>
  Number.isInteger(valor) && valor > 0;

const esFechaValida = (valor) => {
  if (typeof valor !== "string") return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const fecha = new Date(`${valor}T00:00:00Z`);

  return !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor;
};

const validarLicencia = (datos, tipoLicencia) => {
  const errores = [];

  // ============================================
  // VALIDAR CUERPO DE SOLICITUD
  // ============================================

  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    return {
      valido: false,
      errores: [
        "El cuerpo de la solicitud es inválido."
      ]
    };
  }

  // ============================================
  // VALIDACIONES GENERALES
  // ============================================

  if (
    typeof datos.SOFTWARE !== "string" ||
    !datos.SOFTWARE.trim() ||
    datos.SOFTWARE.length > 150
  ) {
    errores.push(
      "El software es obligatorio (máximo 150 caracteres)."
    );
  }

  if (
    typeof datos.VERSION !== "string" ||
    !datos.VERSION.trim() ||
    datos.VERSION.length > 100
  ) {
    errores.push(
      "La versión es obligatoria (máximo 100 caracteres)."
    );
  }

  if (!ESTADOS.includes(datos.ESTADO)) {
    errores.push(
      "El estado de licencia no es válido."
    );
  }

  if (
    datos.FECHA_ACTIVACION != null &&
    !esFechaValida(datos.FECHA_ACTIVACION)
  ) {
    errores.push(
      "La fecha de activación es inválida."
    );
  }

  if (
    datos.COMENTARIOS != null &&
    typeof datos.COMENTARIOS !== "string"
  ) {
    errores.push(
      "Los comentarios deben ser texto."
    );
  }

  if (
    datos.ACTIVADOR != null &&
    (
      typeof datos.ACTIVADOR !== "string" ||
      datos.ACTIVADOR.length > 150
    )
  ) {
    errores.push(
      "El activador debe ser texto de máximo 150 caracteres."
    );
  }

  // ============================================
  // VALIDAR CONFIGURACIÓN
  // ============================================

  const config = datos.CONFIGURACION;

  if (
    !config ||
    typeof config !== "object" ||
    Array.isArray(config)
  ) {
    errores.push(
      "CONFIGURACION debe ser un objeto."
    );

    return {
      valido: false,
      errores
    };
  }

  // ============================================
  // CAMPOS PERMITIDOS POR MODALIDAD
  // ============================================

  const clavesPermitidas = {
    [TIPOS.POR_NUCLEO]: [
      "nucleosLicenciados",
      "entorno"
    ],

    [TIPOS.SERVER_CAL]: [
      "tipoCAL",
      "cantidadCAL"
    ],

    [TIPOS.SUSCRIPCION]: [
      "fechaVencimiento"
    ],

    [TIPOS.PERPETUA]: [],

    // Las ediciones gratuitas no requieren
    // núcleos, CAL ni otros campos adicionales.
    [TIPOS.GRATUITA]: []
  };

  const permitidas = clavesPermitidas[tipoLicencia];

  if (!permitidas) {
    errores.push(
      "Tipo de licencia no reconocido."
    );

    return {
      valido: false,
      errores
    };
  }

  const extras = Object.keys(config).filter(
    clave => !permitidas.includes(clave)
  );

  if (extras.length > 0) {
    errores.push(
      `Campos de configuración no permitidos: ${extras.join(", ")}.`
    );
  }

  // ============================================
  // VALIDACIONES ESPECÍFICAS POR MODALIDAD
  // ============================================

  switch (tipoLicencia) {
    case TIPOS.POR_NUCLEO:
      if (
        !esEnteroPositivo(
          config.nucleosLicenciados
        )
      ) {
        errores.push(
          "nucleosLicenciados debe ser un entero positivo."
        );
      }

      if (
        config.entorno != null &&
        !["FISICO", "VIRTUAL"].includes(
          config.entorno
        )
      ) {
        errores.push(
          "El entorno debe ser FISICO o VIRTUAL."
        );
      }
      break;

    case TIPOS.SERVER_CAL:
      if (
        !["USUARIO", "DISPOSITIVO"].includes(
          config.tipoCAL
        )
      ) {
        errores.push(
          "El tipo de CAL no es válido."
        );
      }

      if (
        !esEnteroPositivo(
          config.cantidadCAL
        )
      ) {
        errores.push(
          "cantidadCAL debe ser un entero positivo."
        );
      }
      break;

    case TIPOS.SUSCRIPCION:
      if (
        !esFechaValida(
          config.fechaVencimiento
        )
      ) {
        errores.push(
          "La fecha de vencimiento es inválida."
        );
      } else if (
        datos.FECHA_ACTIVACION &&
        config.fechaVencimiento <
          datos.FECHA_ACTIVACION
      ) {
        errores.push(
          "La fecha de vencimiento no puede ser anterior a la activación."
        );
      }
      break;

    case TIPOS.PERPETUA:
      // No requiere configuración adicional.
      break;

    case TIPOS.GRATUITA:
      // No requiere configuración adicional.
      // El control de campos extras ya garantiza
      // que CONFIGURACION sea un objeto vacío.

      if (datos.ACTIVADOR != null &&
          datos.ACTIVADOR.trim() !== "") {
        errores.push(
          "La modalidad GRATUITA no requiere método de activación."
        );
      }

      if (datos.FECHA_ACTIVACION != null) {
        errores.push(
          "La modalidad GRATUITA no requiere fecha de activación."
        );
      }
      break;

    default:
      errores.push(
        "Modalidad de licencia no soportada."
      );
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

module.exports = {
  TIPOS,
  ESTADOS,
  validarLicencia
};
