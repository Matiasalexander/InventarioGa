
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";

import {
  obtenerDetalleLicencia,
  actualizarLicencia
} from "../services/licenciasService";

import "../styles/LicenciaDetalleModal.css";

const estadoInicial = {
  SOFTWARE: "",
  VERSION: "",
  ACTIVADOR: "",
  COMENTARIOS: "",
  CONFIGURACION: {}
};

const interpretarConfiguracion = (valor) => {
  if (!valor) return {};

  if (typeof valor === "object" && !Array.isArray(valor)) {
    return valor;
  }

  try {
    const objeto = JSON.parse(valor);

    return objeto &&
      typeof objeto === "object" &&
      !Array.isArray(objeto)
      ? objeto
      : {};
  } catch {
    throw new Error(
      "La configuración guardada no contiene un JSON válido."
    );
  }
};

const etiquetaCampo = (campo) =>
  String(campo)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());

const valorEnInput = (valor) => {
  if (valor == null) return "";

  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }

  return String(valor);
};

export default function LicenciaEditarModal({
  idLicencia,
  onCerrar,
  onGuardado
}) {
  const [formulario, setFormulario] = useState(
    estadoInicial
  );

  const [tiposOriginales, setTiposOriginales] =
    useState({});

  const [puedeEditarActivador, setPuedeEditarActivador] =
    useState(false);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errorConfiguracion, setErrorConfiguracion] =
    useState("");

  useEffect(() => {
    if (!idLicencia) return;

    let activo = true;

    const cargar = async () => {
      setCargando(true);
      setError("");
      setErrorConfiguracion("");
      setFormulario(estadoInicial);
      setTiposOriginales({});
      setPuedeEditarActivador(false);

      try {
        const respuesta =
          await obtenerDetalleLicencia(idLicencia);

        if (!activo) return;

        if (!respuesta?.licencia) {
          throw new Error(
            "No se encontró la licencia."
          );
        }

        const licencia = respuesta.licencia;

        const configuracion =
          interpretarConfiguracion(
            licencia.CONFIGURACION
          );

        setTiposOriginales(
          Object.fromEntries(
            Object.entries(configuracion).map(
              ([clave, valor]) => [
                clave,
                valor === null
                  ? "null"
                  : Array.isArray(valor)
                    ? "array"
                    : typeof valor
              ]
            )
          )
        );

        // Este indicador debe venir del backend.
        const permitido =
          licencia.PUEDE_EDITAR_ACTIVADOR === true;

        setPuedeEditarActivador(permitido);

        setFormulario({
          SOFTWARE: licencia.SOFTWARE ?? "",
          VERSION: licencia.VERSION ?? "",
          ACTIVADOR: permitido
            ? licencia.ACTIVADOR ?? ""
            : "",
          COMENTARIOS: licencia.COMENTARIOS ?? "",
          CONFIGURACION: configuracion
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

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor
    }));
  };

  const cambiarConfiguracion = (campo, texto) => {
    const tipo = tiposOriginales[campo];
    let valor = texto;

    // Mantener los tipos existentes de configuración.
    if (tipo === "number") {
      valor = texto === "" ? "" : Number(texto);
    } else if (tipo === "boolean") {
      valor = texto === "true";
    } else if (
      tipo === "object" ||
      tipo === "array"
    ) {
      try {
        valor = JSON.parse(texto);
      } catch {
        setErrorConfiguracion(
          `El campo ${campo} contiene un JSON inválido.`
        );
        return;
      }
    } else if (tipo === "null") {
      valor = texto === "" ? null : texto;
    }

    setErrorConfiguracion("");

    setFormulario((actual) => ({
      ...actual,
      CONFIGURACION: {
        ...actual.CONFIGURACION,
        [campo]: valor
      }
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (
      guardando ||
      cargando ||
      error ||
      errorConfiguracion
    ) {
      return;
    }

    if (
      Object.entries(formulario.CONFIGURACION).some(
        ([clave, valor]) =>
          tiposOriginales[clave] === "number" &&
          (valor === "" || !Number.isFinite(valor))
      )
    ) {
      toast.error(
        "Revisa los valores numéricos de la configuración."
      );
      return;
    }

    const datos = {
      SOFTWARE: formulario.SOFTWARE.trim(),
      VERSION: formulario.VERSION.trim(),
      COMENTARIOS:
        formulario.COMENTARIOS.trim() || null,
      CONFIGURACION: formulario.CONFIGURACION
    };

    // No enviar ni borrar activadores de otros usuarios.
    if (puedeEditarActivador) {
      datos.ACTIVADOR =
        formulario.ACTIVADOR.trim() || null;
    }

    try {
      setGuardando(true);

      await actualizarLicencia(idLicencia, datos);

      toast.success(
        "Licencia actualizada correctamente."
      );

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
            type="button"
            className="usuario-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar modal"
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
                      cambiarCampo(
                        "SOFTWARE",
                        e.target.value
                      )
                    }
                    maxLength={150}
                    required
                  />
                </label>

                <label className="campo">
                  Versión
                  <input
                    name="VERSION"
                    value={formulario.VERSION}
                    onChange={(e) =>
                      cambiarCampo(
                        "VERSION",
                        e.target.value
                      )
                    }
                    maxLength={100}
                    required
                  />
                </label>

                {puedeEditarActivador && (
                  <label className="campo">
                    Activador
                    <input
                      name="ACTIVADOR"
                      value={formulario.ACTIVADOR}
                      onChange={(e) =>
                        cambiarCampo(
                          "ACTIVADOR",
                          e.target.value
                        )
                      }
                      maxLength={150}
                    />
                  </label>
                )}

                <label
                  className="campo-form"
                  style={{ gridColumn: "1 / -1" }}
                >
                  Comentarios
                  <textarea
                    name="COMENTARIOS"
                    value={formulario.COMENTARIOS}
                    onChange={(e) =>
                      cambiarCampo(
                        "COMENTARIOS",
                        e.target.value
                      )
                    }
                    rows={4}
                  />
                </label>

                <div
                  className="licencia-editar-configuracion"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <h3>Configuración de licencia</h3>

                  {Object.keys(
                    formulario.CONFIGURACION
                  ).length === 0 ? (
                    <p>
                      Esta licencia no tiene configuración
                      adicional registrada.
                    </p>
                  ) : (
                    <div className="usuario-form-grid">
                      {Object.entries(
                        formulario.CONFIGURACION
                      ).map(([campo, valor]) => {
                        const tipo =
                          tiposOriginales[campo];

                        return (
                          <label
                            className="campo"
                            key={campo}
                          >
                            {etiquetaCampo(campo)}

                            {tipo === "boolean" ? (
                              <select
                                value={String(valor)}
                                onChange={(e) =>
                                  cambiarConfiguracion(
                                    campo,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="true">
                                  Sí
                                </option>
                                <option value="false">
                                  No
                                </option>
                              </select>
                            ) : tipo === "object" ||
                              tipo === "array" ? (
                              <textarea
                                defaultValue={
                                  JSON.stringify(
                                    valor,
                                    null,
                                    2
                                  )
                                }
                                key={campo}
                                rows={4}
                                onBlur={(e) =>
                                  cambiarConfiguracion(
                                    campo,
                                    e.target.value
                                  )
                                }
                              />
                            ) : (
                              <input
                                type={
                                  tipo === "number"
                                    ? "number"
                                    : "text"
                                }
                                value={valorEnInput(valor)}
                                onChange={(e) =>
                                  cambiarConfiguracion(
                                    campo,
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {errorConfiguracion && (
                    <p role="alert">
                      {errorConfiguracion}
                    </p>
                  )}
                </div>
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
              disabled={
                cargando ||
                guardando ||
                Boolean(error) ||
                Boolean(errorConfiguracion)
              }
            >
              {guardando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body
  );
}
