
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const logoPath = path.join(
  __dirname,
  "../assets/gandersons-logo.png"
);

const formatearFecha = (valor) => {
  if (!valor) return "Sin registrar";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "Sin registrar";
  }

  return fecha.toLocaleString("es-MX", {
    timeZone: "America/Cancun",
    dateStyle: "long",
    timeStyle: "short"
  });
};

const texto = (valor, alternativo = "N/A") => {
  const resultado = String(valor ?? "").trim();
  return resultado || alternativo;
};

const generarPdfDevolucion = (datos) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
        info: {
          Title: `Comprobante ${datos.folio}`,
          Author: "Grupo Andersons",
          Subject: "Confirmación de devolución de equipo"
        }
      });

      const buffers = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on("error", reject);

      const margen = 50;
      const anchoUtil = doc.page.width - margen * 2;

      // ============================
      // LOGOTIPO INSTITUCIONAL
      // ============================

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 35, {
          width: 120
        });
      }

      doc.y = 130;

      // ============================
      // TÍTULO
      // ============================

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#17365D")
        .text(
          "CARTA DE CONFIRMACIÓN DE DEVOLUCIÓN",
          margen,
          doc.y,
          {
            width: anchoUtil,
            align: "center"
          }
        )
        .moveDown(0.3);

      doc
        .fontSize(13)
        .text(
          "DE EQUIPO DE CÓMPUTO",
          {
            align: "center"
          }
        );

      doc.moveDown(1);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#555555")
        .text(
          `Comprobante: ${texto(datos.folio)}`,
          { align: "center" }
        )
        .text(
          `Responsiva original: ${
            texto(datos.folioResponsiva)
          }`,
          { align: "center" }
        );

      doc.moveDown(2);

      // ============================
      // TEXTO DE CONFIRMACIÓN
      // ============================

      const fechaDevolucion = formatearFecha(
        datos.fechaDevolucion
      );

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#000000")
        .text(
          "Por medio del presente se hace constar que el equipo " +
          "de cómputo descrito a continuación fue registrado " +
          "como devuelto a Grupo Andersons el día ",
          {
            continued: true,
            align: "justify"
          }
        )
        .font("Helvetica-Bold")
        .text(fechaDevolucion, {
          continued: true
        })
        .font("Helvetica")
        .text(
          ", habiendo estado bajo resguardo de ",
          { continued: true }
        )
        .font("Helvetica-Bold")
        .text(
          texto(datos.nombreReceptor),
          { continued: true }
        )
        .font("Helvetica")
        .text(
          ", quien desempeña el puesto de ",
          { continued: true }
        )
        .font("Helvetica-Bold")
        .text(
          texto(datos.puesto),
          { continued: true }
        )
        .font("Helvetica")
        .text(
          " en Grupo Andersons. La devolución queda " +
          "registrada en el sistema de inventario, " +
          "conservando como referencia la responsiva " +
          "de entrega original."
        );

      doc.moveDown(1.5);

      doc
        .font("Helvetica")
        .fontSize(11)
        .text(
          "La descripción del equipo devuelto se " +
          "detalla a continuación:"
        );

      doc.moveDown(1);

      // ============================
      // TABLA DEL EQUIPO
      // ============================

      const startX = margen;
      const tableTop = doc.y;

      // A4 con márgenes de 50:
      // ancho disponible aproximado: 495 pt.
      const columnas = [
        { titulo: "Descripción", clave: "descripcion", ancho: 160 },
        { titulo: "Marca", clave: "marca", ancho: 85 },
        { titulo: "Modelo", clave: "modelo", ancho: 125 },
        { titulo: "Número de Serie", clave: "noSerie", ancho: 125 }
      ];

      const dibujarCelda = (
        valor,
        x,
        y,
        ancho,
        alto,
        encabezado = false
      ) => {
        doc
          .lineWidth(0.7)
          .strokeColor("#9ca3af")
          .rect(x, y, ancho, alto)
          .stroke();

        doc
          .font(
            encabezado
              ? "Helvetica-Bold"
              : "Helvetica"
          )
          .fontSize(encabezado ? 9 : 9.5)
          .fillColor("#000000")
          .text(
            texto(valor),
            x + 6,
            y + 7,
            {
              width: ancho - 12,
              height: alto - 12,
              ellipsis: false
            }
          );
      };

      const valores = [
        datos.descripcion,
        datos.marca,
        datos.modelo,
        datos.noSerie
      ].map(valor => texto(valor));

      // Calcular altura según el contenido para
      // evitar cortar descripciones extensas.
      const alturasTexto = valores.map((valor, i) => {
        doc.font("Helvetica").fontSize(9.5);

        return doc.heightOfString(valor, {
          width: columnas[i].ancho - 12
        });
      });

      const alturaEncabezado = 34;
      const alturaFila = Math.max(
        34,
        ...alturasTexto.map(h => Math.ceil(h) + 14)
      );

      // Mover tabla a otra página si no cabe.
      let y = tableTop;

      if (
        y + alturaEncabezado + alturaFila >
        doc.page.height - 90
      ) {
        doc.addPage();
        y = 60;
      }

      let x = startX;

      columnas.forEach(columna => {
        dibujarCelda(
          columna.titulo,
          x,
          y,
          columna.ancho,
          alturaEncabezado,
          true
        );

        x += columna.ancho;
      });

      y += alturaEncabezado;
      x = startX;

      columnas.forEach((columna, i) => {
        dibujarCelda(
          valores[i],
          x,
          y,
          columna.ancho,
          alturaFila
        );

        x += columna.ancho;
      });

      y += alturaFila;

      doc.y = y + 25;

      // ============================
      // DATOS ADICIONALES
      // ============================

      const escribirDato = (titulo, valor) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`${titulo}: `, {
            continued: true
          })
          .font("Helvetica")
          .text(texto(valor))
          .moveDown(0.5);
      };

      escribirDato(
        "ID de inventario",
        datos.idInventario
      );

      escribirDato(
        "Fecha de devolución",
        fechaDevolucion
      );

      escribirDato(
        "Área",
        datos.area
      );

      // ============================
      // OBSERVACIONES
      // ============================

      if (doc.y > doc.page.height - 170) {
        doc.addPage();
        doc.y = 60;
      }

      doc.moveDown(1);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("OBSERVACIONES DE DEVOLUCIÓN");

      doc.moveDown(0.5);

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          texto(
            datos.comentarios,
            "Sin observaciones registradas."
          ),
          {
            align: "justify"
          }
        );

      doc.moveDown(2);

      // ============================
      // REFERENCIA DEL RESPONSABLE
      // ============================

      if (doc.y > doc.page.height - 150) {
        doc.addPage();
        doc.y = 90;
      }

      const centro = doc.page.width / 2;
      const anchoFirma = 300;

      const lineaY = doc.y + 40;

      doc
        .moveTo(centro - 145, lineaY)
        .lineTo(centro + 145, lineaY)
        .lineWidth(0.8)
        .strokeColor("#000000")
        .stroke();

      doc.y = lineaY + 8;

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
          texto(datos.nombreReceptor, "NOMBRE"),
          centro - anchoFirma / 2,
          doc.y,
          {
            width: anchoFirma,
            align: "center"
          }
        );

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          texto(datos.area, "ÁREA"),
          centro - anchoFirma / 2,
          doc.y,
          {
            width: anchoFirma,
            align: "center"
          }
        );

      doc.moveDown(0.5);

      doc
        .fontSize(8)
        .fillColor("#6b7280")
        .text(
          "Referencia del responsable de la responsiva original",
          margen,
          doc.y,
          {
            width: anchoUtil,
            align: "center"
          }
        );

      // ============================
      // NOTA DE CONTROL
      // ============================

      doc.moveDown(2);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#555555")
        .text(
          "Este documento confirma el registro de devolución " +
          "del equipo indicado en el sistema de Inventario GA2. " +
          "No representa una firma de recepción, salvo que " +
          "se adjunte una constancia de entrega y recepción " +
          "firmada por las partes correspondientes.",
          {
            align: "justify"
          }
        );

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generarPdfDevolucion;
