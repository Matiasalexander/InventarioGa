import { createPortal } from "react-dom";
import "../styles/mensajeModal.css";

function MensajeModal({
  mostrar,
  tipo = "info",
  titulo = "",
  mensaje = "",
  onCerrar,
  mostrarOpcionQR = false,
  onGenerarQR,
  onFinalizar,
}) {
  if (!mostrar) return null;

  return createPortal(
    <div className="mensaje modal-overlay">
      <div
        className={`mensaje-modal ${tipo}`}
        role="alertdialog"
        aria-modal="true"
        aria-label={titulo || "Mensaje del sistema"}
      >
        <div className="mensaje-modal-icon" aria-hidden="true">
          {tipo === "success" && "✓"}
          {tipo === "warning" && "!"}
          {tipo === "error" && "×"}
          {tipo === "info" && "i"}
        </div>

        <h4>{titulo}</h4>
        <p>{mensaje}</p>

        {mostrarOpcionQR && tipo === "success" ? (
          <div className="mensaje-modal-acciones">
            <button
              type="button"
              className="btn-generate"
              onClick={onGenerarQR}
              title="Generación de QR disponible próximamente"
            >
              Generar QR
            </button>
            <button
              type="button"
              className="btn-cancelar"
              onClick={onFinalizar}
            >
             Cerrar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mensaje-modal-btn"
            onClick={onCerrar}
          >
            Aceptar
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export default MensajeModal;
