const { poolPromise } = require("../config/db");
const generarPdfResponsiva = require("../helpers/generarPdfResponsiva");
const enviarCorreoResponsiva = require("../helpers/enviarCorreoResponsiva");

const crearFolioResponsiva = (id) =>
  `RESP-${String(id).padStart(5, "0")}`;

const crearResponsivaService = async (payload) => {
  const {
    Fecha,
    NombreReceptor,
    Puesto,
    Area,
    Correo,
    FirmaBase64,
    equipos
  } = payload;

  const pool = await poolPromise;

  const result = await pool.request()
    .input("Fecha", Fecha)
    .input("NombreReceptor", NombreReceptor)
    .input("Puesto", Puesto)
    .input("Area", Area || null)
    .input("Correo", Correo || null)
    .input("FirmaBase64", FirmaBase64 || null)
    .query(`
      INSERT INTO Responsivas (
        Fecha, NombreReceptor, Puesto, Area, Correo, FirmaBase64, Estado
      )
      OUTPUT INSERTED.IdResponsiva
      VALUES (
        @Fecha, @NombreReceptor, @Puesto, @Area, @Correo, @FirmaBase64, 'ACTIVA'
      )
    `);

  const IdResponsiva = result.recordset[0].IdResponsiva;

  for (const equipo of equipos) {
    await pool.request()
      .input("IdResponsiva", IdResponsiva)
      .input("IdInventario", equipo.IdInventario || null)
      .input("Descripcion", equipo.Descripcion || null)
      .input("Marca", equipo.Marca || null)
      .input("Modelo", equipo.Modelo || null)
      .input("NoSerie", equipo.NoSerie || null)
      .query(`
        INSERT INTO Responsiva_Detalle (
          IdResponsiva, IdInventario, Descripcion, Marca, Modelo, NoSerie
        )
        VALUES (
          @IdResponsiva, @IdInventario, @Descripcion, @Marca, @Modelo, @NoSerie
        )
      `);

    if (equipo.IdInventario) {
      await pool.request()
        .input("IdInventario", equipo.IdInventario)
        .input("IdResponsiva", IdResponsiva)
        .query(`
          UPDATE INVENTARIO_M
          SET RESPONSIVA_DIGITAL = 1,
              NUM_RESPONSIVA = @IdResponsiva
          WHERE id = @IdInventario
        `);
    }
  }

  const folio = crearFolioResponsiva(IdResponsiva);

  let correoEnviado = false;

  if (Correo) {
    const { pdfBuffer } = await generarPdfResponsiva(IdResponsiva);

    await enviarCorreoResponsiva({
      correo: Correo,
      nombre: NombreReceptor,
      folio,
      pdfBuffer
    });

    correoEnviado = true;
  }

  return {
    IdResponsiva,
    Folio: folio,
    correoEnviado
  };
};

const actualizarResponsivaService = async (id, payload) => {
  const {
    Fecha,
    NombreReceptor,
    Puesto,
    Area,
    Correo
  } = payload;

  const pool = await poolPromise;

  const existe = await pool.request()
    .input("IdResponsiva", id)
    .query(`
      SELECT IdResponsiva
      FROM Responsivas
      WHERE IdResponsiva = @IdResponsiva
    `);

  if (existe.recordset.length === 0) {
    const error = new Error("Responsiva no encontrada");
    error.statusCode = 404;
    throw error;
  }

  await pool.request()
    .input("IdResponsiva", id)
    .input("Fecha", Fecha)
    .input("NombreReceptor", NombreReceptor)
    .input("Puesto", Puesto)
    .input("Area", Area || null)
    .input("Correo", Correo || null)
    .query(`
      UPDATE Responsivas
      SET
        Fecha = @Fecha,
        NombreReceptor = @NombreReceptor,
        Puesto = @Puesto,
        Area = @Area,
        Correo = @Correo
      WHERE IdResponsiva = @IdResponsiva
    `);

  return {
    message: "Responsiva actualizada correctamente"
  };
};

module.exports = {
  crearResponsivaService,
  actualizarResponsivaService,
  crearFolioResponsiva
};