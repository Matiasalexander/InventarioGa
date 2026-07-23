const transporter = require("../config/mailer");

const enviarCorreoResponsiva = async ({
  correo,
  nombre,
  folio,
  pdfBuffer
}) => {
  if (!correo) return null;
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "Existe" : "No existe");
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: correo,
    subject: `Responsiva de Equipo - ${folio}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Responsiva de equipo</h2>
        <p>Hola <strong>${nombre || ""}</strong>,</p>
        <p>Se ha generado correctamente tu responsiva de equipo.</p>
        <p>Adjunto encontrarás una copia en formato PDF para tu resguardo.</p>
        <br/>
        <p>Saludos,</p>
        <p><strong>Grupo Anderson's</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `${folio}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });
};

module.exports = enviarCorreoResponsiva;