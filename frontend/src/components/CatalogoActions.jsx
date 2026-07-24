import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Pencil,
  Trash2
} from "lucide-react";

import "../styles/InventarioPage.css";

export default function CatalogoActions({
  item,
  onEditar,
  onEliminar
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const puedeEditar =
    typeof onEditar === "function";

  const puedeEliminar =
    typeof onEliminar === "function";

  const tieneAcciones =
    puedeEditar || puedeEliminar;

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

    return () =>
      document.removeEventListener(
        "mousedown",
        manejarClickFuera
      );
  }, []);

  useEffect(() => {
    const manejarEscape = (event) => {
      if (event.key === "Escape") {
        setAbierto(false);
      }
    };

    document.addEventListener(
      "keydown",
      manejarEscape
    );

    return () =>
      document.removeEventListener(
        "keydown",
        manejarEscape
      );
  }, []);

  const ejecutarAccion = (accion) => {
    setAbierto(false);

    if (typeof accion === "function") {
      accion();
    }
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
        onClick={() =>
          setAbierto((prev) => !prev)
        }
        aria-label="Abrir acciones"
        aria-expanded={abierto}
      >
        <MoreVertical
          size={18}
          color="white"
        />
      </button>

      {abierto && (
        <div className="acciones-menu-dropdown">
          {puedeEditar && (
            <button
              type="button"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() =>
                  onEditar(item)
                )
              }
            >
              <Pencil
                className="icon-p"
                size={16}
              />

              Editar
            </button>
          )}

          {puedeEditar && puedeEliminar && (
            <div className="acciones-menu-separador" />
          )}

          {puedeEliminar && (
            <button
              type="button"
              className="acciones-menu-item acciones-menu-item-danger"
              onClick={() =>
                ejecutarAccion(() =>
                  onEliminar(item.id)
                )
              }
            >
              <Trash2
                className="icon-trash"
                size={16}
              />

              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}