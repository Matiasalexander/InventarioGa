const normalizarTexto = (valor) =>
  String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();

const validarSqlServer = (datos, tipoLicencia) => {
  const errores = [];

  const software = normalizarTexto(datos?.SOFTWARE);
  const version = normalizarTexto(datos?.VERSION);

  const esSqlServer = [
    "SQL SERVER",
    "MICROSOFT SQL SERVER"
  ].includes(software);

  if (!esSqlServer) {
    return { valido: true, errores };
  }

  if (!/^2022(?:\s|$)/.test(version)) {
    return { valido: true, errores };
  }

  const edicion = version
    .replace(/^2022\s*/, "")
    .trim();

  if (!["STANDARD", "ENTERPRISE"].includes(edicion)) {
    errores.push(
      "Para SQL Server 2022 comercial selecciona Standard o Enterprise."
    );

    return { valido: false, errores };
  }

  const modalidadesPermitidas = {
    STANDARD: ["POR_NUCLEO", "SERVER_CAL"],
    ENTERPRISE: ["POR_NUCLEO"]
  };

  if (!modalidadesPermitidas[edicion].includes(tipoLicencia)) {
    errores.push(
      `SQL Server 2022 ${edicion} no admite la modalidad ${tipoLicencia} en este registro.`
    );
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

module.exports = {
  validarSqlServer
};
