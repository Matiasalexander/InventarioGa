
import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Eye,
  Unlink
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/InventarioPage.css";

export default function LicenciasAcciones({
  item,
  onDetalle,
  onDesvincular,
  procesando = false
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("licencias.ver");
  const puedeDesvincular =
    tienePermiso("licencias.asignar") &&
    item.ESTADO === "EN_USO";

  const tieneAcciones =
    puedeVer || puedeDesvincular;

  useEffect(() => {
    const manejarClickFuera = (event) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target)
      ) {
        setAbierto(false);
      }
    };

    document.addEventListener(
      "mousedown",
      manejarClickFuera
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        manejarClickFuera
      );
    };
  }, []);

  useEffect(() => {
    const manejarEscape = (event) => {
      if (event.key === "Escape") {
        setAbierto(false);
      }
    };

    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        manejarEscape
      );
    };
  }, []);

  useEffect(() => {
    if (procesando) {
      setAbierto(false);
    }
  }, [procesando]);

  const ejecutarAccion = (accion) => {
    if (procesando) return;

    setAbierto(false);
    accion();
  };

  if (!tieneAcciones) {
    return null;
  }

  return (
    <div
      ref={contenedorRef}
      className="acciones-menu"
    >
      <button
        type="button"
        className="acciones-menu-trigger"
        title="Acciones de licencia"
        aria-label={
          `Abrir acciones de licencia ${item.ID_LICENCIA}`
        }
        aria-expanded={abierto}
        aria-haspopup="menu"
        disabled={procesando}
        onClick={() =>
          setAbierto(actual => !actual)
        }
      >
        <MoreVertical size={18} />
      </button>

      {abierto && (
        <div
          className="acciones-menu-dropdown"
          role="menu"
        >
          {puedeVer && (
            <button
              type="button"
              role="menuitem"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() =>
                  onDetalle(item.ID_LICENCIA)
                )
              }
            >
              <Eye size={16} />
              Ver detalle
            </button>
          )}

          {puedeDesvincular && (
            <button
              type="button"
              role="menuitem"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() =>
                  onDesvincular(item)
                )
              }
            >
              <Unlink size={16} color="red" />
              Desvincular
            </button>
          )}
        </div>
      )}
    </div>
  );
}
