import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Eye,
  Pencil,
  FileDown,
  Mail
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/InventarioPage.css";

export default function ResponsivasAcciones({
  item,
  onDetalle,
  onEditar,
  onPDF,
  onCorreo
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("responsivas.ver");
  const puedeEditar = tienePermiso("responsivas.editar");
  const puedePDF = tienePermiso("responsivas.pdf");
  const puedeCorreo = tienePermiso("responsivas.correo");

  const tieneAcciones =
    puedeVer ||
    puedeEditar ||
    puedePDF ||
    puedeCorreo;

  useEffect(() => {
    const manejarClickFuera = (event) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target)
      ) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", manejarClickFuera);

    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
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
      document.removeEventListener("keydown", manejarEscape);
    };
  }, []);

  const ejecutarAccion = (accion) => {
    setAbierto(false);
    accion();
  };

  if (!tieneAcciones) {
    return null;
  }

  return (
    <div ref={contenedorRef} className="acciones-menu">
      <button
        type="button"
        className="acciones-menu-trigger"
        title="Acciones"
        aria-label={`Abrir acciones ${item.IdResponsiva}`}
        aria-expanded={abierto}
        onClick={() => setAbierto((prev) => !prev)}
      >
        <MoreVertical size={18} color="white" />
      </button>

      {abierto && (
        <div className="acciones-menu-dropdown">
          {puedeVer && (
            <button
              type="button"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() => onDetalle(item.IdResponsiva))
              }
            >
              <Eye size={16} />
              Ver detalle
            </button>
          )}

          {puedeEditar && (
            <button
              type="button"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() => onEditar(item))
              }
            >
              <Pencil className="icon-p" size={16} />
              Editar
            </button>
          )}

          {puedePDF && (
            <button
              type="button"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() => onPDF(item.IdResponsiva))
              }
            >
              <FileDown className="icon-file" size={16} />
              Descargar PDF
            </button>
          )}

          {puedeCorreo && (
            <button
              type="button"
              className="acciones-menu-item"
              disabled={!item.Correo}
              onClick={() =>
                ejecutarAccion(() => onCorreo(item.IdResponsiva))
              }
            >
              <Mail className="icon-mail" size={16} />
              Reenviar correo
            </button>
          )}
        </div>
      )}
    </div>
  );
}