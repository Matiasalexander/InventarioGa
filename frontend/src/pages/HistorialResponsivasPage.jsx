import { useEffect, useMemo, useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";

import { useAuth } from "../context/AuthContext";

import {
  obtenerResponsivas,
  obtenerResponsivaPorId,
  actualizarResponsiva,
  marcarEquipoDevuelto,
  descargarResponsivaPDF,
  reenviarResponsiva,
  obtenerEquiposDisponibles,
  crearResponsiva,
  generarPDFResponsiva
} from "../services/responsivaService";
import "../styles/historialResponsivas.css";

import ResponsivasAcciones from "../components/ResponsivasAcciones";

function HistorialResponsivasPage({ setLoading }) {
  const navigate = useNavigate();
  const { tienePermiso } = useAuth();

  const puedeCrear = tienePermiso("responsivas.crear");
  const puedeEditar = tienePermiso("responsivas.editar");
  const puedeDevolver = tienePermiso("responsivas.devolver");

  const [responsivas, setResponsivas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [responsivaSeleccionada, setResponsivaSeleccionada] =
    useState(null);

  const [editando, setEditando] = useState(null);
  //Modo modal
  const [modoModal, setModoModal] = useState(null); // "ver" | "editar"
  const [mostrarModal, setMostrarModal] = useState(false);
  //fin del modo modal
  const [busqueda, setBusqueda] = useState("");
  // NUEVO: paginación de la tabla
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(20);

  //-----------------------------
  //MODAL Y FUNCIONES
  //-------------------------------
  const [mostrarNuevaResponsiva, setMostrarNuevaResponsiva] = useState(false);
  const [pasoResponsiva, setPasoResponsiva] = useState(1);

  const [fecha, setFecha] = useState("");
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [puesto, setPuesto] = useState("");
  const [area, setArea] = useState("");
  const [correo, setCorreo] = useState("");

  const [equipos, setEquipos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [busquedaEquipo, setBusquedaEquipo] = useState("");

  const sigCanvas = useRef();

  //LIMPIAR RESPONSIVA
  const limpiarNuevaResponsiva = () => {
  setFecha("");
  setNombreReceptor("");
  setPuesto("");
  setArea("");
  setCorreo("");

  setEquipos([]);
  setInventario([]);
  setBusquedaEquipo("");

  if (sigCanvas.current) {
    sigCanvas.current.clear();
  }

  setPasoResponsiva(1);
};

//ABRIR NUEVA RESPONSIVA
const abrirNuevaResponsiva = async () => {
  if (!puedeCrear) {
    toast.warning("No tienes permiso para crear responsivas.");
    return;
  }

  try {
    setLoading(true);

    const data = await obtenerEquiposDisponibles();

    setInventario(Array.isArray(data) ? data : []);
    setPasoResponsiva(1);
    setMostrarNuevaResponsiva(true);
  } catch (error) {
    console.error("Error cargando equipos:", error);

    toast.error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Error cargando equipos disponibles."
    );
  } finally {
    setLoading(false);
  }
};

//CERRAR
const cerrarNuevaResponsiva = () => {
  setMostrarNuevaResponsiva(false);
  limpiarNuevaResponsiva();
};

//PASOS PARA LA RESPONSIVA

const irPasoEquipos = () => {
  if (!fecha) {
    toast.warning("La fecha es obligatoria.");
    return;
  }

  if (!nombreReceptor.trim()) {
    toast.warning("El nombre del receptor es obligatorio.");
    return;
  }

  if (!puesto.trim()) {
    toast.warning("El puesto es obligatorio.");
    return;
  }

  if (
    correo &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    toast.warning("Ingresa un correo válido.");
    return;
  }

  setPasoResponsiva(2);
};

//PASO REVISION
const irPasoRevision = () => {
  if (equipos.length === 0) {
    toast.warning("Debes agregar al menos un equipo.");
    return;
  }

  setPasoResponsiva(3);
};

//LOGICA PARA AGREGAR EQUIPOS
const agregarEquipoDesdeInventario = (item) => {
  const yaExiste = equipos.some(
    (equipo) => equipo.IdInventario === item.id
  );

  if (yaExiste) {
    toast.warning("Este equipo ya fue agregado.");
    return;
  }

  setEquipos((prev) => [
    ...prev,
    {
      IdInventario: item.id,
      Descripcion: item.TIPO_EQUIPO || item.NOMBRE_EQUIPO || "",
      Marca: item.MARCA || "",
      Modelo: item.MODELO || "",
      NoSerie: item.SERIAL || ""
    }
  ]);
};

//ELIMINAR EQUIPOS
const eliminarEquipo = (index) => {
  setEquipos((prev) =>
    prev.filter((_, i) => i !== index)
  );
};

//FILTRO
const inventarioFiltrado = useMemo(() => {
  const texto = busquedaEquipo.trim().toLowerCase();

  return inventario.filter((item) => {
    const estatus = item.ESTATUS?.toLowerCase();

    if (estatus === "en uso") {
      return false;
    }

    if (!texto) {
      return true;
    }

    return [
      item.TIPO_EQUIPO,
      item.NOMBRE_EQUIPO,
      item.MARCA,
      item.MODELO,
      item.SERIAL,
      item.ESTATUS
    ]
      .filter(Boolean)
      .some((valor) =>
        String(valor).toLowerCase().includes(texto)
      );
  });
}, [inventario, busquedaEquipo]);

//LÓGICA NUEVA RESPONSIVA
const guardarNuevaResponsiva = async () => {
  if (!fecha || !nombreReceptor.trim() || !puesto.trim()) {
    toast.warning("Completa los datos obligatorios.");
    setPasoResponsiva(1);
    return;
  }

  if (equipos.length === 0) {
    toast.warning("Agrega al menos un equipo.");
    setPasoResponsiva(2);
    return;
  }

  if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
    toast.warning("La firma es obligatoria.");
    return;
  }

  try {
    setLoading(true);

    const firmaBase64 = sigCanvas.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    const respuesta = await crearResponsiva({
      Fecha: fecha,
      NombreReceptor: nombreReceptor,
      Puesto: puesto,
      Area: area,
      Correo: correo,
      FirmaBase64: firmaBase64,
      equipos
    });

    if (respuesta?.correoEnviado) {
      toast.success(
        "Responsiva creada y correo enviado correctamente."
      );
    } else {
      toast.success("Responsiva creada correctamente.");
    }

    cerrarNuevaResponsiva();

    await cargarResponsivas();

  } catch (error) {
    console.error("Error creando responsiva:", error);

    toast.error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Error al crear la responsiva."
    );
  } finally {
    setLoading(false);
  }
};

//generar pdf
const generarPDFNuevaResponsiva = async () => {
  if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
    toast.warning("Debes agregar la firma antes de generar el PDF.");
    return;
  }

  try {
    setLoading(true);

    const firma = sigCanvas.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    const blob = await generarPDFResponsiva({
      fecha,
      nombreReceptor,
      puesto,
      area,
      firma,
      equipos
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "responsiva.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

    toast.success("PDF generado correctamente.");
  } catch (error) {
    console.error("Error generando PDF:", error);

    toast.error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Error generando el PDF."
    );
  } finally {
    setLoading(false);
  }
};
  //----------------------------------
  // FINAL MODAL Y FUNCIONES
  //----------------------------------


  const [formEditar, setFormEditar] = useState({
    Fecha: "",
    NombreReceptor: "",
    Puesto: "",
    Area: "",
    Correo: ""
  });

  useEffect(() => {
    cargarResponsivas();
  }, []);

  //carga la paginación con el useeffect
  useEffect(() => { setPaginaActual(1); }, [busqueda, registrosPorPagina]);

  const responsivasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return responsivas;
    }

    return responsivas.filter((item) => {
      const folio = (
        item.Folio ||
        `RESP-${String(item.IdResponsiva).padStart(5, "0")}`
      ).toLowerCase();

      const receptor = String(
        item.NombreReceptor || ""
      ).toLowerCase();

      const area = String(item.Area || "").toLowerCase();
      const correo = String(item.Correo || "").toLowerCase();
      const puesto = String(item.Puesto || "").toLowerCase();

      return (
        folio.includes(texto) ||
        receptor.includes(texto) ||
        area.includes(texto) ||
        correo.includes(texto) ||
        puesto.includes(texto)
      );
    });
  }, [busqueda, responsivas]);
  //calculos de la paginación.
  const totalRegistros = responsivasFiltradas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = indiceInicial + registrosPorPagina;
  const responsivasPaginadas = responsivasFiltradas.slice(indiceInicial, indiceFinal);

  //esto lo mostrará como dd/mm/yy
  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    const fechaTexto = String(fecha).split("T")[0];
    const [anio, mes, dia] = fechaTexto.split("-");

    if (!anio || !mes || !dia) return fechaTexto;

    return `${dia}/${mes}/${anio}`;
  };

  //este código es correcto ya que hace el formato de fecha en input
  const formatearFechaInput = (fecha) => {
    if (!fecha) return "";

    return String(fecha).split("T")[0];
  };

  const cargarResponsivas = async () => {
    try {
      setLoading(true);

      const data = await obtenerResponsivas();

      setResponsivas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Error cargando responsivas:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error cargando responsivas."
      );
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (idResponsiva) => {
    try {
      setLoading(true);

      const data = await obtenerResponsivaPorId(idResponsiva);

      setResponsivaSeleccionada(data.responsiva);
      setDetalle(data.equipos || []);
      setModoModal("ver");
      setMostrarModal(true);

    } catch (error) {
      console.error(
        "Error obteniendo detalle:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error obteniendo detalle."
      );
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar responsivas."
      );
      return;
    }

    setEditando(item);

    setFormEditar({
      Fecha: formatearFechaInput(item.Fecha),
      NombreReceptor: item.NombreReceptor || "",
      Puesto: item.Puesto || "",
      Area: item.Area || "",
      Correo: item.Correo || ""
    });
    setModoModal("editar");
    setMostrarModal(true);

  };

  const cerrarEditar = () => {
    setMostrarModal(false);
    setModoModal(null);

    setEditando(null);
    setResponsivaSeleccionada(null);
    setDetalle([]);

    setFormEditar({
      Fecha: "",
      NombreReceptor: "",
      Puesto: "",
      Area: "",
      Correo: ""
    });
  };
  const guardarEdicion = async () => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar responsivas."
      );
      return;
    }

    if (!editando?.IdResponsiva) {
      toast.error("No se encontró la responsiva a editar.");
      return;
    }

    if (
      !formEditar.Fecha ||
      !formEditar.NombreReceptor.trim() ||
      !formEditar.Puesto.trim()
    ) {
      toast.warning(
        "Fecha, receptor y puesto son obligatorios."
      );
      return;
    }

    if (
      formEditar.Correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formEditar.Correo
      )
    ) {
      toast.warning("Ingresa un correo válido.");
      return;
    }

    const idResponsiva = editando.IdResponsiva;

    try {
      setLoading(true);

      await actualizarResponsiva(
        idResponsiva,
        formEditar
      );

      toast.success(
        "Responsiva actualizada correctamente."
      );

      cerrarEditar();

      await cargarResponsivas();

      if (
        responsivaSeleccionada?.IdResponsiva ===
        idResponsiva
      ) {
        await verDetalle(idResponsiva);
      }
    } catch (error) {
      console.error(
        "Error actualizando responsiva:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error actualizando responsiva."
      );
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (
    idResponsiva,
    folio
  ) => {
    try {
      setLoading(true);

      await descargarResponsivaPDF(
        idResponsiva,
        folio
      );

      toast.success(
        "Responsiva descargada correctamente."
      );
    } catch (error) {
      console.error(
        "Error descargando responsiva:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error descargando responsiva."
      );
    } finally {
      setLoading(false);
    }
  };

  const reenviarCorreo = async (idResponsiva) => {
    try {
      setLoading(true);

      await reenviarResponsiva(idResponsiva);

      toast.success(
        "Responsiva reenviada por correo."
      );
    } catch (error) {
      console.error(
        "Error reenviando correo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error reenviando correo."
      );
    } finally {
      setLoading(false);
    }
  };

  const devolverEquipo = async (idDetalle) => {
    if (!puedeDevolver) {
      toast.warning(
        "No tienes permiso para devolver equipos."
      );
      return;
    }

    const confirmar = window.confirm(
      "¿Deseas marcar este equipo como devuelto?"
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      await marcarEquipoDevuelto(
        idDetalle,
        "Equipo devuelto correctamente"
      );

      toast.success(
        "Equipo marcado como devuelto."
      );

      if (responsivaSeleccionada) {
        await verDetalle(
          responsivaSeleccionada.IdResponsiva
        );
      }

      await cargarResponsivas();
    } catch (error) {
      console.error(
        "Error devolviendo equipo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error devolviendo equipo."
      );
    } finally {
      setLoading(false);
    }
  };

  const estados = {
    ACTIVA: "badge badge-activa",
    INACTIVA: "badge badge-inactiva"
  };

  return (
    <div className="card">

      <div className="header">
        <div className="header-user">
          <div>
          <h1>Historial de Responsivas</h1>
          <p>
            Consulta, edita y administra las
            responsivas registradas.
          </p>
              </div>  
              {/*NUEVO BTN*/}
        {puedeCrear && (
  <button
    className="btn-responsiva"
    type="button"
    onClick={abrirNuevaResponsiva}
  >
    Crear Responsiva
  </button>
)}
        </div>

      </div>

      <div
        style={{
          marginBottom: "16px"
        }}
      >
        <input
          className="search-input"
          placeholder="Buscar por folio, receptor, puesto, área o correo..."
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
        />
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Correo del emisor</th>
              <th>Receptor</th>
              <th>Puesto</th>
              <th>Área</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {responsivasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="8">
                  {responsivas.length === 0
                    ? "No hay responsivas registradas."
                    : "No se encontraron responsivas con esa búsqueda."}
                </td>
              </tr>
            ) : (
              responsivasPaginadas.map((item) => {
                const folio =
                  item.Folio ||
                  `RESP-${String(
                    item.IdResponsiva
                  ).padStart(5, "0")}`;

                return (
                  <tr key={item.IdResponsiva}>
                    <td>{folio}</td>

                    {/*Manda a llamar la función de formateo de fecha*/}
                    <td>
                      {formatearFecha(item.Fecha)}
                    </td>
                    <td>{item.CorreoCreador}</td>
                    <td>
                      {item.NombreReceptor || ""}
                    </td>

                    <td>{item.Puesto || ""}</td>
                    <td>{item.Area || ""}</td>
                    <td>{item.Correo || ""}</td>

                    <td>
                      <span
                        className={
                          estados[item.Estado] ||
                          "badge badge-default"
                        }
                      >
                        {item.Estado ||
                          "Sin estatus"}
                      </span>
                    </td>

                    <td>
                      <ResponsivasAcciones
                        item={item}
                        onDetalle={verDetalle}
                        onEditar={abrirEditar}
                        onPDF={(id) =>
                          descargarPDF(
                            id,
                            folio
                          )
                        }
                        onCorreo={
                          reenviarCorreo
                        }
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/*paginación*/}
      <div className="inventario-paginacion">
        <div className="inventario-paginacion-info">
          {totalRegistros === 0
            ? "0 registros"
            : `${indiceInicial + 1}-${Math.min(
              indiceFinal,
              totalRegistros
            )} de ${totalRegistros}`}
        </div>

        <div className="inventario-paginacion-controles">
          <label>
            Registros por página:
          </label>

          <select
            value={registrosPorPagina}
            onChange={(e) =>
              setRegistrosPorPagina(Number(e.target.value))
            }
          >
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button
            type="button"
            onClick={() =>
              setPaginaActual((prev) =>
                Math.max(1, prev - 1)
              )
            }
            disabled={paginaActual === 1}
          >
            ‹
          </button>

          <span>
            Página {paginaActual} de {totalPaginas}
          </span>

          <button
            type="button"
            onClick={() =>
              setPaginaActual((prev) =>
                Math.min(totalPaginas, prev + 1)
              )
            }
            disabled={paginaActual === totalPaginas}
          >
            ›
          </button>
        </div>
      </div>
      {/*FIN PAGINACIÓN*/}
      {mostrarModal && createPortal(
        <div className="modal-overlay">
          <div className="modal">

            {modoModal === "editar" ? (
              <>
                <div className="modal-header">
                  <h3>
                    Editar Responsiva{" "}
                    {editando?.Folio ||
                      `RESP-${String(editando?.IdResponsiva).padStart(5, "0")}`}
                  </h3>

                  <button
                    className="btn-close"
                    onClick={cerrarEditar}
                  >
                    ✕
                  </button>
                </div>

                <div className="form-responsiva">

                  <p>Fecha</p>
                  <input
                    type="date"
                    value={formEditar.Fecha}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        Fecha: e.target.value
                      })
                    }
                  />

                  <p>Nombre receptor</p>
                  <input
                    type="text"
                    value={formEditar.NombreReceptor}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        NombreReceptor: e.target.value
                      })
                    }
                  />

                  <p>Puesto</p>
                  <input
                    type="text"
                    value={formEditar.Puesto}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        Puesto: e.target.value
                      })
                    }
                  />

                  <p>Área</p>
                  <input
                    type="text"
                    value={formEditar.Area}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        Area: e.target.value
                      })
                    }
                  />

                  <p>Correo</p>
                  <input
                    type="email"
                    value={formEditar.Correo}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        Correo: e.target.value
                      })
                    }
                  />

                </div>

                <div className="modal-footer">
                  <button
                    className="btn-primary"
                    onClick={guardarEdicion}
                  >
                    Guardar cambios
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={cerrarEditar}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h3>
                    {responsivaSeleccionada?.Folio ||
                      `RESP-${String(
                        responsivaSeleccionada?.IdResponsiva
                      ).padStart(5, "0")}`}
                  </h3>

                  <button
                    className="btn-close"
                    onClick={cerrarEditar}
                  >
                    ✕
                  </button>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Serie</th>
                        <th>Devuelto</th>
                        <th>Fecha devolución</th>
                        <th>Comentarios</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {detalle.length === 0 ? (
                        <tr>
                          <td colSpan="8">
                            Sin equipos registrados.
                          </td>
                        </tr>
                      ) : (
                        detalle.map((item) => (
                          <tr key={item.IdDetalle}>
                            <td>
                              {item.Descripcion}
                            </td>

                            <td>{item.Marca}</td>
                            <td>{item.Modelo}</td>
                            <td>{item.NoSerie}</td>

                            <td>
                              {item.Devuelto
                                ? "Sí"
                                : "No"}
                            </td>

                            <td>
                              {item.FechaDevolucion
                                ? new Date(
                                  item.FechaDevolucion
                                ).toLocaleString(
                                  "es-MX"
                                )
                                : ""}
                            </td>

                            <td>
                              {item.ComentariosDevolucion ||
                                ""}
                            </td>

                            <td>
                              {item.Devuelto ? (
                                "Devuelto"
                              ) : puedeDevolver ? (
                                <button
                                  className="btn-secondary"
                                  type="button"
                                  onClick={() =>
                                    devolverEquipo(
                                      item.IdDetalle
                                    )
                                  }
                                >
                                  Devolver
                                </button>
                              ) : (
                                "Pendiente"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>
        </div>, document.body
      )}

{mostrarNuevaResponsiva &&
  createPortal(
    <div className="modal-overlay">
      <div className="modal modal-responsiva">

        <div className="modal-header">
          <div>
            <h3>Nueva responsiva</h3>
            <p>Paso {pasoResponsiva} de 3</p>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={cerrarNuevaResponsiva}
          >
            ✕
          </button>
        </div>

        {/* INDICADOR DE PASOS */}
        <div className="responsiva-steps">

          <div
            className={`responsiva-step ${
              pasoResponsiva >= 1 ? "activo" : ""
            }`}
          >
            <span>1</span>

            <div>
              <strong>Datos</strong>
              <small>Receptor</small>
            </div>
          </div>

          <div className="responsiva-step-line" />

          <div
            className={`responsiva-step ${
              pasoResponsiva >= 2 ? "activo" : ""
            }`}
          >
            <span>2</span>

            <div>
              <strong>Equipos</strong>
              <small>Asignación</small>
            </div>
          </div>

          <div className="responsiva-step-line" />

          <div
            className={`responsiva-step ${
              pasoResponsiva >= 3 ? "activo" : ""
            }`}
          >
            <span>3</span>

            <div>
              <strong>Revisión</strong>
              <small>Firma</small>
            </div>
          </div>

        </div>

        {/* PASO 1 */}
        {pasoResponsiva === 1 && (
          <div className="responsiva-modal-body">

            <div className="responsiva-form-grid">

              <div className="form-group">
                <label>Fecha *</label>

                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Nombre del receptor *</label>

                <input
                  type="text"
                  value={nombreReceptor}
                  onChange={(e) =>
                    setNombreReceptor(e.target.value)
                  }
                  placeholder="Nombre completo"
                />
              </div>

              <div className="form-group">
                <label>Puesto *</label>

                <input
                  type="text"
                  value={puesto}
                  onChange={(e) =>
                    setPuesto(e.target.value)
                  }
                  placeholder="Puesto"
                />
              </div>

              <div className="form-group">
                <label>Área</label>

                <input
                  type="text"
                  value={area}
                  onChange={(e) =>
                    setArea(e.target.value)
                  }
                  placeholder="Área"
                />
              </div>

              <div className="form-group">
                <label>Correo</label>

                <input
                  type="email"
                  value={correo}
                  onChange={(e) =>
                    setCorreo(e.target.value)
                  }
                  placeholder="correo@empresa.com"
                />
              </div>

            </div>

          </div>
        )}

        {/* PASO 2 */}
        {pasoResponsiva === 2 && (
          <div className="responsiva-modal-body">

            <div className="responsiva-equipos-grid">

              {/* INVENTARIO DISPONIBLE */}
              <div className="responsiva-panel">

                <div className="responsiva-panel-header">
                  <div>
                    <h4>Equipos disponibles</h4>
                    <span>
                      Selecciona los equipos que deseas asignar
                    </span>
                  </div>
                </div>

                <input
                  type="text"
                  className="responsiva-search"
                  placeholder="Buscar equipo, marca, modelo o serie..."
                  value={busquedaEquipo}
                  onChange={(e) =>
                    setBusquedaEquipo(e.target.value)
                  }
                />

                <div className="equipos-disponibles-list">

                  {inventarioFiltrado.length === 0 ? (
                    <p className="sin-resultados">
                      No hay equipos disponibles.
                    </p>
                  ) : (
                    inventarioFiltrado.map((item) => (
                      <div
                        key={item.id}
                        className="equipo-disponible"
                      >

                        <div>
                          <strong>
                            {item.TIPO_EQUIPO ||
                              item.NOMBRE_EQUIPO ||
                              "Equipo"}
                          </strong>

                          <span>
                            {item.MARCA || "Sin marca"}{" "}
                            {item.MODELO || ""}
                          </span>

                          <small>
                            Serie: {item.SERIAL || "N/A"}
                          </small>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            agregarEquipoDesdeInventario(item)
                          }
                        >
                          Agregar
                        </button>

                      </div>
                    ))
                  )}

                </div>

              </div>

              {/* EQUIPOS SELECCIONADOS */}
              <div className="responsiva-panel">

                <div className="responsiva-panel-header">
                  <div>
                    <h4>Equipos de la responsiva</h4>
                    <span>
                      {equipos.length} equipo
                      {equipos.length !== 1 ? "s" : ""} seleccionado
                      {equipos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {equipos.length === 0 ? (
                  <div className="sin-equipos">
                    <p>No has agregado equipos.</p>
                  </div>
                ) : (
                  <div className="equipos-seleccionados">

                    {equipos.map((equipo, index) => (
                      <div
                        key={equipo.IdInventario}
                        className="equipo-seleccionado"
                      >

                        <div>
                          <strong>
                            {equipo.Descripcion}
                          </strong>

                          <span>
                            {equipo.Marca} {equipo.Modelo}
                          </span>

                          <small>
                            Serie: {equipo.NoSerie || "N/A"}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="btn-eliminar-equipo"
                          onClick={() =>
                            eliminarEquipo(index)
                          }
                        >
                          Eliminar
                        </button>

                      </div>
                    ))}

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* PASO 3 */}
        {pasoResponsiva === 3 && (
          <div className="responsiva-modal-body">

            <div className="responsiva-revision">

              <div className="documento-preview">

                <h4>Vista previa</h4>

                <div className="documento-card">

                  <h2>RESPONSIVA DE EQUIPO</h2>

                  <p>
                    <strong>Fecha:</strong>{" "}
                    {fecha}
                  </p>

                  <p>
                    <strong>Receptor:</strong>{" "}
                    {nombreReceptor}
                  </p>

                  <p>
                    <strong>Puesto:</strong>{" "}
                    {puesto}
                  </p>

                  <p>
                    <strong>Área:</strong>{" "}
                    {area || "N/A"}
                  </p>

                  <p>
                    <strong>Correo:</strong>{" "}
                    {correo || "N/A"}
                  </p>

                  <hr />

                  <h4>Equipos asignados</h4>

                  <table>
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Serie</th>
                      </tr>
                    </thead>

                    <tbody>
                      {equipos.map((equipo) => (
                        <tr key={equipo.IdInventario}>
                          <td>{equipo.Descripcion}</td>
                          <td>{equipo.Marca}</td>
                          <td>{equipo.Modelo}</td>
                          <td>{equipo.NoSerie}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

              </div>

              <div className="firma-panel">

                <h4>Firma del receptor</h4>

                <div className="firma-canvas-container">
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      className: "firma-canvas"
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="btn-limpiar-firma"
                  onClick={() =>
                    sigCanvas.current?.clear()
                  }
                >
                  Limpiar firma
                </button>

              </div>

            </div>

          </div>
        )}

        {/* FOOTER */}
        <div className="responsiva-modal-footer">

          {pasoResponsiva > 1 && (
            <button
              type="button"
              className="btn-secundario"
              onClick={() =>
                setPasoResponsiva(
                  pasoResponsiva - 1
                )
              }
            >
              ← Anterior
            </button>
          )}

          <div className="footer-right">

            <button
              type="button"
              className="btn-cancelar"
              onClick={cerrarNuevaResponsiva}
            >
              Cancelar
            </button>

            {pasoResponsiva === 1 && (
              <button
                type="button"
                className="btn-primario"
                onClick={irPasoEquipos}
              >
                Siguiente →
              </button>
            )}

            {pasoResponsiva === 2 && (
              <button
                type="button"
                className="btn-primario"
                onClick={irPasoRevision}
              >
                Revisar →
              </button>
            )}

            {pasoResponsiva === 3 && (
              <>
                {puedePDF && (
                  <button
                    type="button"
                    className="btn-secundario"
                    onClick={generarPDFNuevaResponsiva}
                  >
                    Descargar PDF
                  </button>
                )}

                <button
                  type="button"
                  className="btn-primario"
                  onClick={guardarNuevaResponsiva}
                >
                  Guardar responsiva
                </button>
              </>
            )}

          </div>

        </div>

      </div>
    </div>,
    document.body
  )}

    </div>//div de la card principal
  );
}

export default HistorialResponsivasPage;