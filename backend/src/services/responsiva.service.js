const { poolPromise } = require("../config/db");
const generarPdfResponsiva = require("../helpers/generarPdfResponsiva");
const enviarCorreoResponsiva = require("../helpers/enviarCorreoResponsiva");

const crearFolioResponsiva = (id) => {
  return `RESP-${String(id).padStart(5, "0")}`;
};

const lanzarError = (mensaje, statusCode = 400) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  throw error;
};

const validarResponsiva = ({ Fecha, NombreReceptor, Puesto, equipos }) => {
  if (!Fecha || !NombreReceptor || !Puesto) {
    lanzarError("Fecha, nombre del receptor y puesto son obligatorios");
  }

  if (!equipos || equipos.length === 0) {
    lanzarError("Debes agregar al menos un equipo a la responsiva");
  }
};

const validarEquiposDisponibles = async (pool, equipos) => {
  for (const equipo of equipos) {
    if (!equipo.IdInventario) continue;

    const result = await pool.request()
      .input("IdInventario", equipo.IdInventario)
      .query(`
        SELECT TOP 1
          rd.IdDetalle,
          r.IdResponsiva,
          r.NombreReceptor
        FROM Responsiva_Detalle rd
        INNER JOIN Responsivas r
          ON rd.IdResponsiva = r.IdResponsiva
        WHERE rd.IdInventario = @IdInventario
          AND ISNULL(rd.Devuelto, 0) = 0
      `);

    if (result.recordset.length > 0) {
      lanzarError(
        `El equipo ya está asignado a ${result.recordset[0].NombreReceptor}`
      );
    }
  }
};

