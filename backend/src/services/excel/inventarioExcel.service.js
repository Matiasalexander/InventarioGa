const ExcelJS = require("exceljs");

const generarInventarioExcel = async (inventario = []) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Inventario GA";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Inventario");

  worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Restaurante", key: "UNIDAD", width: 25 },
    { header: "Localidad", key: "LOCALIDAD", width: 20 },
    { header: "Ubicación", key: "UBICACION", width: 25 },
    { header: "Tipo equipo", key: "TIPO_EQUIPO", width: 20 },
    { header: "Nombre equipo", key: "NOMBRE_EQUIPO", width: 25 },
    { header: "Serial", key: "SERIAL", width: 25 },
    { header: "Marca", key: "MARCA", width: 18 },
    { header: "Modelo", key: "MODELO", width: 25 },
    { header: "IP", key: "IP", width: 18 },
    { header: "Estatus", key: "ESTATUS", width: 18 },
    { header: "Estado físico", key: "ESTADO_FISICO", width: 18 },
    { header: "Correo", key: "CORREO", width: 30 },
    { header: "Comentario", key: "COMENTARIO", width: 40 },
  ];

  worksheet.addRows(inventario);

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  worksheet.autoFilter = {
    from: "A1",
    to: "N1",
  };

  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  generarInventarioExcel,
};