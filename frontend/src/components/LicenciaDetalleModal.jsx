
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  KeyRound,
  Monitor,
  CalendarDays,
  RefreshCw
} from "lucide-react";

import { obtenerDetalleLicencia, obtenerEquiposDeLicencia } from "../services/licenciasService";
import "../styles/LicenciaDetalleModal.css";

const formatearFecha = (valor) => {
  if (!valor) return "Sin registrar";
  return String(valor).split("T")[0];
};

const formatearFechaHora = (valor) => {
  if (!valor) return "Sin registrar";

  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime())
    ? "Fecha inválida"
    : fecha.toLocaleString("es-MX");
};

const etiquetaCampo = (nombre) => {
  return String(nombre)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, letra => letra.toUpperCase());
};

const mostrarValor = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin registrar";
  }

  if (typeof valor === "boolean") {
    return valor ? "Sí" : "No";
  }

  if (typeof valor === "object") {
    return JSON.stringify(valor, null, 2);
  }

  return String(valor);
};

const interpretarConfiguracion = (valor) => {
  if (!valor) return {};

  if (typeof valor === "object") {
    return valor;
  }

  try {
    const resultado = JSON.parse(valor);

    return resultado &&
      typeof resultado === "object" &&
      !Array.isArray(resultado)
      ? resultado
      : { valor: resultado };
  } catch {
    return { configuracionOriginal: valor };
  }
};

function CampoDetalle({ titulo, valor }) {
  return (
    <div className="licencia-detalle-campo">
      <span>{titulo}</span>
      <strong>{mostrarValor(valor)}</strong>
    </div>
  );
}

