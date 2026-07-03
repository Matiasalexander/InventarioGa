const { poolPromise } = require("../config/db");
const generarPdfBuffer = require("./pdfTemplate");

const crearFolioResponsiva = (id) => {
  return `RESP-${String(id).padStart(5, "0")}`;
};

const generarPdfResponsiva = async (idResponsiva) => {
  const pool = await poolPromise;

  const responsivaResult = await pool.request()
    .input("IdResponsiva", idResponsiva)
    .query(`
      SELECT
        *,
        CONCAT('RESP-', RIGHT('00000' + CAST(IdResponsiva AS VARCHAR(10)), 5)) AS Folio
      FROM Responsivas
      WHERE IdResponsiva = @IdResponsiva
    `);

  if (responsivaResult.recordset.length === 0) {
    const error = new Error("Responsiva no encontrada");
    error.statusCode = 404;
    throw error;
  }

  const detalleResult = await pool.request()
    .input("IdResponsiva", idResponsiva)
    .query(`
      SELECT *
      FROM Responsiva_Detalle
      WHERE IdResponsiva = @IdResponsiva
      ORDER BY IdDetalle ASC
    `);

  const responsiva = responsivaResult.recordset[0];
  const equipos = detalleResult.recordset;
  const folio = responsiva.Folio || crearFolioResponsiva(responsiva.IdResponsiva);

  const pdfBuffer = await generarPdfBuffer({
    responsiva,
    equipos
  });

  return {
    pdfBuffer,
    responsiva,
    equipos,
    folio
  };
};

module.exports = generarPdfResponsiva;