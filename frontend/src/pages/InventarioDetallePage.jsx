import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { obtenerInventarioPorId, obtenerPosComplementos, actualizarPosComplemento, crearComplementoPOS } from "../services/inventarioService";
import { obtenerHistorialResponsivasPorEquipo } from "../services/responsivaService";


import "../styles/InventarioDetallePage.css";


function InventarioDetallePage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [equipo, setEquipo] = useState(null);

  //estados para POS
  const [mostrarComplementosPOS, setMostrarComplementosPOS] = useState(false);
  const [complementosPOS, setComplementosPOS] = useState([]);
  const [cargandoComplementosPOS, setCargandoComplementosPOS] = useState(false);
  const [complementosCargados, setComplementosCargados] = useState(false);
  //estados del modal
  const [mostrarModalComplemento, setMostrarModalComplemento] = useState(false);
  const [complementoSeleccionado, setComplementoSeleccionado] = useState(null);
  const [guardandoComplemento, setGuardandoComplemento] = useState(false);

  //mdos
  const [modoComplemento, setModoComplemento] = useState("editar");
  const [responsivasEquipo, setResponsivasEquipo] = useState({
    activa: null,
    historial: []
  });

  const [error, setError] = useState("");


  useEffect(() => {

    const cargarDatos = async () => {

      try {

        // ==============================
        // OBTENER EQUIPO
        // ==============================

        const data = await obtenerInventarioPorId(id);

        setEquipo(data);


        // ==============================
        // OBTENER HISTORIAL RESPONSIVAS
        // ==============================

        const dataResp =
          await obtenerHistorialResponsivasPorEquipo(id);

        setResponsivasEquipo({
          activa: dataResp.activa || null,
          historial: dataResp.historial || []
        });

      } catch (error) {

        console.error(error);

        setError(
          error.response?.data?.message ||
          "No se pudo cargar la información"
        );

      }

    };

    cargarDatos();

  }, [id]);


  const formatearFecha = (fecha) => {

    if (!fecha) return "N/A";

    return new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

  };


  const mostrar = (valor) => {

    return valor !== null &&
      valor !== undefined &&
      valor !== ""
      ? valor
      : "N/A";

  };


  if (error) {

    return (

      <div className="contenedor">

        <div className="card">

          <h2>{error}</h2>

          <button
            type="button"
            onClick={() => navigate("/inventario")}
          >
            Volver
          </button>

        </div>

      </div>

    );

  }


  if (!equipo) {

    return (

      <div className="contenedor">

        <div className="card">

          <h2>Cargando...</h2>

        </div>

      </div>

    );

  }


  // ==========================================
  // TIPO DE EQUIPO
  // ==========================================

  const esTelefono =
    Number(equipo.ID_TIPO_EQUIPO) === 15;


  // Equipos con sistema operativo

  const esLaptop =
    Number(equipo.ID_TIPO_EQUIPO) === 1;

  const esDesktop =
    Number(equipo.ID_TIPO_EQUIPO) === 2;

  const esTablet =
    Number(equipo.ID_TIPO_EQUIPO) === 14;


  // Equipos POS

  const esPantallaPOS =
    Number(equipo.ID_TIPO_EQUIPO) === 4;

  const esWorkstationpos =
    Number(equipo.ID_TIPO_EQUIPO) === 7;

  const esTabletPOS =
    Number(equipo.ID_TIPO_EQUIPO) === 13;


  // Equipos que llevan IP

  const esSwitch =
    Number(equipo.ID_TIPO_EQUIPO) === 17;

  const esAPS =
    Number(equipo.ID_TIPO_EQUIPO) === 19;

  const esCCTV =
    Number(equipo.ID_TIPO_EQUIPO) === 20;


  // Impresoras

  const esImpresora =
    Number(equipo.ID_TIPO_EQUIPO) === 3;


  // ==========================================
  // MOSTRAR IP
  // ==========================================

  const mostrarIP =
    esSwitch ||
    esAPS ||
    esCCTV ||
    esTabletPOS ||
    esWorkstationpos ||
    (esImpresora && equipo.CONEXION === "wifi");

  const esPOS = String(equipo.TIPO_EQUIPO || "").trim().toUpperCase() === "POS";
  //function para abrir complementosPOS
  const manejarToggleComplementosPOS = async () => {
    const nuevoEstado = !mostrarComplementosPOS;
    setMostrarComplementosPOS(nuevoEstado);
    if (nuevoEstado && !complementosCargados) {
      try {
        setCargandoComplementosPOS(true);
        const data = await obtenerPosComplementos(equipo.id);
        setComplementosPOS(data);
        setComplementosCargados(true);
      } catch (error) {
        console.error("error obteniendo complementos de pos", error);
      } finally {
        setCargandoComplementosPOS(false);
      }
    }
  };

  const abrirNuevoComplemento = () => {
  setComplementoSeleccionado({
    ID_INVENTARIO: equipo.id,
    TERMINAL_YCS: "",
    INSTALACION_NOBREAK: "",
    IP_YCS: "",
    NUMERO_SERIE: "",
    CODIGO_ACTIVACION: "",
    ESTADO: "Asignada",
    COMENTARIOS: ""
  });

  setModoComplemento("crear");
  setMostrarModalComplemento(true);
};
  // ==========================================
  // MODAL DE EDICIÓN DE COMPLEMENTO POS
  // ==========================================

  const abrirModalComplemento = (complemento) => {
    setComplementoSeleccionado({
      ...complemento
    });

    setMostrarModalComplemento(true);
    setModoComplemento("editar");
  };

  const cerrarModalComplemento = () => {
    if (guardandoComplemento) return;

    setMostrarModalComplemento(false);
    setComplementoSeleccionado(null);
  };

  const manejarCambioComplemento = (e) => {
    const { name, value } = e.target;

    setComplementoSeleccionado((prev) => ({
      ...prev,
      [name]: value
    }));
  };