export default function LicenciaDetalleModal({
  idLicencia,
  onCerrar
}) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [equiposVinculados, setEquiposVinculados] = useState([]);
const [cargandoEquipos, setCargandoEquipos] = useState(false);
const [errorEquipos, setErrorEquipos] = useState("");

  useEffect(() => {
    if (!idLicencia) return;

    let activo = true;

    const cargarDetalle = async () => {
      setCargando(true);
      setError("");
      setDetalle(null);

      try {
        const respuesta =
          await obtenerDetalleLicencia(idLicencia);

        if (!activo) return;

        if (!respuesta?.licencia) {
          throw new Error(
            "La API no devolvió información de la licencia."
          );
        }

        setDetalle(respuesta);
      } catch (err) {
        if (!activo) return;

        console.error(
          "Error consultando detalle de licencia:",
          err
        );

        setError(
          err.response?.data?.message ||
          err.message ||
          "No fue posible consultar la licencia."
        );
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDetalle();

    return () => {
      activo = false;
    };
  }, [idLicencia, recarga]);

  
useEffect(() => {
  if (!idLicencia) {
    setEquiposVinculados([]);
    return;
  }

  let activo = true;

  const cargarEquipos = async () => {
    setCargandoEquipos(true);
    setErrorEquipos("");
    setEquiposVinculados([]);

    try {
      const respuesta = await obtenerEquiposDeLicencia(
        idLicencia
      );

      if (!activo) return;

      if (!Array.isArray(respuesta?.equipos)) {
        throw new Error(
          "La API no devolvió una lista válida de equipos."
        );
      }

      setEquiposVinculados(respuesta.equipos);
    } catch (error) {
      if (!activo) return;

      console.error(
        "Error consultando equipos vinculados:",
        error
      );

      setErrorEquipos(
        error.response?.data?.message ||
        error.message ||
        "No fue posible consultar los equipos vinculados."
      );
    } finally {
      if (activo) {
        setCargandoEquipos(false);
      }
    }
  };

  cargarEquipos();

  return () => {
    activo = false;
  };
}, [idLicencia, recarga]);


  useEffect(() => {
    if (!idLicencia) return;

    const manejarTecla = (event) => {
      if (event.key === "Escape") {
        onCerrar();
      }
    };

    window.addEventListener("keydown", manejarTecla);

    return () => {
      window.removeEventListener("keydown", manejarTecla);
    };
  }, [idLicencia, onCerrar]);

  if (!idLicencia) return null;

  const licencia = detalle?.licencia;
  const asignacion = detalle?.asignacionActual;
  const esLicenciaGratuita = String(licencia?.TIPO_LICENCIA ?? "")
  .trim()
  .toUpperCase()==="GRATUITA";

  const configuracion = interpretarConfiguracion(
    licencia?.CONFIGURACION
  );

  const camposConfiguracion =
    Object.entries(configuracion);

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCerrar();
        }
      }}
    >
      <section
        className="modal modal-responsiva-editar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="licencia-detalle-titulo"
      >
        <header className="licencia-detalle-header">
          <div className="licencia-detalle-heading">
            <div>
              <h2 id="licencia-detalle-titulo">
                Detalle de licencia
              </h2>
              <p>Información y asignación actual</p>
            </div>
          </div>

          <button

            className="usuario-modal-close"
            onClick={onCerrar}
            aria-label="Cerrar detalles"
          >
           X
          </button>
        </header>

        <div className="licencia-detalle-contenido">
          {cargando && (
            <div className="licencia-detalle-mensaje">
              Consultando información de licencia...
            </div>
          )}

          {error && !cargando && (
            <div
              className="licencia-detalle-error"
              role="alert"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  setRecarga(actual => actual + 1)
                }
              >
                <RefreshCw size={16} />
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && licencia && (
            <>
              <div className="licencia-detalle-resumen">
                <div>
                  <h3>{licencia.SOFTWARE}</h3>
                  <p>
                    Versión {licencia.VERSION}
                  </p>
                </div>

                <span
                  className={
                    `licencia-detalle-estado ${licencia.ESTADO}`
                  }
                >
                  {licencia.ESTADO === "EN_USO"
                    ? "En uso"
                    : licencia.ESTADO === "OBSOLETA"
                      ? "Obsoleta"
                      : "Disponible"}
                </span>
              </div>

              <div className="licencia-detalle-seccion">
                <h3>
                  Información general
                </h3>

                <div className="licencia-detalle-grid">
                  <CampoDetalle
                    titulo="Tipo de licencia"
                    valor={licencia.TIPO_LICENCIA}
                  />
                  <CampoDetalle
                    titulo="Fecha de activación"
                    valor={formatearFecha(
                      licencia.FECHA_ACTIVACION
                    )}
                  />
                  <CampoDetalle
                    titulo="Fecha de registro"
                    valor={formatearFechaHora(
                      licencia.FECHA_REGISTRO
                    )}
                  />
                  {licencia.ACTIVADOR != null && (
                    <CampoDetalle
                      titulo="Método de activación"
                      valor={licencia.ACTIVADOR}
                    />
                  )}
                  {licencia.DESCRIPCION_TIPO && (
                    <CampoDetalle
                      titulo="Descripción del tipo"
                      valor={licencia.DESCRIPCION_TIPO}
                    />
                  )}
                </div>
              </div>

             
<div className="licencia-detalle-seccion">
  <h3>
    {esLicenciaGratuita
      ? "Equipos vinculados"
      : "Asignación actual"}
  </h3>

  {esLicenciaGratuita ? (
    <>
      {cargandoEquipos ? (
        <p className="licencia-detalle-sin-asignacion">
          Consultando equipos vinculados...
        </p>
      ) : errorEquipos ? (
        <div
          className="licencia-detalle-error"
          role="alert"
        >
          <p>{errorEquipos}</p>

          <button
            type="button"
            onClick={() =>
              setRecarga((actual) => actual + 1)
            }
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      ) : equiposVinculados.length === 0 ? (
        <p className="licencia-detalle-sin-asignacion">
          Esta licencia gratuita no tiene
          equipos vinculados actualmente.
        </p>
      ) : (
        <>
          <p className="licencia-detalle-equipos-total">
            <strong>
              {equiposVinculados.length}
            </strong>
            {" equipo(s) vinculado(s)"}
          </p>

          <div className="licencia-detalle-equipos-contenedor">
            <table className="licencia-detalle-equipos-tabla">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>ID equipo</th>
                  <th>Unidad</th>
                  <th>Fecha de asignación</th>
                </tr>
              </thead>

              <tbody>
                {equiposVinculados.map((equipo) => (
                  <tr
                    key={
                      equipo.ID_ASIGNACION ??
                      equipo.ID_EQUIPO
                    }
                  >
                    <td>
                      <span className="licencia-detalle-equipo-nombre">
                        {equipo.NOMBRE_EQUIPO ||
                          "Sin nombre"}
                      </span>
                    </td>

                    <td>
                      {equipo.ID_EQUIPO ?? "—"}
                    </td>

                    <td>
                      {equipo.ID_UNIDAD ?? "—"}
                    </td>

                    <td>
                      {formatearFechaHora(
                        equipo.FECHA_ASIGNACION
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  ) : asignacion ? (
    <div className="licencia-detalle-grid">
      <CampoDetalle
        titulo="Equipo"
        valor={asignacion.NOMBRE_EQUIPO}
      />

      <CampoDetalle
        titulo="ID de equipo"
        valor={asignacion.ID_EQUIPO}
      />

      <CampoDetalle
        titulo="ID de unidad"
        valor={asignacion.ID_UNIDAD}
      />

      <CampoDetalle
        titulo="Fecha de asignación"
        valor={formatearFechaHora(
          asignacion.FECHA_ASIGNACION
        )}
      />
    </div>
  ) : (
    <p className="licencia-detalle-sin-asignacion">
      Esta licencia no tiene una asignación activa.
    </p>
  )}
</div>


              <div className="licencia-detalle-seccion">
                <h3>
                  Configuración de licencia
                </h3>

                {camposConfiguracion.length === 0 ? (
                  <p>No se registró configuración adicional.</p>
                ) : (
                  <div className="licencia-detalle-grid">
                    {camposConfiguracion.map(([campo, valor]) => (
                      <CampoDetalle
                        key={campo}
                        titulo={etiquetaCampo(campo)}
                        valor={valor}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="licencia-detalle-seccion">
                <h3>Comentarios</h3>
                <p className="licencia-detalle-comentarios">
                  {licencia.COMENTARIOS ||
                    "Sin comentarios registrados."}
                </p>
              </div>

              {licencia.ESTADO === "OBSOLETA" && (
                <p className="licencia-detalle-advertencia">
                  Esta licencia se encuentra obsoleta.
                  No está disponible para nuevas asignaciones.
                  Sus asignaciones anteriores permanecen
                  registradas en el historial.
                </p>
              )}
            </>
          )}
        </div>

        <footer className="licencia-detalle-footer">
          <button
            type="button"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}
