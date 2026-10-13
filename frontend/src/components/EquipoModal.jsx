
import { useRef } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import "../styles/equipoQRModal.css";

function EquipoQRModal({ mostrar, nombreEquipo, onCerrar }) {
  const qrRef = useRef(null);

  if (!mostrar || !nombreEquipo) return null;

  const descargarQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializado = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serializado], {
      type: "image/svg+xml;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const imagen = new Image();

    imagen.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 680;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(imagen, 100, 60, 400, 400);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";

      // El nombre completo permanece dentro del QR.
      // El texto de la etiqueta puede ocupar varias líneas.
      const palabras = nombreEquipo.split(/\s+/);
      const lineas = [""];
      for (const palabra of palabras) {
        const ultima = lineas.length - 1;
        const candidato = `${lineas[ultima]} ${palabra}`.trim();
        if (
          ctx.measureText(candidato).width > 500 &&
          lineas[ultima]
        ) {
          lineas.push(palabra);
        } else {
          lineas[ultima] = candidato;
        }
      }

      lineas.forEach((linea, index) => {
        ctx.fillText(linea, 300, 510 + index * 30, 500);
      });

      canvas.toBlob((png) => {
        URL.revokeObjectURL(url);
        if (!png) return;

        const descarga = URL.createObjectURL(png);
        const enlace = document.createElement("a");
        const archivoSeguro = nombreEquipo
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
          .slice(0, 100);

        enlace.href = descarga;
        enlace.download = `QR_${archivoSeguro}.png`;
        enlace.click();

        setTimeout(() => URL.revokeObjectURL(descarga), 1000);
      }, "image/png");
    };

    imagen.onerror = () => URL.revokeObjectURL(url);
    imagen.src = url;
  };

  return createPortal(
    <div className="mensaje modal-overlay">
      <div className="equipo-qr-modal">
        <h3>Código QR del equipo</h3>
        <div className="equipo-qr-imagen" ref={qrRef}>
          <QRCode
            value={nombreEquipo}
            size={256}
            level="H"
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>

        <strong className="equipo-qr-nombre">
          {nombreEquipo}
        </strong>

        <div className="equipo-qr-acciones">
          <button type="button" className="btn-download" onClick={descargarQR}>
            Descargar PNG
          </button>
          <button type="button" onClick={onCerrar}>
            Finalizar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EquipoQRModal;
