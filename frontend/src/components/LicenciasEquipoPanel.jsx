
import { useEffect, useState } from "react";
import { obtenerLicenciasPorEquipo } from "../services/licenciasService";

import "../styles/LicenciasEquipoPanel.css";

function LicenciasEquipoPanel({ idEquipo }) {
  const [licencias, setLicencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [sinPermiso, setSinPermiso] = useState(false);
  const [recarga, setRecarga] = useState(0);

  
  useEffect(() => {
    let activo = true;

    const cargarLicencias = async () => {
      setCargando(true);
      setError("");
      setSinPermiso(false);
      setLicencias([]);

      const idValido =
        Number.isSafeInteger(Number(idEquipo)) &&
        Number(idEquipo) > 0;

      if (!idValido) {
        if (activo) {
          setError("No se recibió un identificador de equipo válido.");
          setCargando(false);
        }
        return;
      }

      try {
        const respuesta = await obtenerLicenciasPorEquipo(idEquipo);

        if (!activo) return;

        if (!Array.isArray(respuesta?.licencias)) {
          throw new Error(
            "La API devolvió un formato de licencias inválido."
          );
        }

        setLicencias(respuesta.licencias);
      } catch (err) {
        if (!activo) return;

        if ([401, 403].includes(err.response?.status)) {
          setSinPermiso(true);
        } else {
          setError(
            err.response?.data?.message ||
            "No fue posible consultar las licencias del equipo."
          );
        }

        console.error("Error cargando licencias del equipo:", err);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarLicencias();

    return () => {
      activo = false;
    };
  }, [idEquipo, recarga]);

  if (sinPermiso) {
    return null;
  }

  return (
    <section className="card">
      <div className="licencias-equipo-header">
        <div>
          <h3>Licencias de software</h3>
          <p>Licencias actualmente asignadas a este equipo.</p>
        </div>

        {!cargando && !error && (
          <span className="badge badge-en-uso">
            {licencias.length} asignada(s)
          </span>
        )}
      </div>

      {cargando && (
        <p role="status">Cargando licencias...</p>
      )}

      {error && !cargando && (
        <div role="alert" className="licencias-equipo-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRecarga(actual => actual + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && licencias.length === 0 && (
        <p className="licencias-equipo-vacio">
          Este equipo no tiene licencias de software asignadas.
        </p>
      )}

      {!cargando && !error && licencias.length > 0 && (
        <div className="licencias-equipo-lista">
          {licencias.map(licencia => (
            <article
              className="licencias-equipo-item"
              key={licencia.ID_LICENCIA}
            >
              <div className="licencias-equipo-item-header">
                <strong>
                  {licencia.SOFTWARE} — {licencia.VERSION}
                </strong>

                <span className="badge badge-en-uso">
                  En uso
                </span>
              </div>

              <dl className="licencias-equipo-datos">
                <div>
                  <dt>Tipo de licencia</dt>
                  <dd>{licencia.TIPO_LICENCIA || "No especificado"}</dd>
                </div>

                <div>
                  <dt>Fecha de activación</dt>
                  <dd>
                    {licencia.FECHA_ACTIVACION
                      ? String(licencia.FECHA_ACTIVACION).slice(0, 10)
                      : "Sin registrar"}
                  </dd>
                </div>

                <div>
                  <dt>Fecha de asignación</dt>
                  <dd>
                    {licencia.FECHA_ASIGNACION
                      ? new Date(
                          licencia.FECHA_ASIGNACION
                        ).toLocaleString("es-MX")
                      : "Sin registrar"}
                  </dd>
                </div>
              </dl>
{/*
              <div>
                <dt>Comentarios licencia:</dt>
                {licencia.COMENTARIOS && (
                <p className="licencias-equipo-comentario">
                  {licencia.COMENTARIOS}
                </p>
              )}
              </div>*/}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default LicenciasEquipoPanel;
