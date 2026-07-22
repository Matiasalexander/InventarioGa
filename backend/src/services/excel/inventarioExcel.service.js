const ExcelJS = require("exceljs");

const generarInventarioExcel = async (inventario = []) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Inventario GA";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Inventario");

  // CAMBIO:
  // Aquí defines todas las columnas que deseas mostrar en el Excel.
  // El key debe coincidir exactamente con el alias de la consulta SQL.
  worksheet.columns = [
    { header: "ID", key: "id", width: 10 },

    { header: "Restaurante", key: "UNIDAD", width: 25 },
    { header: "Localidad", key: "LOCALIDAD", width: 20 },
    { header: "Ubicación", key: "UBICACION", width: 25 },

    { header: "Departamento", key: "DEPARTAMENTO", width: 25 },
    { header: "Puesto", key: "PUESTO", width: 25 },

    { header: "Tipo de equipo", key: "TIPO_EQUIPO", width: 22 },
    { header: "Tipo de impresora", key: "TIPO_IMPRESORA", width: 22 },
    { header: "Nombre del equipo", key: "NOMBRE_EQUIPO", width: 25 },

    { header: "Serial", key: "SERIAL", width: 25 },
    { header: "Marca", key: "MARCA", width: 20 },
    { header: "Modelo", key: "MODELO", width: 25 },

    { header: "Procesador", key: "PROCESADOR", width: 22 },
    {
      header: "Modelo del procesador",
      key: "MODELO_PROCESADOR",
      width: 25
    },

    { header: "RAM", key: "MEMORIA_RAM", width: 15 },
    { header: "Disco duro", key: "DISCO_DURO", width: 18 },
    {
      header: "Sistema operativo",
      key: "SISTEMA_OPERATIVO",
      width: 22
    },

    {
      header: "Lector de huella",
      key: "LECTOR_DE_HUELLA",
      width: 18
    },
    { header: "Conexión", key: "CONEXION", width: 18 },

    { header: "IP", key: "IP", width: 18 },
    { header: "Puerto", key: "PUERTO", width: 15 },

    { header: "Estatus", key: "ESTATUS", width: 18 },
    { header: "Estado físico", key: "ESTADO_FISICO", width: 18 },

    { header: "Correo", key: "CORREO", width: 30 },

    {
      header: "Fecha de fabricación",
      key: "FECHA_FABRICACION",
      width: 20
    },
    {
      header: "Fecha de garantía",
      key: "FECHA_GARANTIA",
      width: 20
    },
    {
      header: "Fecha de inicio",
      key: "FECHA_INICIO",
      width: 20
    },
    {
      header: "Fecha de registro",
      key: "FECHA_REGISTRO",
      width: 20
    },

    {
      header: "Garantía restante",
      key: "Grestante",
      width: 20
    },
    {
      header: "Tiempo de uso",
      key: "Auso",
      width: 18
    },

    {
      header: "Acceso TeamViewer",
      key: "ACCESO_TEAM_VIEWER",
      width: 22
    },
    {
      header: "Contraseña TeamViewer",
      key: "CONTRASEÑA_TEAM_VIEWER",
      width: 25
    },
    {
      header: "Acceso AnyDesk",
      key: "ACCESO_ANYDESK",
      width: 22
    },
    {
      header: "Contraseña AnyDesk",
      key: "CONTRASEÑA_ANYDESK",
      width: 25
    },

    {
      header: "Responsiva digital",
      key: "RESPONSIVA_DIGITAL",
      width: 22
    },
    {
      header: "Número de responsiva",
      key: "NUM_RESPONSIVA",
      width: 22
    },

    { header: "Comentario", key: "COMENTARIO", width: 40 }
  ];

  worksheet.addRows(inventario);

  const encabezado = worksheet.getRow(1);

  encabezado.font = {
    bold: true,
    color: { argb: "FFFFFFFF" }
  };

  encabezado.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" }
  };

  encabezado.alignment = {
    vertical: "middle",
    horizontal: "center"
  };

  encabezado.height = 24;

  // CAMBIO:
  // El filtro ahora llega hasta la última columna automáticamente.
  worksheet.autoFilter = {
    from: {
      row: 1,
      column: 1
    },
    to: {
      row: 1,
      column: worksheet.columns.length
    }
  };

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1
    }
  ];

  // Formato para columnas de fecha.
  [
    "FECHA_FABRICACION",
    "FECHA_GARANTIA",
    "FECHA_INICIO",
    "FECHA_REGISTRO"
  ].forEach((key) => {
    const columna = worksheet.getColumn(key);
    columna.numFmt = "dd/mm/yyyy";
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return buffer;
};

module.exports = {
  generarInventarioExcel
};