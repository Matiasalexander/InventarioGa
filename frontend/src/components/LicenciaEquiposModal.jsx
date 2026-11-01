
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Monitor, Unlink } from "lucide-react";
import { toast } from "react-toastify";

import {
  obtenerEquiposDeLicencia,
  liberarLicenciaDeEquipo
} from "../services/licenciasService";

export default function LicenciaEquiposModal({
  licencia,
  puedeDesvincular = false,
  onCerrar,
  onActualizado
}) {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(null);

  const idLicencia = licencia?.ID_LICENCIA;
  const gratuita =
    licencia?.TIPO_LICENCIA === "GRATUITA";

  useEffect(() => {
    if (!idLicencia) return;

    let activo = true;

    const cargar = async () => {
      setCargando(true);
      setError("");
      setEquipos([]);

      try {
        const respuesta =
          await obtenerEquiposDeLicencia(idLicencia);

        if (!activo) return;

        setEquipos(
          Array.isArray(respuesta?.equipos)
            ? respuesta.equipos
            : []
        );
      } catch (err) {
        if (!activo) return;

        setError(
          err.response?.data?.message ||
          "No se pudieron consultar los equipos."
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

  const desvincularEquipo = async (equipo) => {
    if (!puedeDesvincular || procesando !== null) {
      return;
    }

    const mensaje = gratuita
      ? "Se desvinculará solamente este equipo. " +
        "La licencia compartida conservará las demás asignaciones."
      : "La licencia comercial quedará OBSOLETA " +
        "después de liberar este equipo.";

    const confirmado = window.confirm(
      `¿Desvincular ${equipo.NOMBRE_EQUIPO}?\n\n${mensaje}`
    );

    if (!confirmado) return;

    setProcesando(equipo.ID_ASIGNACION);

    try {
      await liberarLicenciaDeEquipo(
        idLicencia,
        gratuita ? equipo.ID_EQUIPO : null
      );

      toast.success("Equipo desvinculado correctamente.");

      const respuesta =
        await obtenerEquiposDeLicencia(idLicencia);

      setEquipos(
        Array.isArray(respuesta?.equipos)
          ? respuesta.equipos
          : []
      );

      if (onActualizado) {
        await onActualizado();
      }
    } catch (err) {
      console.error(
        "Error desvinculando equipo:",
        err
      );

      toast.error(
        err.response?.data?.message ||
        "No se pudo completar o verificar la desvinculación."
      );

      try {
        const respuesta =
          await obtenerEquiposDeLicencia(idLicencia);

        setEquipos(
          Array.isArray(respuesta?.equipos)
            ? respuesta.equipos
            : []
        );

        if (onActualizado) {
          await onActualizado();
        }
      } catch (errorRecarga) {
        setError(
          "No se pudo actualizar la lista. " +
          "Cierra y vuelve a abrir el detalle."
        );
      }
    } finally {
      setProcesando(null);
    }
  };

  if (!licencia) return null;

  return createPortal(
    <div className="modal-overlay">
      <div
        className="modal modal-responsiva-editar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="licencia-equipos-titulo"
      >
        <div className="modal-header">
          <div>
            <h2 id="licencia-equipos-titulo">
              Equipos vinculados
            </h2>

            <p>
              {licencia.SOFTWARE} — {licencia.VERSION}
            </p>
          </div>

          <button
            type="button"
            className="usuario-modal-close"
            onClick={onCerrar}
            disabled={procesando !== null}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="responsiva-modal-body">
          {cargando ? (
            <p>Cargando equipos...</p>
          ) : error ? (
            <p role="alert" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          ) : (
            <>
              <p>
                <strong>{equipos.length}</strong>
                {" equipo(s) vinculado(s)"}
              </p>

              {equipos.length === 0 ? (
                <p>
                  Esta licencia no tiene equipos vinculados.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="licencias-tabla">
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>ID</th>
                        <th>Unidad</th>
                        <th>Fecha de asignación</th>
                        {puedeDesvincular && (
                          <th>Acciones</th>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {equipos.map((equipo) => (
                        <tr key={equipo.ID_ASIGNACION}>
                          <td>
                            <Monitor
                              size={15}
                              style={{
                                verticalAlign: "middle",
                                marginRight: 6
                              }}
                            />
                            {equipo.NOMBRE_EQUIPO}
                          </td>

                          <td>{equipo.ID_EQUIPO}</td>

                          <td>{equipo.ID_UNIDAD}</td>

                          <td>
                            {equipo.FECHA_ASIGNACION
                              ? new Date(
                                  equipo.FECHA_ASIGNACION
                                ).toLocaleString("es-MX")
                              : "—"}
                          </td>

                          {puedeDesvincular && (
                            <td>
                              <button
                                type="button"
                                className="licencias-btn-desvincular"
                                onClick={() =>
                                  desvincularEquipo(equipo)
                                }
                                disabled={procesando !== null}
                              >
                                <Unlink size={15} />
                                Desvincular
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="responsiva-modal-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={onCerrar}
            disabled={procesando !== null}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
