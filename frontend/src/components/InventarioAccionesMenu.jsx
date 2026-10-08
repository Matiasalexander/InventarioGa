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
  onEliminar,
  tieneResponsivaActiva,
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  // Determina si el equipo tiene una responsiva activa.
  // RESPONSIVA_DIGITAL puede llegar como string "1".
  const responsivaActiva =
    Number(item.RESPONSIVA_DIGITAL) === 1 ||
    tieneResponsivaActiva === true;

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
        <MoreVertical
          className="icon-more"
          size={18}
          color="white"
        />
      </button>

      {abierto && (
        <div className="acciones-menu-dropdown">

          {/* VER DETALLES */}
          <button
            type="button"
            className="acciones-menu-item"
            onClick={() =>
              ejecutarAccion(() => onDetalle(item.id))
            }
          >
            <Eye
              className="icon-menu"
              size={16}
            />
            Ver detalles
          </button>

          {/* EDITAR */}
          {puedeEditar && (
            <button
              type="button"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() => onEditar(item.id))
              }
            >
              <Pencil
                className="icon-p"
                size={16}
              />
              Editar
            </button>
          )}

          {/* ELIMINAR */}
          {puedeEliminar && (
            <>
              <div className="acciones-menu-separador" />

              <button
                type="button"
                className={`acciones-menu-item acciones-menu-item-danger ${
                  responsivaActiva
                    ? "acciones-menu-item-disabled"
                    : ""
                }`}
                disabled={responsivaActiva}
                title={
                  responsivaActiva
                    ? "No se puede eliminar un equipo con una responsiva activa"
                    : "Eliminar equipo"
                }
                onClick={() => {
                  if (responsivaActiva) {
                    return;
                  }

                  ejecutarAccion(() =>
                    onEliminar(item.id)
                  );
                }}
              >
                <Trash2
                  className="icon-trash"
                  size={16}
                />

                Eliminar
              </button>
            </>
          )}

        </div>
      )}
    </div>
  );
}