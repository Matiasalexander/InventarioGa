const transporter = require("../config/mailer");

const escaparHtml = (valor = "") =>
  String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const enviarCorreoNuevoUsuario = async ({
  correo,
  nombre,
  passwordTemporal,
  rol
}) => {
  const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:5173";

  await transporter.sendMail({
    from: `"Inventario GA" <${process.env.SMTP_USER}>`,
    to: correo,
    subject: "Accesos a Inventario GA",
    html: `
      <div style="font-family: Arial, sans-serif; color: #1e293b;">
        <h2>Bienvenido a Inventario GA</h2>

        <p>
          Hola <strong>${escaparHtml(nombre)}</strong>,
          tu usuario fue creado correctamente.
        </p>

        <div style="
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
        ">
          <p>
            <strong>Usuario:</strong>
            ${escaparHtml(correo)}
          </p>

          <p>
            <strong>Contraseña temporal:</strong>
            ${escaparHtml(passwordTemporal)}
          </p>

          <p>
            <strong>Rol:</strong>
            ${escaparHtml(rol)}
          </p>
        </div>

        <p>
          <a
            href="${frontendUrl}"
            style="
              display: inline-block;
              background: #4f46e5;
              color: white;
              text-decoration: none;
              padding: 10px 16px;
              border-radius: 6px;
            "
          >
            Ingresar a Inventario GA
          </a>
        </p>

        <p>
          Por seguridad, deberás cambiar tu contraseña al iniciar sesión.
        </p>

        <p style="font-size: 12px; color: #64748b;">
          Este correo fue generado automáticamente por Inventario GA.
        </p>
      </div>
    `
  });
};

module.exports = enviarCorreoNuevoUsuario;