const guardarComplemento = async () => {
  if (!complementoSeleccionado) return;

  try {
    setGuardandoComplemento(true);

    if (modoComplemento === "crear") {

      await crearComplementoPOS({
        ID_INVENTARIO: equipo.id,

        TERMINAL_YCS:
          complementoSeleccionado.TERMINAL_YCS || null,

        INSTALACION_NOBREAK:
          complementoSeleccionado.INSTALACION_NOBREAK || null,

        IP_YCS:
          complementoSeleccionado.IP_YCS || null,

        NUMERO_SERIE:
          complementoSeleccionado.NUMERO_SERIE || null,

        CODIGO_ACTIVACION:
          complementoSeleccionado.CODIGO_ACTIVACION || null,

        ESTADO: "Asignada",

        COMENTARIOS:
          complementoSeleccionado.COMENTARIOS || null
      });

      // Volver a consultar los complementos reales
      // después de crear uno nuevo
      const dataActualizada =
        await obtenerPosComplementos(equipo.id);

      setComplementosPOS(
        Array.isArray(dataActualizada)
          ? dataActualizada.filter(Boolean)
          : []
      );

      setComplementosCargados(true);

    } else {

      await actualizarPosComplemento(
        complementoSeleccionado.ID_COMPLEMENTO,
        {
          TERMINAL_YCS:
            complementoSeleccionado.TERMINAL_YCS || null,

          INSTALACION_NOBREAK:
            complementoSeleccionado.INSTALACION_NOBREAK || null,

          IP_YCS:
            complementoSeleccionado.IP_YCS || null,

          NUMERO_SERIE:
            complementoSeleccionado.NUMERO_SERIE || null,

          CODIGO_ACTIVACION:
            complementoSeleccionado.CODIGO_ACTIVACION || null,

          ESTADO:
            complementoSeleccionado.ESTADO,

          COMENTARIOS:
            complementoSeleccionado.COMENTARIOS || null
        }
      );

      // Volver a consultar después de editar
      const dataActualizada =
        await obtenerPosComplementos(equipo.id);

      setComplementosPOS(
        Array.isArray(dataActualizada)
          ? dataActualizada.filter(Boolean)
          : []
      );

      setComplementosCargados(true);
    }

    setMostrarModalComplemento(false);
    setComplementoSeleccionado(null);

  } catch (error) {

    console.error(
      "Error guardando complemento POS:",
      error
    );

    alert(
      error.response?.data?.message ||
      "No fue posible guardar el complemento POS."
    );

  } finally {

    setGuardandoComplemento(false);
  }
};
  //modal de edición


  return (

    <div className="contenedor">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="header">

        <div>

          {
            equipo.NOMBRE_EQUIPO == "NA" ? (

              <h1>{equipo.UBICACION}</h1>

            ) : (

              <h1>{equipo.NOMBRE_EQUIPO}</h1>

            )
          }

          <p>Detalle del equipo</p>

        </div>


        <button
          type="button"
          onClick={() => navigate("/inventario")}
        >
          Volver
        </button>

      </div>


      <div className="detalle-grid">


        {/* ======================================
            RESPONSIVA ACTIVA
        ====================================== */}

        <div className="card">

          <h2>Responsiva activa</h2>


          {responsivasEquipo.activa ? (

            <>

              <div className="detalle-item">

                <span>No. Responsiva</span>

                <strong>

                  RESP-
                  {String(
                    responsivasEquipo.activa.IdResponsiva
                  ).padStart(5, "0")}

                </strong>

              </div>


              <div className="detalle-item">

                <span>Asignado a</span>

                <strong>
                  {responsivasEquipo.activa.NombreReceptor}
                </strong>

              </div>


              <div className="detalle-item">

                <span>Puesto</span>

                <strong>
                  {responsivasEquipo.activa.Puesto}
                </strong>

              </div>


              <div className="detalle-item">

                <span>Área</span>

                <strong>
                  {responsivasEquipo.activa.Area || "N/A"}
                </strong>

              </div>


              <div className="detalle-item">

                <span>Fecha préstamo</span>

                <strong>
                  {formatearFecha(
                    responsivasEquipo.activa.Fecha
                  )}
                </strong>

              </div>


              <button
                type="button"
                onClick={() =>
                  navigate("/responsivas/historial")
                }
              >
                Ver historial
              </button>

            </>

          ) : (

            <>

              <div className="detalle-item">

                <span>Estado</span>

                <strong>
                  Disponible
                </strong>

              </div>


              <div className="detalle-item">

                <span>Responsiva digital</span>

                <strong>
                  No
                </strong>

              </div>

            </>

          )}

        </div>


        {/* ======================================
            INFORMACIÓN GENERAL
        ====================================== */}

        <div className="card">

          <h2>Información general</h2>


          <div className="detalle-item">

            <span>Tipo de equipo</span>

            <strong>
              {mostrar(equipo.TIPO_EQUIPO)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Localidad</span>

            <strong>
              {mostrar(equipo.LOCALIDAD)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Ubicación</span>

            <strong>
              {mostrar(equipo.UBICACION)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Departamento</span>

            <strong>
              {mostrar(equipo.DEPARTAMENTO)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Puesto</span>

            <strong>
              {mostrar(equipo.PUESTO)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Correo:</span>

            <strong>
              {mostrar(equipo.CORREO)}
            </strong>

          </div>

        </div>


        {/* ======================================
            IDENTIFICACIÓN
        ====================================== */}

        <div className="card">

          <h2>Identificación</h2>


          <div className="detalle-item">

            <span>Serial</span>

            <strong>
              {mostrar(equipo.SERIAL)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Marca</span>

            <strong>
              {mostrar(equipo.MARCA)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Modelo</span>

            <strong>
              {mostrar(equipo.MODELO)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Sistema operativo</span>

            <strong>

              {equipo.SISTEMA_OPERATIVO

                ? `${equipo.SISTEMA_OPERATIVO}${equipo.VERSION_SISTEMA_OPERATIVO
                  ? ` - ${equipo.VERSION_SISTEMA_OPERATIVO}`
                  : ""
                }`

                : "N/A"

              }

            </strong>

          </div>

          {/* ======================================
    COMPLEMENTOS DE POS
====================================== */}

          {esPOS && (
            <div className="card pos-complementos-card">

              <button
                type="button"
                className="pos-complementos-header"
                onClick={manejarToggleComplementosPOS}
              >
                <h2>Complementos de POS</h2>

                <span>
                  {mostrarComplementosPOS ? "▲" : "▼"}
                </span>
              </button>

              {mostrarComplementosPOS && (
                <div className="pos-complementos-content">

                  <div className="pos-complementos-toolbar">
                    <button
                      type="button"
                      className="pos-complemento-agregar-btn"
                      onClick={abrirNuevoComplemento}
                    >
                      + Agregar complemento
                    </button>
                  </div>

                  {cargandoComplementosPOS ? (

                    <p className="comentario">
                      Cargando complementos...
                    </p>

                  ) : complementosPOS.length === 0 ? (

                    <p className="comentario">
                      No hay complementos registrados para este POS.
                    </p>

                  ) : (

                    complementosPOS.map((complemento) => (

                      <div
                        className="pos-complemento"
                        key={complemento.ID_COMPLEMENTO}
                      >

                        <div className="detalle-item">
                          <span>Terminal YCS</span>
                          <strong>
                            {mostrar(complemento.TERMINAL_YCS)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>Instalación NoBreak</span>
                          <strong>
                            {mostrar(complemento.INSTALACION_NOBREAK)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>IP YCS</span>
                          <strong>
                            {mostrar(complemento.IP_YCS)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>Número de serie</span>
                          <strong>
                            {mostrar(complemento.NUMERO_SERIE)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>Código de activación</span>
                          <strong>
                            {mostrar(complemento.CODIGO_ACTIVACION)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>Estado</span>
                          <strong>
                            {mostrar(complemento.ESTADO)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>Fecha de registro</span>
                          <strong>
                            {formatearFecha(complemento.FECHA_REGISTRO)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>Fecha asignación</span>
                          <strong>
                            {formatearFecha(complemento.FECHA_ASIGNACION)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>Fecha baja</span>
                          <strong>
                            {formatearFecha(complemento.FECHA_BAJA)}
                          </strong>
                        </div>

                        <div className="detalle-item">
                          <span>Comentarios</span>
                          <strong>
                            {mostrar(complemento.COMENTARIOS)}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="pos-complemento-editar"
                          onClick={() => abrirModalComplemento(complemento)}
                        >
                          Editar complemento
                        </button>

                      </div>

                    ))

                  )}

                </div>
              )}

            </div>
          )}

        </div>


        {/* ======================================
            FECHAS Y GARANTÍA
        ====================================== */}

        <div className="card">

          <h2>Fechas y garantía</h2>


          <div className="detalle-item">

            <span>Fecha fabricación</span>

            <strong>
              {formatearFecha(
                equipo.FECHA_FABRICACION
              )}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Fecha inicio garantía</span>

            <strong>
              {formatearFecha(
                equipo.FECHA_GARANTIA
              )}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Fecha inicio uso</span>

            <strong>
              {formatearFecha(
                equipo.FECHA_INICIO
              )}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Fecha registro</span>

            <strong>
              {formatearFecha(
                equipo.FECHA_REGISTRO
              )}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Tiempo de uso</span>

            <strong>

              {equipo.Auso !== null &&
                equipo.Auso !== undefined

                ? `${equipo.Auso} días`

                : "N/A"

              }

            </strong>

          </div>


          <div className="detalle-item">

            <span>Garantía restante</span>

            <strong>

              {equipo.Grestante !== null &&
                equipo.Grestante !== undefined

                ? `${equipo.Grestante} días`

                : "N/A"

              }

            </strong>

          </div>

        </div>


        {/* ======================================
            HARDWARE
        ====================================== */}

        {(esLaptop || esDesktop) && (

          <div className="card">

            <h2>Hardware</h2>


            <div className="detalle-item">

              <span>Procesador</span>

              <strong>
                {mostrar(equipo.PROCESADOR)}
              </strong>

            </div>


            <div className="detalle-item">

              <span>Modelo procesador</span>

              <strong>
                {mostrar(equipo.MODELO_PROCESADOR)}
              </strong>

            </div>


            <div className="detalle-item">

              <span>RAM</span>

              <strong>
                {mostrar(equipo.MEMORIA_RAM)}
              </strong>

            </div>


            <div className="detalle-item">

              <span>Disco duro</span>

              <strong>
                {mostrar(equipo.DISCO_DURO)}
              </strong>

            </div>


            <div className="detalle-item">

              <span>Lector de huella</span>

              <strong>
                {mostrar(equipo.LECTOR_DE_HUELLA)}
              </strong>

            </div>

          </div>

        )}


        {/* ======================================
            IMPRESORA / RED
        ====================================== */}

        {mostrarIP && (

          <div className="card">

            {
              esImpresora ? (

                <h2>Impresora</h2>

              ) : (

                <h2>Red</h2>

              )
            }


            <div className="detalle-item">

              <span>Tipo impresora</span>

              <strong>
                {mostrar(equipo.TIPO_IMPRESORA)}
              </strong>

            </div>


            <div className="detalle-item">

              <span>Conexión</span>

              <strong>
                {mostrar(equipo.CONEXION)}
              </strong>

            </div>


            <div className="detalle-item">

              <span>IP</span>

              <strong>
                {mostrar(equipo.IP)}
              </strong>

            </div>


            <div className="detalle-item">

              <span>Puerto</span>

              <strong>
                {mostrar(equipo.PUERTO)}
              </strong>

            </div>

          </div>

        )}


        {/* ======================================
            ACCESOS REMOTOS
        ====================================== */}

        {(esPantallaPOS ||
          esWorkstationpos ||
          esTabletPOS) && (

            <div className="card">

              <h2>Accesos remotos</h2>


              <div className="detalle-item">

                <span>Acceso TeamViewer</span>

                <strong>
                  {mostrar(
                    equipo.ACCESO_TEAM_VIEWER
                  )}
                </strong>

              </div>


              <div className="detalle-item">

                <span>Contraseña TeamViewer</span>

                <strong>
                  {mostrar(
                    equipo.CONTRASEÑA_TEAM_VIEWER
                  )}
                </strong>

              </div>


              <div className="detalle-item">

                <span>Acceso AnyDesk</span>

                <strong>
                  {mostrar(
                    equipo.ACCESO_ANYDESK
                  )}
                </strong>

              </div>


              <div className="detalle-item">

                <span>Contraseña AnyDesk</span>

                <strong>
                  {mostrar(
                    equipo.CONTRASEÑA_ANYDESK
                  )}
                </strong>

              </div>

            </div>

          )}


        {/* ======================================
            ESTADO
        ====================================== */}

        <div className="card">

          <h2>Estado</h2>


          <div className="detalle-item">

            <span>Estatus</span>

            <strong>
              {mostrar(equipo.ESTATUS)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Estado físico</span>

            <strong>
              {mostrar(equipo.ESTADO_FISICO)}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Responsiva digital</span>

            <strong>
              {equipo.RESPONSIVA_DIGITAL
                ? "Sí"
                : "No"}
            </strong>

          </div>


          <div className="detalle-item">

            <span>Número responsiva</span>

            <strong>

              {equipo.NUM_RESPONSIVA

                ? `RESP-${String(
                  equipo.NUM_RESPONSIVA
                ).padStart(5, "0")}`

                : "N/A"

              }

            </strong>

          </div>

        </div>


        {/* ======================================
            HISTORIAL RESPONSIVAS
        ====================================== */}

        <div className="card">

          <h2>Historial de responsivas</h2>


          {responsivasEquipo.historial.length === 0 ? (

            <p className="comentario">
              Sin historial de responsivas.
            </p>

          ) : (

            responsivasEquipo.historial.map((item) => (

              <div
                className="detalle-item"
                key={item.IdDetalle}
              >

                <span>

                  RESP-
                  {String(
                    item.IdResponsiva
                  ).padStart(5, "0")}

                </span>


                <strong>

                  {item.NombreReceptor} /{" "}

                  {item.Devuelto
                    ? "Devuelto"
                    : "Activo"}

                </strong>

              </div>

            ))

          )}

        </div>


        {/* ======================================
            FOTO
        ====================================== */}

        <div className="card card-foto">

          <h2>Foto del equipo</h2>


          {equipo.FOTO && (

            <div className="contenedor-foto-detalle">

              <img
                src={`data:image/png;base64,${equipo.FOTO}`}
                alt="Equipo"
                width={250}
                height={250}
                className="foto-equipo"
              />

            </div>

          )}

        </div>


        {/* ======================================
            COMENTARIOS
        ====================================== */}

        <div className="card">

          <h2>Comentarios</h2>

          <p className="comentario">

            {equipo.COMENTARIO ||
              "Sin comentarios registrados."}

          </p>

        </div>


      </div>
      {mostrarModalComplemento &&
        complementoSeleccionado && (

          <div className="pos-modal-overlay">

            <div className="pos-modal">

              <div className="pos-modal-header">

                <h2>
                  {modoComplemento === "crear"
                    ? "Agregar complemento POS"
                    : "Editar complemento POS"}
                </h2>

                <button
                  type="button"
                  className="pos-modal-close"
                  onClick={cerrarModalComplemento}
                  disabled={guardandoComplemento}
                >
                  ×
                </button>

              </div>

              <div className="pos-modal-body">

                <div className="detalle-item">
                  <label>
                    Terminal YCS
                  </label>

                  <input
                    type="text"
                    name="TERMINAL_YCS"
                    value={
                      complementoSeleccionado.TERMINAL_YCS || ""
                    }
                    onChange={manejarCambioComplemento}
                  />
                </div>

                <div className="detalle-item">
                  <label>
                    Instalación NoBreak
                  </label>

                  <input
                    type="text"
                    name="INSTALACION_NOBREAK"
                    value={
                      complementoSeleccionado.INSTALACION_NOBREAK || ""
                    }
                    onChange={manejarCambioComplemento}
                  />
                </div>

                <div className="detalle-item">
                  <label>
                    IP YCS
                  </label>

                  <input
                    type="text"
                    name="IP_YCS"
                    value={
                      complementoSeleccionado.IP_YCS || ""
                    }
                    onChange={manejarCambioComplemento}
                  />
                </div>

                <div className="detalle-item">
                  <label>
                    Número de serie
                  </label>

                  <input
                    type="text"
                    name="NUMERO_SERIE"
                    value={
                      complementoSeleccionado.NUMERO_SERIE || ""
                    }
                    onChange={manejarCambioComplemento}
                  />
                </div>

                <div className="detalle-item">
                  <label>
                    Código de activación
                  </label>

                  <input
                    type="text"
                    name="CODIGO_ACTIVACION"
                    value={
                      complementoSeleccionado.CODIGO_ACTIVACION || ""
                    }
                    onChange={manejarCambioComplemento}
                  />
                </div>

                <div className="detalle-item">
                  <label>
                    Estado
                  </label>

                  <select
                    name="ESTADO"
                    value={
                      complementoSeleccionado.ESTADO || "Nueva"
                    }
                    onChange={manejarCambioComplemento}
                  >
                    <option value="Nueva">
                      Nueva
                    </option>

                    <option value="Asignada">
                      Asignada
                    </option>

                    <option value="Dañada">
                      Dañada
                    </option>
                  </select>
                </div>

                <div className="detalle-item">
                  <label>
                    Comentarios
                  </label>

                  <textarea
                    name="COMENTARIOS"
                    rows="4"
                    value={
                      complementoSeleccionado.COMENTARIOS || ""
                    }
                    onChange={manejarCambioComplemento}
                  />
                </div>

              </div>

              <div className="pos-modal-footer">

                <button
                  type="button"
                  onClick={cerrarModalComplemento}
                  disabled={guardandoComplemento}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="pos-modal-guardar"
                  onClick={guardarComplemento}
                  disabled={guardandoComplemento}
                >
                  {guardandoComplemento
                    ? "Guardando..."
                    : modoComplemento === "crear"
                      ? "Agregar complemento"
                      : "Guardar cambios"}
                </button>

              </div>

            </div>

          </div>

        )}

    </div>

  );

}


export default InventarioDetallePage;

