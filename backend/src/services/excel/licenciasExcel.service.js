const ExcelJS = require("exceljs");
const generarLicenciasExcel = async (licencias = []) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inventario GA";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Gestor de licencias");
  worksheet.columns = [
    { header: "Software", key: "SOFTWARE", width: 30 },
    { header: "Versión", key: "VERSION", width: 22 },
    { header: "Modalidad", key: "TIPO_LICENCIA", width: 22 },
    { header: "Estado", key: "ESTADO", width: 18 },

    {
      header: "Equipos vinculados",
      key: "TOTAL_EQUIPOS",
      width: 22,
    },

    {
      header: "Nombre del equipo",
      key: "NOMBRE_EQUIPO",
      width: 28,
    },
    {
      header: "Restaurante / Unidad",
      key: "RESTAURANTE",
      width: 28,
    },
    {
      header: "Localidad",
      key: "LOCALIDAD",
      width: 22,
    },

    {
      header: "Fecha de asignación",
      key: "FECHA_ASIGNACION",
      width: 24,
    },
    {
      header: "Fecha de activación",
      key: "FECHA_ACTIVACION",
      width: 24,
    },
    {
      header: "Fecha de registro",
      key: "FECHA_REGISTRO",
      width: 24,
    },
    {
      header: "Comentarios",
      key: "COMENTARIOS",
      width: 45,
    },
  ];

  const textoSeguro = (valor) => {
    if (valor == null) return "";
    const texto = String(valor);
    return /^[\s]*[=+\-@]/.test(texto) ? "'" + texto : texto;
  };
  const fechaValida = (valor) => {
    if (!valor) return null;

    const fecha = new Date(valor);

    return Number.isNaN(fecha.getTime()) ? null : fecha;
  };

  for (const licencia of licencias) {
    worksheet.addRow({
      SOFTWARE: textoSeguro(licencia.SOFTWARE),
      VERSION: textoSeguro(licencia.VERSION),
      TIPO_LICENCIA: textoSeguro(licencia.TIPO_LICENCIA),
      ESTADO: licencia.ESTADO,

      TOTAL_EQUIPOS: licencia.TOTAL_EQUIPOS ?? 0,

      NOMBRE_EQUIPO: textoSeguro(licencia.NOMBRE_EQUIPO),

      RESTAURANTE: textoSeguro(licencia.RESTAURANTE),
      LOCALIDAD: textoSeguro(licencia.LOCALIDAD),
      FECHA_ASIGNACION: fechaValida(licencia.FECHA_ASIGNACION),
      FECHA_ACTIVACION: fechaValida(licencia.FECHA_ACTIVACION),
      FECHA_REGISTRO: fechaValida(licencia.FECHA_REGISTRO),

      COMENTARIOS: textoSeguro(licencia.COMENTARIOS),
    });
  }

  const encabezado = worksheet.getRow(1);

  encabezado.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  encabezado.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };

  encabezado.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  encabezado.height = 26;

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: {
      row: 1,
      column: worksheet.columns.length,
    },
  };

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  ["FECHA_ASIGNACION", "FECHA_ACTIVACION", "FECHA_REGISTRO"].forEach((key) => {
    const columna = worksheet.getColumn(key);

    columna.numFmt = "dd/mm/yyyy hh:mm";
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    if (rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
    }

    row.alignment = {
      vertical: "middle",
    };
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = {
  generarLicenciasExcel,
};