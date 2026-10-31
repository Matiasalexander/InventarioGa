
const normalizarTexto = (valor) =>
  String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();

const validarSqlServer = (datos, tipoLicencia) => {
  const errores = [];

  // ============================================
  // IDENTIFICAR SOFTWARE
  // ============================================

  const software = normalizarTexto(
    datos?.SOFTWARE
  );

  const version = normalizarTexto(
    datos?.VERSION
  );

  const esSqlServer = [
    "SQL SERVER",
    "MICROSOFT SQL SERVER"
  ].includes(software);

  // Este validador solo aplica a SQL Server.
  if (!esSqlServer) {
    return {
      valido: true,
      errores
    };
  }

  // ============================================
  // EXTRAER VERSIÓN Y EDICIÓN
  // Formato enviado por LicenciaFormModal:
  // "2022 Express"
  // "2019 Developer"
  // "2022 Standard"
  // ============================================

  const coincidencia = version.match(
    /^(\d{4})\s+(STANDARD|ENTERPRISE|EXPRESS|DEVELOPER)$/
  );

  // Conservar la compatibilidad con las versiones
  // heredadas que ya estaban en el catálogo.
  const esVersionControlada =
    /^(2019|2022)(?:\s|$)/.test(version);

  if (!coincidencia) {
    if (esVersionControlada) {
      errores.push(
        "Selecciona una edición válida de SQL Server."
      );
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  const anio = coincidencia[1];
  const edicion = coincidencia[2];

  // Solo aplicamos las nuevas reglas estrictas
  // a las versiones configuradas: 2019 y 2022.
  if (!["2019", "2022"].includes(anio)) {
    return {
      valido: true,
      errores
    };
  }

  // ============================================
  // MODALIDADES PERMITIDAS
  // ============================================

  const modalidadesPermitidas = {
    STANDARD: [
      "POR_NUCLEO",
      "SERVER_CAL"
    ],

    ENTERPRISE: [
      "POR_NUCLEO"
    ],

    EXPRESS: [
      "GRATUITA"
    ],

    DEVELOPER: [
      "GRATUITA"
    ]
  };

  // ============================================
  // VERIFICAR MODALIDAD
  // ============================================

  if (
    !modalidadesPermitidas[edicion].includes(
      tipoLicencia
    )
  ) {
    errores.push(
      `SQL Server ${anio} ${edicion} no admite la modalidad ${tipoLicencia}.`
    );
  }

  // ============================================
  // REGLAS PARA EXPRESS Y DEVELOPER
  // ============================================

  const esGratuita = [
    "EXPRESS",
    "DEVELOPER"
  ].includes(edicion);

  if (esGratuita) {
    const config = datos?.CONFIGURACION;

    if (
      !config ||
      typeof config !== "object" ||
      Array.isArray(config) ||
      Object.keys(config).length > 0
    ) {
      errores.push(
        "SQL Server Express y Developer no admiten campos adicionales de licenciamiento."
      );
    }

    if (
      datos?.ACTIVADOR != null &&
      String(datos.ACTIVADOR).trim() !== ""
    ) {
      errores.push(
        "SQL Server Express y Developer no requieren activador."
      );
    }

    if (datos?.FECHA_ACTIVACION != null) {
      errores.push(
        "SQL Server Express y Developer no requieren fecha de activación."
      );
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

module.exports = {
  validarSqlServer
};
