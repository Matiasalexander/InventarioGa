import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Pencil,
  KeyRound,
  Trash2
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/InventarioPage.css";

export default function UsuariosActions({
  usuario,
  onEditar,
  onPassword,
  onEliminar
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const { tienePermiso } = useAuth();

  const puedeEditar = tienePermiso("usuarios.editar");
  const puedePassword = tienePermiso("usuarios.password");
  const puedeEliminar = tienePermiso("usuarios.eliminar");

  const tieneAcciones =
    puedeEditar ||
    puedePassword ||
    puedeEliminar;

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

    document.addEventListener("keydown", manejarEscape);

    return () =>
      document.removeEventListener(
        "keydown",
        manejarEscape
      );
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
        onClick={() => setAbierto((prev) => !prev)}
      >
        <MoreVertical size={18} color="white" />
      </button>

      {abierto && (
        <div className="acciones-menu-dropdown">

          {puedeEditar && (
            <button
              type="button"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() => onEditar(usuario))
              }
            >
              <Pencil className="icon-p" size={16} />
              Editar
            </button>
          )}

          {puedePassword && (
            <button
              type="button"
              className="acciones-menu-item"
              onClick={() =>
                ejecutarAccion(() =>
                  onPassword(usuario.IdUsuario)
                )
              }
            >
              <KeyRound size={16} />
              Cambiar contraseña
            </button>
          )}

          {puedeEliminar && (
            <>
              <div className="acciones-menu-separador" />

              <button
                type="button"
                className="acciones-menu-item acciones-menu-item-danger"
                onClick={() =>
                  ejecutarAccion(() =>
                    onEliminar(usuario.IdUsuario)
                  )
                }
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