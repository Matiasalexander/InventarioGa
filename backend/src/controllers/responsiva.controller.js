const { poolPromise } = require("../config/db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "../assets/gandersons-logo.png");

const crearFolioResponsiva = (id) => {
  return `RESP-${String(id).padStart(5, "0")}`;
};

const crearResponsiva = async (req, res) => {
  try {
    const {
      Fecha,
      NombreReceptor,
      Puesto,
      Area,
      FirmaBase64,
      equipos
    } = req.body;

    if (!Fecha || !NombreReceptor || !Puesto) {
      return res.status(400).json({
        message: "Fecha, nombre del receptor y puesto son obligatorios"
      });
    }

    if (!equipos || equipos.length === 0) {
      return res.status(400).json({
        message: "Debes agregar al menos un equipo a la responsiva"
      });
    }

    const pool = await poolPromise;

    for (const equipo of equipos) {
      if (!equipo.IdInventario) continue;

      const equipoAsignado = await pool.request()
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

      if (equipoAsignado.recordset.length > 0) {
        return res.status(400).json({
          message: `El equipo ya está asignado a ${equipoAsignado.recordset[0].NombreReceptor}`
        });
      }
    }

    const result = await pool.request()
      .input("Fecha", Fecha)
      .input("NombreReceptor", NombreReceptor)
      .input("Puesto", Puesto)
      .input("Area", Area || null)
      .input("FirmaBase64", FirmaBase64 || null)
      .query(`
        INSERT INTO Responsivas (
          Fecha,
          NombreReceptor,
          Puesto,
          Area,
          FirmaBase64,
          Estado
        )
        OUTPUT INSERTED.IdResponsiva
        VALUES (
          @Fecha,
          @NombreReceptor,
          @Puesto,
          @Area,
          @FirmaBase64,
          'ACTIVA'
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

    res.status(201).json({
      message: "Responsiva creada correctamente",
      IdResponsiva,
      Folio: crearFolioResponsiva(IdResponsiva)
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creando responsiva",
      error: error.message
    });
  }
};

const obtenerResponsivas = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        IdResponsiva,
        CONCAT('RESP-', RIGHT('00000' + CAST(IdResponsiva AS VARCHAR(10)), 5)) AS Folio,
        Fecha,
        NombreReceptor,
        Puesto,
        Area,
        Estado,
        FechaCreacion
      FROM Responsivas
      ORDER BY IdResponsiva DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo responsivas",
      error: error.message
    });
  }
};

const obtenerResponsivaPorId = async (req, res) => {
  try {
    const { id } = req.params;
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
      return res.status(404).json({
        message: "Responsiva no encontrada"
      });
    }

    const detalle = await pool.request()
      .input("IdResponsiva", id)
      .query(`
        SELECT *
        FROM Responsiva_Detalle
        WHERE IdResponsiva = @IdResponsiva
        ORDER BY IdDetalle ASC
      `);

    res.json({
      responsiva: responsiva.recordset[0],
      equipos: detalle.recordset
    });

  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo responsiva",
      error: error.message
    });
  }
};

const obtenerResponsivasPorEquipo = async (req, res) => {
  try {
    const { idInventario } = req.params;
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

    res.json({
      activa,
      historial
    });

  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo historial de responsivas del equipo",
      error: error.message
    });
  }
};

const descargarResponsivaPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const responsivaResult = await pool.request()
      .input("IdResponsiva", id)
      .query(`
        SELECT *
        FROM Responsivas
        WHERE IdResponsiva = @IdResponsiva
      `);

    if (responsivaResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Responsiva no encontrada"
      });
    }

    const detalleResult = await pool.request()
      .input("IdResponsiva", id)
      .query(`
        SELECT *
        FROM Responsiva_Detalle
        WHERE IdResponsiva = @IdResponsiva
        ORDER BY IdDetalle ASC
      `);

    const responsiva = responsivaResult.recordset[0];
    const equipos = detalleResult.recordset;
    const folio = crearFolioResponsiva(responsiva.IdResponsiva);

    const doc = new PDFDocument({
      size: "A4",
      margin: 50
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${folio}.pdf`
    );

    doc.pipe(res);

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 35, {
        width: 120
      });
    }

    doc.moveDown(4);

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("CARTA RESPONSIVA DE EQUIPO DE CÓMPUTO", {
        align: "center"
      });

    doc.moveDown(2);

    const fecha = responsiva.Fecha
      ? new Date(responsiva.Fecha).toLocaleDateString("es-MX")
      : "FECHA";

    doc
      .font("Helvetica")
      .fontSize(11)
      .text(
        "Por este medio hago constar que el equipo que se detalla a continuación se encuentra en calidad de préstamo a partir del día ",
        {
          continued: true,
          align: "justify"
        }
      )
      .font("Helvetica-Bold")
      .text(fecha, {
        continued: true
      })
      .font("Helvetica")
      .text(" y que está bajo resguardo de ", {
        continued: true
      })
      .font("Helvetica-Bold")
      .text(responsiva.NombreReceptor || "NOMBRE RECEPTOR", {
        continued: true
      })
      .font("Helvetica")
      .text(", quien se desempeña en el puesto ", {
        continued: true
      })
      .font("Helvetica-Bold")
      .text(responsiva.Puesto || "PUESTO", {
        continued: true
      })
      .font("Helvetica")
      .text(
        " en Grupo Andersons. Dicho(s) equipo(s) cumplirá(n) el uso para los fines que fueron acordados y se hace responsable de regresarlo en las mismas condiciones que se le fue entregado."
      );

    doc.moveDown();

    doc
      .font("Helvetica")
      .fontSize(11)
      .text("La descripción del (los) equipo(s) se detalla a continuación:");

    doc.moveDown();

    const startX = 50;
    const tableTop = doc.y;
    const rowHeight = 26;

    const columnWidths = {
      descripcion: 180,
      marca: 90,
      modelo: 140,
      serie: 130
    };

    const drawCell = (text, x, y, width, height, bold = false) => {
      doc
        .lineWidth(1)
        .rect(x, y, width, height)
        .stroke();

      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(10)
        .text(text || "", x + 6, y + 8, {
          width: width - 12,
          height: height - 8
        });
    };

    drawCell(
      "Descripción",
      startX,
      tableTop,
      columnWidths.descripcion,
      rowHeight,
      true
    );

    drawCell(
      "Marca",
      startX + columnWidths.descripcion,
      tableTop,
      columnWidths.marca,
      rowHeight,
      true
    );

    drawCell(
      "Modelo",
      startX + columnWidths.descripcion + columnWidths.marca,
      tableTop,
      columnWidths.modelo,
      rowHeight,
      true
    );

    drawCell(
      "Número de Serie",
      startX + columnWidths.descripcion + columnWidths.marca + columnWidths.modelo,
      tableTop,
      columnWidths.serie,
      rowHeight,
      true
    );

    let y = tableTop + rowHeight;

    if (equipos.length === 0) {
      drawCell("Sin equipos registrados", startX, y, 540, rowHeight);
      y += rowHeight;
    } else {
      equipos.forEach((equipo) => {
        if (y > 680) {
          doc.addPage();
          y = 60;
        }

        drawCell(
          equipo.Descripcion || "",
          startX,
          y,
          columnWidths.descripcion,
          rowHeight
        );

        drawCell(
          equipo.Marca || "",
          startX + columnWidths.descripcion,
          y,
          columnWidths.marca,
          rowHeight
        );

        drawCell(
          equipo.Modelo || "",
          startX + columnWidths.descripcion + columnWidths.marca,
          y,
          columnWidths.modelo,
          rowHeight
        );

        drawCell(
          equipo.NoSerie || "",
          startX + columnWidths.descripcion + columnWidths.marca + columnWidths.modelo,
          y,
          columnWidths.serie,
          rowHeight
        );

        y += rowHeight;
      });
    }

    doc.y = y + 75;

    if (responsiva.FirmaBase64) {
      try {
        const firmaBase64 = responsiva.FirmaBase64.replace(
          /^data:image\/\w+;base64,/,
          ""
        );

        const firmaBuffer = Buffer.from(firmaBase64, "base64");

        doc.image(firmaBuffer, 190, doc.y, {
          fit: [220, 90]
        });

        doc.y += 95;
      } catch (firmaError) {
        console.error("Error procesando firma:", firmaError.message);
        doc.moveDown(5);
      }
    } else {
      doc.moveDown(5);
    }

    const lineY = doc.y;

    doc
      .moveTo(150, lineY)
      .lineTo(445, lineY)
      .stroke();

    doc.moveDown(0.5);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(responsiva.NombreReceptor || "NOMBRE", {
        align: "center"
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(responsiva.Area || "AREA", {
        align: "center"
      });

    doc.end();

  } catch (error) {
    console.error("ERROR DESCARGANDO PDF:");
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Error descargando responsiva PDF",
        error: error.message
      });
    }
  }
};

const eliminarResponsiva = async (req, res) => {
  try {
    const { id } = req.params;
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

    res.json({
      message: "Responsiva eliminada correctamente"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error eliminando responsiva",
      error: error.message
    });
  }
};

const marcarEquipoDevuelto = async (req, res) => {
  try {
    const { idDetalle } = req.params;
    const { ComentariosDevolucion } = req.body;

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
      return res.status(404).json({
        message: "Detalle de responsiva no encontrado"
      });
    }

    const IdInventario = detalle.recordset[0].IdInventario;
    const IdResponsiva = detalle.recordset[0].IdResponsiva;

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

    res.json({
      message: "Equipo marcado como devuelto"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error marcando devolución",
      error: error.message
    });
  }
};

const obtenerEquiposDisponibles = async (req, res) => {
  try {
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

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo equipos disponibles",
      error: error.message
    });
  }
};

module.exports = {
  crearResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  obtenerResponsivasPorEquipo,
  descargarResponsivaPdf,
  eliminarResponsiva,
  marcarEquipoDevuelto,
  obtenerEquiposDisponibles
};