const crearResponsiva = async (payload) => {
  validarResponsiva(payload);

  const {
    Fecha,
    NombreReceptor,
    Puesto,
    Area,
    Correo,
    FirmaBase64,
    CorreoCreador,
    IdUsuarioCreador,
    equipos
  } = payload;

  const pool = await poolPromise;

  await validarEquiposDisponibles(pool, equipos);

  const result = await pool.request()
    .input("Fecha", Fecha)
    .input("NombreReceptor", NombreReceptor)
    .input("Puesto", Puesto)
    .input("Area", Area || null)
    .input("Correo", Correo || null)
    .input("FirmaBase64", FirmaBase64 || null)
    .input("CorreoCreador", CorreoCreador || null)
    .input("IdUsuarioCreador", IdUsuarioCreador || null)
    .query(`
      INSERT INTO Responsivas (
        Fecha,
        NombreReceptor,
        Puesto,
        Area,
        Correo,
        FirmaBase64,
        Estado,
        CorreoCreador,
        IdUsuarioCreador
      )
      OUTPUT INSERTED.IdResponsiva
      VALUES (
        @Fecha,
        @NombreReceptor,
        @Puesto,
        @Area,
        @Correo,
        @FirmaBase64,
        'ACTIVA',
        @CorreoCreador,
        @IdUsuarioCreador
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
          IdResponsiva,
          IdInventario,
          Descripcion,
          Marca,
          Modelo,
          NoSerie
        )
        VALUES (
          @IdResponsiva,
          @IdInventario,
          @Descripcion,
          @Marca,
          @Modelo,
          @NoSerie
        )
      `);

    if (equipo.IdInventario) {
      await pool.request()
        .input("IdInventario", equipo.IdInventario)
        .input("IdResponsiva", IdResponsiva)
        .query(`
          UPDATE INVENTARIO_M
          SET
            RESPONSIVA_DIGITAL = 1,
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

const actualizarResponsiva = async (id, payload) => {
  const {
    Fecha,
    NombreReceptor,
    Puesto,
    Area,
    Correo
  } = payload;

  if (!Fecha || !NombreReceptor || !Puesto) {
    lanzarError("Fecha, nombre del receptor y puesto son obligatorios");
  }

  const pool = await poolPromise;

  const existe = await pool.request()
    .input("IdResponsiva", id)
    .query(`
      SELECT IdResponsiva
      FROM Responsivas
      WHERE IdResponsiva = @IdResponsiva
    `);

  if (existe.recordset.length === 0) {
    lanzarError("Responsiva no encontrada", 404);
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

const obtenerResponsivas = async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      IdResponsiva,
      CONCAT('RESP-', RIGHT('00000' + CAST(IdResponsiva AS VARCHAR(10)), 5)) AS Folio,
      Fecha,
      NombreReceptor,
      Puesto,
      Area,
      Correo,
      CorreoCreador,
      Estado,
      FechaCreacion
    FROM Responsivas
    ORDER BY IdResponsiva DESC
  `);

  return result.recordset;
};

const obtenerResponsivaPorId = async (id) => {
  const pool = await poolPromise;

  const responsiva = await pool.request()
    .input("IdResponsiva", id)
    .query(`
      SELECT
        *,
        CONCAT('RESP-', RIGHT('00000' + CAST(IdResponsiva AS VARCHAR(10)), 5)) AS Folio
      FROM Responsivas
      WHERE IdResponsiva = @IdResponsiva
    `);

  if (responsiva.recordset.length === 0) {
    lanzarError("Responsiva no encontrada", 404);
  }

  const detalle = await pool.request()
    .input("IdResponsiva", id)
    .query(`
      SELECT *
      FROM Responsiva_Detalle
      WHERE IdResponsiva = @IdResponsiva
      ORDER BY IdDetalle ASC
    `);

  return {
    responsiva: responsiva.recordset[0],
    equipos: detalle.recordset
  };
};

const obtenerResponsivasPorEquipo = async (idInventario) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("IdInventario", idInventario)
    .query(`
      SELECT
        r.IdResponsiva,
        CONCAT('RESP-', RIGHT('00000' + CAST(r.IdResponsiva AS VARCHAR(10)), 5)) AS Folio,
        r.Fecha,
        r.NombreReceptor,
        r.Puesto,
        r.Area,
        r.Correo,
        r.Estado,
        rd.IdDetalle,
        rd.IdInventario,
        rd.Descripcion,
        rd.Marca,
        rd.Modelo,
        rd.NoSerie,
        rd.Devuelto,
        rd.FechaDevolucion,
        rd.ComentariosDevolucion
      FROM Responsiva_Detalle rd
      INNER JOIN Responsivas r
        ON rd.IdResponsiva = r.IdResponsiva
      WHERE rd.IdInventario = @IdInventario
      ORDER BY r.Fecha DESC, r.IdResponsiva DESC
    `);

  const historial = result.recordset;
  const activa = historial.find((item) => !item.Devuelto) || null;

  return {
    activa,
    historial
  };
};

const generarPdfPorId = async (id) => {
  return generarPdfResponsiva(id);
};

const reenviarResponsivaCorreo = async (id) => {
  const {
    pdfBuffer,
    responsiva,
    folio
  } = await generarPdfResponsiva(id);

  if (!responsiva.Correo) {
    lanzarError("La responsiva no tiene correo registrado");
  }

  await enviarCorreoResponsiva({
    correo: responsiva.Correo,
    nombre: responsiva.NombreReceptor,
    folio,
    pdfBuffer
  });

  return {
    message: "Responsiva reenviada correctamente por correo"
  };
};

