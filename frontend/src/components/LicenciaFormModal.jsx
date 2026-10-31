
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, KeyRound } from "lucide-react";
import { toast } from "react-toastify";

import {
  obtenerOpcionesLicencias,
  crearLicencia
} from "../services/licenciasService";

import "../styles/LicenciaFormModal.css";

// ================================================
// ESTADO INICIAL
// ================================================

const estadoInicial = {
  software: "",
  version: "",
  edicion: "",
  modalidad: "",
  fechaActivacion: "",
  activador: "",
  comentarios: ""
};

const EDICIONES_GRATUITAS = ["Express", "Developer"];

function LicenciaFormModal({
  mostrar,
  onCerrar,
  onGuardado
}) {
  // ================================================
  // ESTADOS
  // ================================================

  const [opciones, setOpciones] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] =
    useState(false);

  const [formulario, setFormulario] =
    useState({ ...estadoInicial });

  const [configuracion, setConfiguracion] = useState({});
  const [errores, setErrores] = useState([]);

  // ================================================
  // CARGAR OPCIONES AL ABRIR EL MODAL
  // ================================================

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
          console.error(
            "Error cargando opciones de licencias:",
            error
          );

          toast.error(
            "No se pudieron cargar las opciones de licencias."
          );
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

  // ================================================
  // OPCIONES DINÁMICAS
  // ================================================

  const softwareSeleccionado = useMemo(
    () =>
      opciones?.software?.find(
        item => item.codigo === formulario.software
      ),
    [opciones, formulario.software]
  );

  const versionSeleccionada = useMemo(
    () =>
      softwareSeleccionado?.versiones?.find(
        item => item.version === formulario.version
      ),
    [softwareSeleccionado, formulario.version]
  );

  const edicionSeleccionada = useMemo(
    () =>
      versionSeleccionada?.ediciones?.find(
        item => item.nombre === formulario.edicion
      ),
    [versionSeleccionada, formulario.edicion]
  );

  const modalidadesDisponibles = useMemo(
    () =>
      (opciones?.modalidades || []).filter(
        item =>
          edicionSeleccionada?.modalidades?.includes(
            item.codigo
          )
      ),
    [opciones, edicionSeleccionada]
  );

  // ================================================
  // DETECTAR EDICIONES GRATUITAS
  // ================================================

  const esEdicionGratuita =
    EDICIONES_GRATUITAS.includes(formulario.edicion);

  const modalidadSeleccionada =
    modalidadesDisponibles.find(
      item => item.codigo === formulario.modalidad
    );

  // Express y Developer no tienen campos dinámicos.
  const campos = esEdicionGratuita
    ? []
    : modalidadSeleccionada?.campos || [];

  // ================================================
  // CAMBIOS EN CAMPOS PRINCIPALES
  // ================================================

  const cambiarPrincipal = (nombre, valor) => {
    setErrores([]);

    setFormulario(prev => {
      const nuevo = {
        ...prev,
        [nombre]: valor
      };

      // Al cambiar software, reiniciar dependencias.
      if (nombre === "software") {
        nuevo.version = "";
        nuevo.edicion = "";
        nuevo.modalidad = "";
        nuevo.fechaActivacion = "";
        nuevo.activador = "";
      }

      // Al cambiar versión, reiniciar edición.
      if (nombre === "version") {
        nuevo.edicion = "";
        nuevo.modalidad = "";
        nuevo.fechaActivacion = "";
        nuevo.activador = "";
      }

      // Al cambiar edición, actualizar modalidad.
      if (nombre === "edicion") {
        nuevo.modalidad = "";
        nuevo.fechaActivacion = "";
        nuevo.activador = "";

        if (EDICIONES_GRATUITAS.includes(valor)) {
          const edicionNueva =
            versionSeleccionada?.ediciones?.find(
              item => item.nombre === valor
            );

          const permiteGratuita =
            edicionNueva?.modalidades?.includes(
              "GRATUITA"
            );

          const gratuitaActiva =
            opciones?.modalidades?.find(
              item => item.codigo === "GRATUITA"
            );

          if (permiteGratuita && gratuitaActiva) {
            nuevo.modalidad = "GRATUITA";
          }
        }
      }

      return nuevo;
    });

    if (
      ["software", "version", "edicion", "modalidad"]
        .includes(nombre)
    ) {
      // Evita conservar núcleos, CAL u otros valores
      // de modalidades seleccionadas previamente.
      setConfiguracion({});
    }
  };

  // ================================================
  // CAMPOS DINÁMICOS
  // ================================================

  const cambiarConfiguracion = (nombre, valor) => {
    setErrores([]);

    setConfiguracion(prev => ({
      ...prev,
      [nombre]: valor
    }));
  };

  const construirConfiguracion = () => {
    // Express y Developer no envían parámetros
    // adicionales de licenciamiento.
    if (esEdicionGratuita) {
      return {};
    }

    const resultado = {};

    for (const campo of campos) {
      const valor = configuracion[campo.nombre];

      if (
        valor === undefined ||
        valor === ""
      ) {
        continue;
      }

      resultado[campo.nombre] =
        campo.tipo === "number"
          ? Number(valor)
          : valor;
    }

    return resultado;
  };

  // ================================================
  // VALIDACIÓN
  // ================================================

  const validar = () => {
    const nuevosErrores = [];

    if (!softwareSeleccionado) {
      nuevosErrores.push(
        "Selecciona un software."
      );
    }

    if (!versionSeleccionada) {
      nuevosErrores.push(
        "Selecciona una versión."
      );
    }

    if (!edicionSeleccionada) {
      nuevosErrores.push(
        "Selecciona una edición."
      );
    }

    if (!modalidadSeleccionada) {
      nuevosErrores.push(
        esEdicionGratuita
          ? "La modalidad GRATUITA no está disponible o activa."
          : "Selecciona un tipo de licencia."
      );
    }

    if (
      esEdicionGratuita &&
      modalidadSeleccionada?.codigo !== "GRATUITA"
    ) {
      nuevosErrores.push(
        "Express y Developer deben utilizar GRATUITA."
      );
    }

    if (
      !esEdicionGratuita &&
      modalidadSeleccionada?.codigo === "GRATUITA"
    ) {
      nuevosErrores.push(
        "La modalidad GRATUITA no corresponde a esta edición."
      );
    }

    // Validar campos dinámicos únicamente
    // para ediciones con licenciamiento comercial.
    if (!esEdicionGratuita) {
      for (const campo of campos) {
        const valor = configuracion[campo.nombre];

        if (
          campo.obligatorio &&
          (
            valor === undefined ||
            valor === null ||
            String(valor).trim() === ""
          )
        ) {
          nuevosErrores.push(
            `${campo.etiqueta} es obligatorio.`
          );
          continue;
        }

        if (
          campo.tipo === "number" &&
          valor !== undefined &&
          valor !== null &&
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

        if (
          campo.tipo === "select" &&
          valor !== undefined &&
          valor !== ""
        ) {
          const opcionValida =
            (campo.opciones || []).some(
              opcion => opcion.valor === valor
            );

          if (!opcionValida) {
            nuevosErrores.push(
              `Selecciona una opción válida para ${campo.etiqueta}.`
            );
          }
        }
      }
    }

    if (
      !esEdicionGratuita &&
      formulario.fechaActivacion &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        formulario.fechaActivacion
      )
    ) {
      nuevosErrores.push(
        "La fecha de activación es inválida."
      );
    }

    if (
      !esEdicionGratuita &&
      formulario.activador.length > 150
    ) {
      nuevosErrores.push(
        "El método de activación admite máximo 150 caracteres."
      );
    }

    if (formulario.comentarios.length > 5000) {
      nuevosErrores.push(
        "Los comentarios admiten máximo 5000 caracteres."
      );
    }

    setErrores(nuevosErrores);

    return nuevosErrores.length === 0;
  };

  // ================================================
  // GUARDAR LICENCIA
  // ================================================

  const guardar = async (event) => {
    event.preventDefault();

    if (
      guardando ||
      guardadoExitoso ||
      !validar()
    ) {
      return;
    }

    const datos = {
      SOFTWARE: softwareSeleccionado.nombre,

      VERSION:
        `${formulario.version} ${formulario.edicion}`,

      ID_TIPO_LICENCIA:
        modalidadSeleccionada.id,

      ESTADO: "DISPONIBLE",

      FECHA_ACTIVACION: esEdicionGratuita
        ? null
        : formulario.fechaActivacion || null,

      ACTIVADOR: esEdicionGratuita
        ? null
        : formulario.activador.trim() || null,

      COMENTARIOS:
        formulario.comentarios.trim() || null,

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

      // El componente padre actualiza la tabla
      // y decide cuándo cerrar el modal.
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
      console.error(
        "Error registrando licencia:",
        error.response?.data || error
      );

      const mensajes =
        error.response?.data?.errores;

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

  // ================================================
  // RENDER
  // ================================================

  if (!mostrar) return null;

  return createPortal(
    <div
      className="modal-overlay"
      role="presentation"
    >
      <div
        className="modal modal-responsiva-editar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="licencia-modal-titulo"
      >
        {/* ========================================
            HEADER
        ======================================== */}

        <div className="modal-header">
          <div>
            <h2 id="licencia-modal-titulo">
              Registrar licencia
            </h2>

            <p>
              Selecciona el software, su versión
              y la edición correspondiente.
            </p>
          </div>

          <button
            type="button"
            className="usuario-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================
            FORMULARIO
        ======================================== */}

        <form
          onSubmit={guardar}
          className="responsiva-modal-body"
        >
          {cargando ? (
            <p>Cargando configuraciones...</p>
          ) : !opciones ? (
            <p>
              No se pudieron cargar las opciones
              del formulario. Cierra y vuelve
              a abrir el modal.
            </p>
          ) : (
            <>
              {/* ====================================
                  DATOS GENERALES
              ==================================== */}

              <div className="responsiva-form-grid">
                {/* SOFTWARE */}

                <div className="form-group">
                  <h3>Datos generales de la licencia</h3>

                  <label htmlFor="licencia-software">
                    Software *
                  </label>

                  <select
                    id="licencia-software"
                    value={formulario.software}
                    onChange={e =>
                      cambiarPrincipal(
                        "software",
                        e.target.value
                      )
                    }
                    disabled={guardando}
                  >
                    <option value="">
                      Selecciona software
                    </option>

                    {(opciones.software || []).map(
                      item => (
                        <option
                          key={item.codigo}
                          value={item.codigo}
                        >
                          {item.nombre}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* VERSIÓN */}

                <div className="form-group">
                  <label htmlFor="licencia-version">
                    Versión *
                  </label>

                  <select
                    id="licencia-version"
                    value={formulario.version}
                    onChange={e =>
                      cambiarPrincipal(
                        "version",
                        e.target.value
                      )
                    }
                    disabled={
                      !softwareSeleccionado ||
                      guardando
                    }
                  >
                    <option value="">
                      Selecciona versión
                    </option>

                    {(
                      softwareSeleccionado?.versiones ||
                      []
                    ).map(item => (
                      <option
                        key={item.version}
                        value={item.version}
                      >
                        {item.version}
                      </option>
                    ))}
                  </select>
                </div>

                {/* EDICIÓN */}

                <div className="form-group">
                  <label htmlFor="licencia-edicion">
                    Edición *
                  </label>

                  <select
                    id="licencia-edicion"
                    value={formulario.edicion}
                    onChange={e =>
                      cambiarPrincipal(
                        "edicion",
                        e.target.value
                      )
                    }
                    disabled={
                      !versionSeleccionada ||
                      guardando
                    }
                  >
                    <option value="">
                      Selecciona edición
                    </option>

                    {(
                      versionSeleccionada?.ediciones ||
                      []
                    ).map(item => (
                      <option
                        key={item.nombre}
                        value={item.nombre}
                      >
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* MODALIDAD: SOLO EDICIONES NO GRATUITAS */}

                {!esEdicionGratuita && (
                  <div className="form-group">
                    <label htmlFor="licencia-modalidad">
                      Tipo de licencia *
                    </label>

                    <select
                      id="licencia-modalidad"
                      value={formulario.modalidad}
                      onChange={e =>
                        cambiarPrincipal(
                          "modalidad",
                          e.target.value
                        )
                      }
                      disabled={
                        !edicionSeleccionada ||
                        guardando
                      }
                    >
                      <option value="">
                        Selecciona modalidad
                      </option>

                      {modalidadesDisponibles.map(
                        item => (
                          <option
                            key={item.id}
                            value={item.codigo}
                          >
                            {item.codigo === "POR_NUCLEO"
                              ? "Por núcleo"
                              : item.codigo === "SERVER_CAL"
                                ? "Servidor + CAL"
                                : item.codigo}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* ====================================
                  CONFIGURACIÓN DINÁMICA
              ==================================== */}

              {!esEdicionGratuita &&
                campos.length > 0 && (
                <section className="form-group">
                  <h3>Configuración de la licencia</h3>

                  <div className="responsiva-form-grid">
                    {campos.map(campo => (
                      <div
                        className="form-group"
                        key={campo.nombre}
                      >
                        <label
                          htmlFor={`licencia-${campo.nombre}`}
                        >
                          {campo.etiqueta}
                          {campo.obligatorio ? " *" : ""}
                        </label>

                        {campo.tipo === "select" ? (
                          <select
                            id={`licencia-${campo.nombre}`}
                            value={
                              configuracion[campo.nombre] ??
                              ""
                            }
                            onChange={e =>
                              cambiarConfiguracion(
                                campo.nombre,
                                e.target.value
                              )
                            }
                            disabled={guardando}
                          >
                            <option value="">
                              Selecciona una opción
                            </option>

                            {(campo.opciones || []).map(
                              opcion => (
                                <option
                                  key={opcion.valor}
                                  value={opcion.valor}
                                >
                                  {opcion.etiqueta}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <input
                            id={`licencia-${campo.nombre}`}
                            type={campo.tipo}
                            min={campo.minimo}
                            step={
                              campo.tipo === "number"
                                ? "1"
                                : undefined
                            }
                            value={
                              configuracion[campo.nombre] ??
                              ""
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

              {/* ====================================
                  INFORMACIÓN ADMINISTRATIVA
              ==================================== */}

              <section className="licencia-campos-dinamicos">
                <h3>Información administrativa</h3>

                <div className="responsiva-form-grid">
                  <div className="form-group">

                    {/* EDICIONES CON LICENCIAMIENTO */}

                    {!esEdicionGratuita && (
                      <>
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

                        <label htmlFor="licencia-activador">
                          Método de activación
                        </label>

                        <input
                          id="licencia-activador"
                          maxLength={150}
                          placeholder="Método de activación"
                          value={formulario.activador}
                          onChange={e =>
                            cambiarPrincipal(
                              "activador",
                              e.target.value
                            )
                          }
                          disabled={guardando}
                        />
                      </>
                    )}

                    {/* COMENTARIOS: TODAS LAS EDICIONES */}

                    <label htmlFor="licencia-comentarios">
                      Comentarios
                    </label>

                    <textarea
                      id="licencia-comentarios"
                      rows={3}
                      value={formulario.comentarios}
                      onChange={e =>
                        cambiarPrincipal(
                          "comentarios",
                          e.target.value
                        )
                      }
                      disabled={guardando}
                      placeholder="Observaciones de la licencia"
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ======================================
              ERRORES
          ====================================== */}

          {errores.length > 0 && (
            <div
              className="licencia-errores"
              role="alert"
            >
              <strong>
                Revisa los siguientes datos:
              </strong>

              <ul>
                {errores.map((error, index) => (
                  <li key={index}>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ======================================
              BOTONES
          ====================================== */}

          <div className="responsiva-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primario"
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
