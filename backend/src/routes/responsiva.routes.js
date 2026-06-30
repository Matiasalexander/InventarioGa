const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const {
  crearResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  obtenerResponsivasPorEquipo,
  eliminarResponsiva,
  marcarEquipoDevuelto,
  obtenerEquiposDisponibles,
  descargarResponsivaPdf
} = require("../controllers/responsiva.controller");

const router = express.Router();

const logoPath = path.join(__dirname, "../assets/gandersons-logo.png");

/* ==========================
   CRUD RESPONSIVAS
========================== */

router.get("/", obtenerResponsivas);

router.post("/", crearResponsiva);

router.get("/equipos/disponibles", obtenerEquiposDisponibles);

router.get("/equipo/:idInventario/historial", obtenerResponsivasPorEquipo);

router.put("/detalle/:idDetalle/devolver", marcarEquipoDevuelto);

router.get("/:id/pdf", descargarResponsivaPdf);

/* ==========================
   GENERAR PDF NUEVA RESPONSIVA
========================== */

router.post("/pdf", async (req, res) => {
  try {
    const {
      fecha,
      nombreReceptor,
      puesto,
      area,
      firma,
      equipos = []
    } = req.body;

    const doc = new PDFDocument({
      size: "A4",
      margin: 50
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=responsiva.pdf"
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
      .text(fecha || "FECHA", {
        continued: true
      })
      .font("Helvetica")
      .text(" y que está bajo resguardo de ", {
        continued: true
      })
      .font("Helvetica-Bold")
      .text(nombreReceptor || "NOMBRE RECEPTOR", {
        continued: true
      })
      .font("Helvetica")
      .text(", quien se desempeña en el puesto ", {
        continued: true
      })
      .font("Helvetica-Bold")
      .text(puesto || "PUESTO", {
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

    if (firma) {
      try {
        const firmaBase64 = firma.replace(/^data:image\/png;base64,/, "");
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
      .text(nombreReceptor || "NOMBRE", {
        align: "center"
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(area || "AREA", {
        align: "center"
      });

    doc.end();

  } catch (error) {
    console.error("ERROR GENERANDO PDF:");
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
});

/* ==========================
   RUTAS CON ID AL FINAL
========================== */

router.get("/:id", obtenerResponsivaPorId);

router.delete("/:id", eliminarResponsiva);

module.exports = router;