import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2
} from "lucide-react";

export default function InventarioAccionesMenu({
  item,
  puedeEditar,
  puedeEliminar,
  onDetalle,
  onEditar,
  onEliminar
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  // NUEVO:
  // Cierra el menú cuando se hace clic fuera.
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

  // NUEVO:
  // Cierra el menú al presionar Escape.
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

  return (
    <div
      ref={contenedorRef}
      className="acciones-menu"
    >
      <button
        type="button"
        className="acciones-menu-trigger"
        title="Acciones"
        aria-label={`Abrir acciones del equipo ${item.NOMBRE_EQUIPO || item.id}`}
        aria-expanded={abierto}
        onClick={() => setAbierto((prev) => !prev)}
      >
        <MoreVertical className="icon-more"  size={18} color="white"/>
      </button>

      {abierto && (
        <div className="acciones-menu-dropdown">
          <button
            type="button"
            className="acciones-menu-item"
            onClick={() =>
              ejecutarAccion(() => onDetalle(item.id))
            }
          >
            <Eye className="icon-menu" size={16}/>
            Ver detalles
          </button>

          {puedeEditar && (
            <button
              type="button"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() => onEditar(item.id))
              }
            >
              <Pencil className="icon-p" size={16}/>
              Editar
            </button>
          )}

          {puedeEliminar && (
            <>
              <div className="acciones-menu-separador" />

              <button
                type="button"
                className="acciones-menu-item acciones-menu-item-danger"
                onClick={() =>
                  ejecutarAccion(() => onEliminar(item.id))
                }
              >
                <Trash2 className="icon-trash" size={16} />
                Eliminar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}