
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, KeyRound } from "lucide-react";
import { toast } from "react-toastify";

import {
  obtenerOpcionesLicencias,
  crearLicencia
} from "../services/licenciasService";

import "../styles/LicenciaFormModal.css";

const estadoInicial = {
  software: "",
  version: "",
  edicion: "",
  modalidad: "",
  fechaActivacion: "",
  activador: "",
  comentarios: ""
};

function LicenciaFormModal({ mostrar, onCerrar, onGuardado }) {
  const [opciones, setOpciones] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [configuracion, setConfiguracion] = useState({});
  const [errores, setErrores] = useState([]);

  // Cargar opciones cada vez que se abre el modal.
  useEffect(() => {
    if (!mostrar) return;

    let activo = true;

    setFormulario({ ...estadoInicial });
    setConfiguracion({});
    setErrores([]);
    setGuardadoExitoso(false);
    setOpciones(null);
    setCargando(true);

    const cargar = async () => {
      try {
        const datos = await obtenerOpcionesLicencias();

        if (activo) {
          setOpciones(datos);
        }
      } catch (error) {
        if (activo) {
          console.error("Error cargando modalidades:", error);
          toast.error("No se pudieron cargar las opciones.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [mostrar]);

  const softwareSeleccionado = useMemo(
    () => opciones?.software?.find(
      item => item.codigo === formulario.software
    ),
    [opciones, formulario.software]
  );

  const versionSeleccionada = useMemo(
    () => softwareSeleccionado?.versiones?.find(
      item => item.version === formulario.version
    ),
    [softwareSeleccionado, formulario.version]
  );

  const edicionSeleccionada = useMemo(
    () => versionSeleccionada?.ediciones?.find(
      item => item.nombre === formulario.edicion
    ),
    [versionSeleccionada, formulario.edicion]
  );

  const modalidadesDisponibles = useMemo(
    () => (opciones?.modalidades || []).filter(
      item =>
        edicionSeleccionada?.modalidades?.includes(item.codigo)
    ),
    [opciones, edicionSeleccionada]
  );

  const modalidadSeleccionada = modalidadesDisponibles.find(
    item => item.codigo === formulario.modalidad
  );

  const campos = modalidadSeleccionada?.campos || [];

  const cambiarPrincipal = (nombre, valor) => {
    setErrores([]);

    setFormulario(prev => {
      const nuevo = { ...prev, [nombre]: valor };

      if (nombre === "software") {
        nuevo.version = "";
        nuevo.edicion = "";
        nuevo.modalidad = "";
      }

      if (nombre === "version") {
        nuevo.edicion = "";
        nuevo.modalidad = "";
      }

      if (nombre === "edicion") {
        nuevo.modalidad = "";
      }

      return nuevo;
    });

    if (
      ["software", "version", "edicion", "modalidad"]
        .includes(nombre)
    ) {
      setConfiguracion({});
    }
  };

  const cambiarConfiguracion = (nombre, valor) => {
    setErrores([]);
    setConfiguracion(prev => ({
      ...prev,
      [nombre]: valor
    }));
  };

  const construirConfiguracion = () => {
    const resultado = {};

    for (const campo of campos) {
      const valor = configuracion[campo.nombre];

      if (valor === undefined || valor === "") {
        continue;
      }

      resultado[campo.nombre] =
        campo.tipo === "number"
          ? Number(valor)
          : valor;
    }

    return resultado;
  };

  const validar = () => {
    const nuevosErrores = [];

    if (!softwareSeleccionado) {
      nuevosErrores.push("Selecciona un software.");
    }

    if (!versionSeleccionada) {
      nuevosErrores.push("Selecciona una versión.");
    }

    if (!edicionSeleccionada) {
      nuevosErrores.push("Selecciona una edición.");
    }

    if (!modalidadSeleccionada) {
      nuevosErrores.push("Selecciona un tipo de licencia.");
    }

    for (const campo of campos) {
      const valor = configuracion[campo.nombre];

      if (
        campo.obligatorio &&
        (valor === undefined || String(valor).trim() === "")
      ) {
        nuevosErrores.push(`${campo.etiqueta} es obligatorio.`);
        continue;
      }

      if (
        campo.tipo === "number" &&
        valor !== undefined &&
        valor !== ""
      ) {
        const numero = Number(valor);

        if (
          !Number.isInteger(numero) ||
          numero < (campo.minimo ?? 1)
        ) {
          nuevosErrores.push(
            `${campo.etiqueta} debe ser un entero válido.`
          );
        }
      }
    }

    if (
      formulario.fechaActivacion &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        formulario.fechaActivacion
      )
    ) {
      nuevosErrores.push("La fecha de activación es inválida.");
    }

    if (formulario.activador.length > 150) {
      nuevosErrores.push(
        "El activador admite máximo 150 caracteres."
      );
    }

    setErrores(nuevosErrores);

    return nuevosErrores.length === 0;
  };

  const guardar = async (event) => {
    event.preventDefault();

    if (guardando || guardadoExitoso || !validar()) return;

    const datos = {
      SOFTWARE: softwareSeleccionado.nombre,
      VERSION: `${formulario.version} ${formulario.edicion}`,
      ID_TIPO_LICENCIA: modalidadSeleccionada.id,
      ESTADO: "DISPONIBLE",
      FECHA_ACTIVACION:
        formulario.fechaActivacion || null,
      ACTIVADOR: formulario.activador.trim() || null,
      COMENTARIOS: formulario.comentarios.trim() || null,
      CONFIGURACION: construirConfiguracion()
    };

    try {
      setGuardando(true);
      setErrores([]);

      const respuesta = await crearLicencia(datos);

      setGuardadoExitoso(true);
      toast.success(
        respuesta?.message ||
        "Licencia registrada correctamente."
      );

      // El padre actualiza la tabla y cierra el modal.
      try {
  await onGuardado?.();
} catch (error) {
  console.error(
    "Licencia registrada, pero falló la actualización del listado:",
    error
  );

  toast.warning(
    "La licencia se registró, pero debes actualizar el listado."
  );
}

    } catch (error) {
      console.error("Error registrando licencia:", error);

      const mensajes = error.response?.data?.errores;

      setErrores(
        Array.isArray(mensajes) && mensajes.length > 0
          ? mensajes
          : [
              error.response?.data?.message ||
              "No se pudo registrar la licencia."
            ]
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!mostrar) return null;

  return createPortal(
    <div
      className="licencia-modal-overlay"
      role="presentation"
    >
      <div
        className="modal modal-responsiva"
        role="dialog"
        aria-modal="true"
        aria-labelledby="licencia-modal-titulo"
      >
        <div className="modal-header">
          <div>
            <h2 id="licencia-modal-titulo">
              <KeyRound size={22} />
              Registrar licencia
            </h2>
            <p>
              Completa los datos del software
              y su modalidad de licenciamiento.
            </p>
          </div>

          <button
            type="button"
            className="btn-closer"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={guardar} className="licencia-modal-form">
          {cargando ? (
            <p>Cargando configuraciones...</p>
          ) : !opciones ? (
            <p>
              No se pudieron cargar las opciones del formulario.
              Cierra y vuelve a abrir el modal.
            </p>
          ) : (
            <>
              <div className="licencia-form-grid">
                <div className="licencia-campo">
                  <label htmlFor="licencia-software">
                    Software *
                  </label>
                  <select
                    id="licencia-software"
                    value={formulario.software}
                    onChange={e =>
                      cambiarPrincipal("software", e.target.value)
                    }
                    disabled={guardando}
                  >
                    <option value="">Selecciona software</option>
                    {(opciones.software || []).map(item => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="licencia-campo">
                  <label htmlFor="licencia-version">
                    Versión *
                  </label>
                  <select
                    id="licencia-version"
                    value={formulario.version}
                    onChange={e =>
                      cambiarPrincipal("version", e.target.value)
                    }
                    disabled={!softwareSeleccionado || guardando}
                  >
                    <option value="">Selecciona versión</option>
                    {(softwareSeleccionado?.versiones || []).map(
                      item => (
                        <option
                          key={item.version}
                          value={item.version}
                        >
                          {item.version}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="licencia-campo">
                  <label htmlFor="licencia-edicion">
                    Edición *
                  </label>
                  <select
                    id="licencia-edicion"
                    value={formulario.edicion}
                    onChange={e =>
                      cambiarPrincipal("edicion", e.target.value)
                    }
                    disabled={!versionSeleccionada || guardando}
                  >
                    <option value="">Selecciona edición</option>
                    {(versionSeleccionada?.ediciones || []).map(
                      item => (
                        <option
                          key={item.nombre}
                          value={item.nombre}
                        >
                          {item.nombre}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="licencia-campo">
                  <label htmlFor="licencia-modalidad">
                    Tipo de licencia *
                  </label>
                  <select
                    id="licencia-modalidad"
                    value={formulario.modalidad}
                    onChange={e =>
                      cambiarPrincipal("modalidad", e.target.value)
                    }
                    disabled={!edicionSeleccionada || guardando}
                  >
                    <option value="">Selecciona modalidad</option>
                    {modalidadesDisponibles.map(item => (
                      <option key={item.id} value={item.codigo}>
                        {item.codigo === "POR_NUCLEO"
                          ? "Por núcleo"
                          : item.codigo === "SERVER_CAL"
                            ? "Servidor + CAL"
                            : item.codigo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {modalidadSeleccionada && (
                <section className="licencia-campos-dinamicos">
                  <h3>Configuración de la licencia</h3>

                  <div className="licencia-form-grid">
                    {campos.map(campo => (
                      <div
                        className="licencia-campo"
                        key={campo.nombre}
                      >
                        <label htmlFor={`licencia-${campo.nombre}`}>
                          {campo.etiqueta}
                          {campo.obligatorio ? " *" : ""}
                        </label>

                        {campo.tipo === "select" ? (
                          <select
                            id={`licencia-${campo.nombre}`}
                            value={
                              configuracion[campo.nombre] ?? ""
                            }
                            onChange={e =>
                              cambiarConfiguracion(
                                campo.nombre,
                                e.target.value
                              )
                            }
                            disabled={guardando}
                          >
                            <option value="">Selecciona una opción</option>
                            {(campo.opciones || []).map(opcion => (
                              <option
                                key={opcion.valor}
                                value={opcion.valor}
                              >
                                {opcion.etiqueta}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`licencia-${campo.nombre}`}
                            type={campo.tipo}
                            min={campo.minimo}
                            step={
                              campo.tipo === "number" ? "1" : undefined
                            }
                            value={
                              configuracion[campo.nombre] ?? ""
                            }
                            onChange={e =>
                              cambiarConfiguracion(
                                campo.nombre,
                                e.target.value
                              )
                            }
                            disabled={guardando}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="licencia-campos-dinamicos">
                <h3>Información administrativa</h3>

                <div className="licencia-form-grid">
                  <div className="licencia-campo">
                    <label htmlFor="licencia-fecha">
                      Fecha de activación
                    </label>
                    <input
                      id="licencia-fecha"
                      type="date"
                      value={formulario.fechaActivacion}
                      onChange={e =>
                        cambiarPrincipal(
                          "fechaActivacion",
                          e.target.value
                        )
                      }
                      disabled={guardando}
                    />
                  </div>

                  <div className="licencia-campo">
                    <label htmlFor="licencia-activador">
                      Método de activación
                    </label>
                    <input
                      id="licencia-activador"
                      maxLength={150}
                      placeholder="Ej. MAK o KMS"
                      value={formulario.activador}
                      onChange={e =>
                        cambiarPrincipal("activador", e.target.value)
                      }
                      disabled={guardando}
                    />
                    <small>
                      No ingreses claves de producto ni contraseñas.
                    </small>
                  </div>

                  <div className="licencia-campo licencia-campo-completo">
                    <label htmlFor="licencia-comentarios">
                      Comentarios
                    </label>
                    <textarea
                      id="licencia-comentarios"
                      rows={3}
                      value={formulario.comentarios}
                      onChange={e =>
                        cambiarPrincipal("comentarios", e.target.value)
                      }
                      disabled={guardando}
                      placeholder="Observaciones de la licencia"
                    />
                  </div>
                </div>
              </section>

              <p className="licencia-estado-inicial">
                Estado inicial: <strong>Disponible</strong>
              </p>
            </>
          )}

          {errores.length > 0 && (
            <div className="licencia-errores" role="alert">
              <strong>Revisa los siguientes datos:</strong>
              <ul>
                {errores.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="licencia-modal-footer">
            <button
              type="button"
              className="licencia-btn-cancelar"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="licencia-btn-guardar"
              disabled={
                cargando ||
                !opciones ||
                guardando ||
                guardadoExitoso
              }
            >
              {guardando
                ? "Guardando..."
                : guardadoExitoso
                  ? "Registrado"
                  : "Guardar licencia"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default LicenciaFormModal;