const marcarEquipoDevuelto = async (idDetalle, ComentariosDevolucion) => {
  const pool = await poolPromise;

  const detalle = await pool.request()
    .input("IdDetalle", idDetalle)
    .query(`
      SELECT
        IdInventario,
        IdResponsiva
      FROM Responsiva_Detalle
      WHERE IdDetalle = @IdDetalle
    `);

  if (detalle.recordset.length === 0) {
    lanzarError("Detalle de responsiva no encontrado", 404);
  }

  const { IdInventario, IdResponsiva } = detalle.recordset[0];

  await pool.request()
    .input("IdDetalle", idDetalle)
    .input("ComentariosDevolucion", ComentariosDevolucion || null)
    .query(`
      UPDATE Responsiva_Detalle
      SET
        Devuelto = 1,
        FechaDevolucion = GETDATE(),
        ComentariosDevolucion = @ComentariosDevolucion
      WHERE IdDetalle = @IdDetalle
    `);

  if (IdInventario) {
    await pool.request()
      .input("IdInventario", IdInventario)
      .query(`
        UPDATE INVENTARIO_M
        SET
          RESPONSIVA_DIGITAL = 0,
          NUM_RESPONSIVA = NULL
        WHERE id = @IdInventario
      `);
  }

  const pendientes = await pool.request()
    .input("IdResponsiva", IdResponsiva)
    .query(`
      SELECT COUNT(*) AS Pendientes
      FROM Responsiva_Detalle
      WHERE IdResponsiva = @IdResponsiva
        AND ISNULL(Devuelto, 0) = 0
    `);

  if (pendientes.recordset[0].Pendientes === 0) {
    await pool.request()
      .input("IdResponsiva", IdResponsiva)
      .query(`
        UPDATE Responsivas
        SET Estado = 'INACTIVA'
        WHERE IdResponsiva = @IdResponsiva
      `);
  }

  return {
    message: "Equipo marcado como devuelto"
  };
};

const obtenerEquiposDisponibles = async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      i.id,
      i.NOMBRE_EQUIPO,
      i.SERIAL,
      i.MODELO,
      i.SISTEMA_OPERATIVO,
      i.ID_TIPO_EQUIPO,
      te.tequipo AS TIPO_EQUIPO,
      i.ID_MARCA,
      m.Marca AS MARCA,
      i.ID_ESTATUS,
      e.Estatus_equipo AS ESTATUS
    FROM INVENTARIO_M i
    LEFT JOIN Tipo_equipo te ON i.ID_TIPO_EQUIPO = te.id
    LEFT JOIN Marcas m ON i.ID_MARCA = m.id
    LEFT JOIN Estatus e ON i.ID_ESTATUS = e.Id
    WHERE NOT EXISTS (
      SELECT 1
      FROM Responsiva_Detalle rd
      WHERE rd.IdInventario = i.id
        AND ISNULL(rd.Devuelto, 0) = 0
    )
    ORDER BY i.id DESC
  `);

  return result.recordset;
};

const eliminarResponsiva = async (id) => {
  const pool = await poolPromise;

  const detalle = await pool.request()
    .input("IdResponsiva", id)
    .query(`
      SELECT IdInventario
      FROM Responsiva_Detalle
      WHERE IdResponsiva = @IdResponsiva
    `);

  for (const equipo of detalle.recordset) {
    if (equipo.IdInventario) {
      await pool.request()
        .input("IdInventario", equipo.IdInventario)
        .query(`
          UPDATE INVENTARIO_M
          SET
            RESPONSIVA_DIGITAL = 0,
            NUM_RESPONSIVA = NULL
          WHERE id = @IdInventario
        `);
    }
  }

  await pool.request()
    .input("IdResponsiva", id)
    .query(`
      DELETE FROM Responsiva_Detalle
      WHERE IdResponsiva = @IdResponsiva
    `);

  await pool.request()
    .input("IdResponsiva", id)
    .query(`
      DELETE FROM Responsivas
      WHERE IdResponsiva = @IdResponsiva
    `);

  return {
    message: "Responsiva eliminada correctamente"
  };
};

module.exports = {
  crearResponsiva,
  actualizarResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  obtenerResponsivasPorEquipo,
  generarPdfPorId,
  reenviarResponsivaCorreo,
  marcarEquipoDevuelto,
  obtenerEquiposDisponibles,
  eliminarResponsiva
};