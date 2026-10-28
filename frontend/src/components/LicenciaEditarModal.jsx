
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";

import {
  obtenerDetalleLicencia,
  actualizarLicencia
} from "../services/licenciasService";

import "../styles/LicenciaDetalleModal.css";

export default function LicenciaEditarModal({
  idLicencia,
  onCerrar,
  onGuardado
}) {
  const [formulario, setFormulario] = useState({
    SOFTWARE: "",
    VERSION: "",
    COMENTARIOS: ""
  });

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!idLicencia) return;

    let activo = true;

    const cargar = async () => {
      setCargando(true);
      setError("");

      try {
        const respuesta =
          await obtenerDetalleLicencia(idLicencia);

        if (!activo) return;

        if (!respuesta?.licencia) {
          throw new Error("No se encontró la licencia.");
        }

        setFormulario({
          SOFTWARE: respuesta.licencia.SOFTWARE ?? "",
          VERSION: respuesta.licencia.VERSION ?? "",
          COMENTARIOS: respuesta.licencia.COMENTARIOS ?? ""
        });
      } catch (err) {
        if (!activo) return;

        setError(
          err.response?.data?.message ||
          err.message ||
          "No fue posible cargar la licencia."
        );
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [idLicencia]);

  const guardar = async (e) => {
    e.preventDefault();

    if (guardando || cargando || error) return;

    try {
      setGuardando(true);

      await actualizarLicencia(idLicencia, formulario);

      toast.success("Licencia actualizada correctamente.");

      await onGuardado?.();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        "No fue posible actualizar la licencia."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!idLicencia) return null;

  return createPortal(
    <div className="usuario-modal-overlay">
        
      <section
        className="usuario-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-editar-licencia"
      >
        
        <header className="usuario-modal-header">
          <h2 id="titulo-editar-licencia">
            Editar licencia
          </h2>
             <button
        className="usuario-modal-close"
        onClick={onCerrar}
      >
        X
      </button>
        </header>


        <form onSubmit={guardar}>
          <div className="usuario-modal-form">
            {cargando ? (
              <p>Cargando datos...</p>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : (
              <div className="usuario-form-grid">
                
                <label className="campo">
                  Software
                  <input
                    name="SOFTWARE"
                    value={formulario.SOFTWARE}
                    onChange={(e) =>
                      setFormulario(actual => ({
                        ...actual,
                        SOFTWARE: e.target.value
                      }))
                    }
                    required
                  />
                </label>

                <label className="campo">
                  Versión
                  <input
                    name="VERSION"
                    value={formulario.VERSION}
                    onChange={(e) =>
                      setFormulario(actual => ({
                        ...actual,
                        VERSION: e.target.value
                      }))
                    }
                    required
                  />
                </label>

                <label
                  className="campo-form"
                  style={{ gridColumn: "1 / -1" }}
                >
                  Comentarios
                  <textarea
                    name="COMENTARIOS"
                    value={formulario.COMENTARIOS}
                    onChange={(e) =>
                      setFormulario(actual => ({
                        ...actual,
                        COMENTARIOS: e.target.value
                      }))
                    }
                    rows={4}
                  />
                </label>
              </div>
            )}
          </div>

          <footer className="licencia-detalle-footer">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="btn-cancelar"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={cargando || guardando || Boolean(error)}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body
  );
}
