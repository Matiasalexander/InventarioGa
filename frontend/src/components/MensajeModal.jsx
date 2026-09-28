import { createPortal } from "react-dom";
import "../styles/mensajeModal.css";

function MensajeModal({
    mostrar,
    tipo = "info",
    titulo = "",
    mensaje = "",
    onCerrar
}) {
    if (!mostrar) return null;

    return createPortal(
        <div className="mensaje modal-overlay">
            <div className={`mensaje-modal ${tipo}`}>
                <div className="mensaje-modal-icon">
       {tipo === "success" && "✓"}
          {tipo === "warning" && "!"}
          {tipo === "error" && "×"}
          {tipo === "info" && "i"}
                </div>

                <h4>{titulo}</h4>
                <p>{mensaje}</p>
                <button
                type="button"
                className="mensaje-modal-btn"
                onClick={onCerrar}
                >
                    Aceptar
                </button>    
            </div>
        </div>, document.body
    );
}

export default MensajeModal;