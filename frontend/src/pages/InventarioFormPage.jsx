import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  crearInventario,
  actualizarInventario,
  obtenerInventarioPorId
} from "../services/inventarioService";
import { obtenerCatalogos } from "../services/catalogosService";
import "../styles/InventarioFormPage.css";

function InventarioFormPage({ setLoading }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const estadosFisicos = ["Bueno", "Regular", "Dañado"];
  const tiposRam = ["4GB", "8GB", "16GB", "32GB", "64GB"];
  const tiposDisco = ["128G", "512G", "1TB", "2TB"];
  const tiposSistemas = ["Windows", "Android", "Linux"];
  const tiposImpresoras = [
    "Impresora térmica",
    "Impresora de impacto",
    "Impresora en general"
  ];
  const tiposConexiones = ["wifi", "Bluetooth", "Ethernet", "Serial", "Serial y Ethernet"];

  const [errorSerial, setErrorSerial] = useState("");

  const [catalogos, setCatalogos] = useState({
    restaurantes: [],
    unidades: [],
    tiposEquipo: [],
    marcas: [],
    modelos: [],
    estatus: [],
    departamentos: [],
    procesadores: [],
    modelosProcesador: []
  });

  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState([]);
  const [modelosProcesadorFiltrados, setModelosProcesadorFiltrados] = useState([]);

  const [formulario, setFormulario] = useState({
    ID_RESTAURANTE: "",
    ID_UNIDAD: "",
    LOCALIDAD: "",
    UBICACION: "",
    ID_TIPO_EQUIPO: "",
    NOMBRE_EQUIPO: "",
    ID_DEPARTAMENTO: "",
    PUESTO: "",
    SERIAL: "",
    FECHA_FABRICACION: "",
    FECHA_GARANTIA: "",
    FECHA_INICIO: "",
    FECHA_REGISTRO: "",
    Grestante: "",
    Auso: "",
    DISCO_DURO: "",
    RAM: "",
    ID_PROCESADOR: "",
    MODELO_PROCESADOR: "",
    SISTEMA_OPERATIVO: "",
    TIPO_IMPRESORA: "",
    CONEXION: "",
    ID_MARCA: "",
    MODELO: "",
    IP: "",
    PUERTO: "",
    ID_ESTATUS: "",
    ESTADO_FISICO: "",
    CORREO: "",
    ACCESO_TEAM_VIEWER: "",
    CONTRASEÑA_TEAM_VIEWER: "",
    ACCESO_ANYDESK: "",
    CONTRASEÑA_ANYDESK: "",
    COMENTARIO: ""
  });

  const normalizarTexto = (valor) => {
    return (valor || "")
      .toString()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  };

  const restauranteSeleccionado = catalogos.restaurantes.find(
    (item) => String(item.Id) === String(formulario.ID_RESTAURANTE)
  );

  const esCorporativoCancun =
    normalizarTexto(restauranteSeleccionado?.Restaurante) === "CORPORATIVO" &&
    normalizarTexto(formulario.LOCALIDAD) === "CANCUN";

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    return String(fecha).split("T")[0];
  };

  const cargarCatalogos = async () => {
    const data = await obtenerCatalogos();
    setCatalogos(data);
    return data;
  };

  const cargarEquipo = async (catalogosData) => {
    if (!esEdicion) return;

    const equipo = await obtenerInventarioPorId(id);

    const unidadSeleccionada = catalogosData.unidades.find(
      (item) => String(item.id) === String(equipo.ID_UNIDAD)
    );

    const localidades = catalogosData.unidades.filter(
      (item) => String(item.id_marca) === String(unidadSeleccionada?.id_marca)
    );

    const modelos = catalogosData.modelos.filter(
      (item) => String(item.id_marca) === String(equipo.ID_MARCA)
    );

    const modelosProcesador = catalogosData.modelosProcesador.filter(
      (item) => String(item.Id_procesador) === String(equipo.ID_PROCESADOR)
    );

    setLocalidadesFiltradas(localidades);
    setModelosFiltrados(modelos);
    setModelosProcesadorFiltrados(modelosProcesador);

    setFormulario({
      ID_RESTAURANTE: unidadSeleccionada?.id_marca || "",
      ID_UNIDAD: equipo.ID_UNIDAD || "",
      LOCALIDAD: equipo.LOCALIDAD || "",
      UBICACION: equipo.UBICACION || "",
      ID_TIPO_EQUIPO: equipo.ID_TIPO_EQUIPO || "",
      NOMBRE_EQUIPO: equipo.NOMBRE_EQUIPO || "",
      ID_DEPARTAMENTO: equipo.ID_DEPARTAMENTO || "",
      PUESTO: equipo.PUESTO || "",
      SERIAL: equipo.SERIAL || "",
      FECHA_FABRICACION: formatearFecha(equipo.FECHA_FABRICACION),
      FECHA_GARANTIA: formatearFecha(equipo.FECHA_GARANTIA),
      FECHA_INICIO: formatearFecha(equipo.FECHA_INICIO),
      FECHA_REGISTRO: formatearFecha(equipo.FECHA_REGISTRO),
      Grestante: equipo.Grestante ?? "",
      Auso: equipo.Auso ?? "",
      DISCO_DURO: equipo.DISCO_DURO || "",
      RAM: equipo.RAM || "",
      ID_PROCESADOR: equipo.ID_PROCESADOR || "",
      MODELO_PROCESADOR: equipo.MODELO_PROCESADOR || "",
      SISTEMA_OPERATIVO: equipo.SISTEMA_OPERATIVO || "",
      TIPO_IMPRESORA: equipo.TIPO_IMPRESORA || "",
      CONEXION: equipo.CONEXION || "",
      ID_MARCA: equipo.ID_MARCA || "",
      MODELO: equipo.MODELO || "",
      IP: equipo.IP || "",
      PUERTO: equipo.PUERTO || "",
      ID_ESTATUS: equipo.ID_ESTATUS || "",
      ESTADO_FISICO: equipo.ESTADO_FISICO || "",
      CORREO: equipo.CORREO || "",
      ACCESO_TEAM_VIEWER: equipo.ACCESO_TEAM_VIEWER || "",
      CONTRASEÑA_TEAM_VIEWER: equipo.CONTRASEÑA_TEAM_VIEWER || "",
      ACCESO_ANYDESK: equipo.ACCESO_ANYDESK || "",
      CONTRASEÑA_ANYDESK: equipo.CONTRASEÑA_ANYDESK || "",
      COMENTARIO: equipo.COMENTARIO || ""
    });
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const data = await cargarCatalogos();
        await cargarEquipo(data);
      } catch (error) {
        console.error("Error cargando formulario:", error);
        toast.error("Error cargando formulario");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (name === "SERIAL") {
      setErrorSerial("");
    }

    if (name === "ID_RESTAURANTE") {
      const localidades = catalogos.unidades.filter(
        (item) => String(item.id_marca) === String(value)
      );

      setLocalidadesFiltradas(localidades);

      setFormulario((prev) => ({
        ...prev,
        ID_RESTAURANTE: value,
        ID_UNIDAD: "",
        LOCALIDAD: "",
        UBICACION: "",
        ID_DEPARTAMENTO: "",
        PUESTO: ""
      }));

      return;
    }

    if (name === "ID_UNIDAD") {
      const unidadSeleccionada = catalogos.unidades.find(
        (item) => String(item.id) === String(value)
      );

      setFormulario((prev) => ({
        ...prev,
        ID_UNIDAD: value,
        LOCALIDAD: unidadSeleccionada?.localidad || "",
        UBICACION: "",
        ID_DEPARTAMENTO: "",
        PUESTO: ""
      }));

      return;
    }

    if (name === "ID_MARCA") {
      const modelos = catalogos.modelos.filter(
        (item) => String(item.id_marca) === String(value)
      );

      setModelosFiltrados(modelos);

      setFormulario((prev) => ({
        ...prev,
        ID_MARCA: value,
        MODELO: ""
      }));

      return;
    }

    if (name === "ID_PROCESADOR") {
      const modelos = catalogos.modelosProcesador.filter(
        (item) => String(item.Id_procesador) === String(value)
      );

      setModelosProcesadorFiltrados(modelos);

      setFormulario((prev) => ({
        ...prev,
        ID_PROCESADOR: value,
        MODELO_PROCESADOR: ""
      }));

      return;
    }

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarEquipo = async (e) => {
    e.preventDefault();

    setErrorSerial("");

    try {
      setLoading(true);

      const payload = {
        ID_UNIDAD: formulario.ID_UNIDAD,
        LOCALIDAD: formulario.LOCALIDAD,

        UBICACION: esCorporativoCancun
          ? "NA"
          : formulario.UBICACION || "NA",

        ID_TIPO_EQUIPO: formulario.ID_TIPO_EQUIPO,

        ID_DEPARTAMENTO: esCorporativoCancun
          ? formulario.ID_DEPARTAMENTO || null
          : null,

        PUESTO: esCorporativoCancun
          ? formulario.PUESTO || "NA"
          : "NA",

        SERIAL: formulario.SERIAL,
        FECHA_FABRICACION: formulario.FECHA_FABRICACION,
        FECHA_GARANTIA: formulario.FECHA_GARANTIA,
        FECHA_INICIO: formulario.FECHA_INICIO,
        DISCO_DURO: formulario.DISCO_DURO,
        RAM: formulario.RAM,
        ID_PROCESADOR: formulario.ID_PROCESADOR,
        MODELO_PROCESADOR: formulario.MODELO_PROCESADOR,
        SISTEMA_OPERATIVO: formulario.SISTEMA_OPERATIVO,
        TIPO_IMPRESORA: formulario.TIPO_IMPRESORA,
        CONEXION: formulario.CONEXION,
        ID_MARCA: formulario.ID_MARCA,
        MODELO: formulario.MODELO,
        IP: formulario.IP,
        PUERTO: formulario.PUERTO,
        ID_ESTATUS: formulario.ID_ESTATUS,
        ESTADO_FISICO: formulario.ESTADO_FISICO,
        CORREO: formulario.CORREO,
        ACCESO_TEAM_VIEWER: formulario.ACCESO_TEAM_VIEWER,
        CONTRASEÑA_TEAM_VIEWER: formulario.CONTRASEÑA_TEAM_VIEWER,
        ACCESO_ANYDESK: formulario.ACCESO_ANYDESK,
        CONTRASEÑA_ANYDESK: formulario.CONTRASEÑA_ANYDESK,
        COMENTARIO: formulario.COMENTARIO
      };

      if (esEdicion) {
        await actualizarInventario(id, payload);
        toast.success("Equipo actualizado correctamente");
      } else {
        const data = await crearInventario(payload);
        toast.success(`Equipo agregado correctamente: ${data.NOMBRE_EQUIPO || ""}`);
      }

      navigate("/inventario");
    } catch (error) {
      const mensaje = error.response?.data?.message || "Error guardando el equipo";

      if (mensaje.includes("serie")) {
        setErrorSerial("Este número de serie ya existe");
      }

      console.error("Error guardando equipo:", error.response?.data || error);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  {/*Telefono*/}
  const esTelefono = Number(formulario.ID_TIPO_EQUIPO) === 15;
  {/*Equipos con SO*/}
  const esLaptop = Number(formulario.ID_TIPO_EQUIPO) === 1;
  const esDesktop = Number(formulario.ID_TIPO_EQUIPO) === 2;
  const esTablet = Number(formulario.ID_TIPO_EQUIPO) === 14;  

  {/*Equipos POS*/}
  const esPantallaPOS = Number(formulario.ID_TIPO_EQUIPO) === 4;
  const esWorkstationpos = Number(formulario.ID_TIPO_EQUIPO) === 7;
  const esTabletPOS = Number(formulario.ID_TIPO_EQUIPO) === 13;
  const esKDS = Number(formulario.ID_TIPO_EQUIPO) === 21;

  {/*Equipos que llevan IP*/}
  const  esSwitch = Number(formulario.ID_TIPO_EQUIPO) === 17;
  const esAPS = Number(formulario.ID_TIPO_EQUIPO) === 19;
  const esCCTV = Number(formulario.ID_TIPO_EQUIPO) === 20;

    {/*IMPRESORAS*/}
  const esImpresora = Number(formulario.ID_TIPO_EQUIPO) === 3;
  
  const mostrarIP =
  esSwitch ||
  esAPS ||
  esCCTV ||
  esTabletPOS ||
  esWorkstationpos ||
  esKDS ||
  (esImpresora && formulario.CONEXION === "wifi" || formulario.CONEXION === "Ethernet" || formulario.CONEXION === "Serial y Ethernet");
  {/*Herramientas en general*/}


  const mostrarAccesos = 
  esPantallaPOS ||
  esWorkstationpos ||
  esTabletPOS ||
  esKDS;
  {/*Perifericos*/}

  return (
    <div className="contenedor-responsive">
      <div className="header">
        <div>
          <h1>{esEdicion ? "Actualizar equipo" : "Agregar equipo"}</h1>
          <p>
            {esEdicion
              ? "Modifica los datos del equipo seleccionado."
              : "Registra un nuevo equipo en el inventario."}
          </p>
        </div>

        <button type="button" onClick={() => navigate("/inventario")}>
          Volver al listado
        </button>
      </div>

      <div className="card">
        <form onSubmit={guardarEquipo}>
          <div className="formulario-card">
            <h2>Información general</h2>

            <div className="campo-form">
              <label>Restaurante / marca</label>
              <select
                name="ID_RESTAURANTE"
                value={formulario.ID_RESTAURANTE}
                onChange={manejarCambio}
              >
                <option value="">Selecciona restaurante</option>
                {catalogos.restaurantes.map((item) => (
                  <option key={item.Id} value={item.Id}>
                    {item.Restaurante}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-form">
              <label>Localidad / unidad</label>
              <select
                name="ID_UNIDAD"
                value={formulario.ID_UNIDAD}
                onChange={manejarCambio}
                disabled={!formulario.ID_RESTAURANTE}
              >
                <option value="">Selecciona localidad</option>
                {localidadesFiltradas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.localidad}
                  </option>
                ))}
              </select>
            </div>

            {!esCorporativoCancun && (
              <div className="campo-form">
                <label>Ubicación interna</label>
                <input
                  name="UBICACION"
                  placeholder="Área, oficina, almacén, caja, barra..."
                  value={formulario.UBICACION}
                  onChange={manejarCambio}
                />
              </div>
            )}

            {esCorporativoCancun && (
              <>
                <div className="campo-form">
                  <label>Departamento</label>
                  <select
                    name="ID_DEPARTAMENTO"
                    value={formulario.ID_DEPARTAMENTO}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona departamento</option>
                    {catalogos.departamentos.map((item) => (
                      <option key={item.Id} value={item.Id}>
                        {item.Nombre_departamento}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-form">
                  <label>Puesto</label>
                  <input
                    name="PUESTO"
                    placeholder="Puesto del usuario o área responsable"
                    value={formulario.PUESTO}
                    onChange={manejarCambio}
                  />
                </div>
              </>
            )}
          </div>

          <div className="formulario-card">
            <h2>Identificación del equipo</h2>

            <div className="campo-form">
              <label>Nombre del equipo</label>
              <input
                name="NOMBRE_EQUIPO"
                value={
                  esEdicion
                    ? formulario.NOMBRE_EQUIPO
                    : esCorporativoCancun
                      ? "Se generará automáticamente al guardar"
                      : "NA"
                }
                disabled
              />
              <small>
                Solo se genera automáticamente para Corporativo Cancún.
              </small>
            </div>

            <div className="campo-form">
              <label>Tipo de equipo</label>
              <select
                name="ID_TIPO_EQUIPO"
                value={formulario.ID_TIPO_EQUIPO}
                onChange={manejarCambio}
              >
                <option value="">Selecciona tipo de equipo</option>
                {catalogos.tiposEquipo.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.tequipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-form">
              <label>Fecha de fabricación</label>
              <input
                name="FECHA_FABRICACION"
                type="date"
                value={formulario.FECHA_FABRICACION}
                onChange={manejarCambio}
              />
              <small>
                Se usa para generar automáticamente el nombre del equipo.
              </small>
            </div>

            <div className="campo-form">
              <label>Número de serie</label>
              <input
                name="SERIAL"
                placeholder="Número de serie del equipo"
                value={formulario.SERIAL}
                onChange={manejarCambio}
              />
              {errorSerial && (
                <small style={{ color: "red" }}>{errorSerial}</small>
              )}
            </div>
          </div>

          <div className="formulario-card">
            <h2>Fechas y garantía</h2>

            <div className="campo-form">
              <label>Fecha de vencimiento de garantía</label>
              <input
                name="FECHA_GARANTIA"
                type="date"
                value={formulario.FECHA_GARANTIA}
                onChange={manejarCambio}
              />
              <small>Fecha en la que vence la garantía del equipo.</small>
            </div>

            {/*div className="campo-form">
              <label>Fecha de inicio de uso</label>
              <input
                name="FECHA_INICIO"
                type="date"
                value={formulario.FECHA_INICIO}
                onChange={manejarCambio}
              />
              <small>
                Fecha en la que el equipo fue entregado o comenzó a utilizarse.
              </small>
            </div>*/}

            {esEdicion && (
              <>
                <div className="campo-form">
                  <label>Fecha de registro</label>
                  <input
                    name="FECHA_REGISTRO"
                    value={formulario.FECHA_REGISTRO || ""}
                    disabled
                  />
                  <small>
                    Se genera automáticamente cuando se guarda el equipo.
                  </small>
                </div>

                <div className="campo-form">
                  <label>Tiempo de uso</label>
                  <input
                    name="Auso"
                    value={
                      formulario.Auso !== ""
                        ? `${formulario.Auso} días de uso`
                        : "Sin fecha de inicio"
                    }
                    disabled
                  />
                </div>

                <div className="campo-form">
                  <label>Garantía restante</label>
                  <input
                    name="Grestante"
                    value={
                      formulario.Grestante !== ""
                        ? `${formulario.Grestante} días restantes de garantía`
                        : "Sin fecha de garantía"
                    }
                    disabled
                  />
                </div>
              </>
            )}
          </div>

          <div className="formulario-card">
            <h2>Especificaciones del equipo</h2>

            {(esLaptop || esDesktop || esTablet || esTelefono || esTabletPOS || esWorkstationpos) && (
              <>
              
            <div className="campo-form">
              <label>Sistema operativo</label>
              <select
                name="SISTEMA_OPERATIVO"
                value={formulario.SISTEMA_OPERATIVO || ""}
                onChange={manejarCambio}
              >
                <option value="">Selecciona sistema operativo</option>
                {tiposSistemas.map((sistema) => (
                  <option key={sistema} value={sistema}>
                    {sistema}
                  </option>
                ))}
              </select>
            </div>

                <div className="campo-form">
                  <label>Memoria RAM</label>
                  <select
                    name="RAM"
                    value={formulario.RAM || ""}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona RAM</option>
                    {tiposRam.map((ram) => (
                      <option key={ram} value={ram}>
                        {ram}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-form">
                  <label>Disco duro</label>
                  <select
                    name="DISCO_DURO"
                    value={formulario.DISCO_DURO || ""}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona disco duro</option>
                    {tiposDisco.map((disco) => (
                      <option key={disco} value={disco}>
                        {disco}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-form">
                  <label>Procesador</label>
                  <select
                    name="ID_PROCESADOR"
                    value={formulario.ID_PROCESADOR}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona procesador</option>
                    {catalogos.procesadores.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-form">
                  <label>Modelo de procesador</label>
                  <select
                    name="MODELO_PROCESADOR"
                    value={formulario.MODELO_PROCESADOR || ""}
                    onChange={manejarCambio}
                    disabled={!formulario.ID_PROCESADOR}
                  >
                    <option value="">Selecciona modelo de procesador</option>
                    {modelosProcesadorFiltrados.map((item) => (
                      <option key={item.Id} value={item.Modelo}>
                        {item.Modelo}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
{/*en este bloque se muestran los campos específicos para impresoras y tablets POS, dependiendo del tipo de equipo seleccionado.*/}
            {esImpresora && (
              <>
                <div className="campo-form">
                  <label>Tipo de impresora</label>
                  <select
                    name="TIPO_IMPRESORA"
                    value={formulario.TIPO_IMPRESORA || ""}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona tipo de impresora</option>
                    {tiposImpresoras.map((impresora) => (
                      <option key={impresora} value={impresora}>
                        {impresora}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-form">
                  <label>Tipo de conexión</label>
                  <select
                    name="CONEXION"
                    value={formulario.CONEXION || ""}
                    onChange={manejarCambio}
                  >
                    <option value="">Selecciona tipo de conexión</option>
                    {tiposConexiones.map((conexion) => (
                      <option key={conexion} value={conexion}>
                        {conexion}
                      </option>
                    ))}
                  </select>
                </div>

                {(formulario.CONEXION == "Serial y Ethernet"  || formulario.CONEXION == "Serial") && (
                <div className="campo-form">
                  <label>Puerto</label>
                  <input
                    name="PUERTO"
                    placeholder="Puerto"
                    value={formulario.PUERTO}
                    onChange={manejarCambio}
                  />
                </div>
                )}

              </>
            )}

            { mostrarIP &&(
                <div className="campo-form">
                  <label>IP</label>
                  <input
                    name="IP"
                    placeholder="000.000.0.0"
                    value={formulario.IP}
                    onChange={manejarCambio}
                  />
                </div>
                )}
{/*en este bloque se muestran los campos específicos para tablets POS, dependiendo del tipo de equipo selecionado.*/}
            { mostrarAccesos && (
              <>

                <div className="campo-form">
                  <label>Acceso TeamViewer</label>
                  <input
                    type="number"
                    name="ACCESO_TEAM_VIEWER"
                    placeholder="Acceso TeamViewer"
                    value={formulario.ACCESO_TEAM_VIEWER}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="campo-form">
                  <label>Contraseña TeamViewer</label>
                  <input
                    name="CONTRASEÑA_TEAM_VIEWER"
                    placeholder="Contraseña TeamViewer"
                    value={formulario.CONTRASEÑA_TEAM_VIEWER}
                    disabled={!formulario.ACCESO_TEAM_VIEWER}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="campo-form">
                  <label>Acceso AnyDesk</label>
                  <input
                    type="number"
                    name="ACCESO_ANYDESK"
                    placeholder="Acceso AnyDesk"
                    value={formulario.ACCESO_ANYDESK}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="campo-form">
                  <label>Contraseña AnyDesk</label>
                  <input
                    name="CONTRASEÑA_ANYDESK"
                    placeholder="Contraseña AnyDesk"
                    value={formulario.CONTRASEÑA_ANYDESK}
                    disabled={!formulario.ACCESO_ANYDESK}
                    onChange={manejarCambio}
                  />
                </div>
              </>
            )}
{/*aqui se muestran los campos de marca y modelo, que son comunes para todos los tipos de equipo.*/}


            <div className="campo-form">
              <label>Marca</label>
              <select
                name="ID_MARCA"
                value={formulario.ID_MARCA}
                onChange={manejarCambio}
              >
                <option value="">Selecciona marca</option>
                {catalogos.marcas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.Marca}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-form">
              <label>Modelo</label>
              <select
                name="MODELO"
                value={formulario.MODELO}
                onChange={manejarCambio}
                disabled={!formulario.ID_MARCA}
              >
                <option value="">Selecciona modelo</option>
                {modelosFiltrados.map((item) => (
                  <option key={item.id} value={item.Modelo}>
                    {item.Modelo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="formulario-card">
            <h2>Estado / estatus del equipo</h2>

            <div className="campo-form">
              <label>Estatus</label>
              <select
                name="ID_ESTATUS"
                value={formulario.ID_ESTATUS}
                onChange={manejarCambio}
              >
                <option value="">Selecciona estatus</option>
                {catalogos.estatus.map((item) => (
                  <option key={item.Id} value={item.Id}>
                    {item.Estatus_equipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-form">
              <label>Estado físico</label>
              <select
                name="ESTADO_FISICO"
                value={formulario.ESTADO_FISICO}
                onChange={manejarCambio}
              >
                <option value="">Selecciona estado físico</option>
                {estadosFisicos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-form">
              <label>Correo</label>
              <input
              required
                name="CORREO"
                placeholder="Correo asignado o responsable"
                value={formulario.CORREO}
                onChange={manejarCambio}
              />
            </div>

            <div className="campo-form">
              <label>Comentario</label>
              <input
                name="COMENTARIO"
                placeholder="Observaciones generales"
                value={formulario.COMENTARIO}
                onChange={manejarCambio}
              />
            </div>
          </div>

          <br />

          <button type="submit">
            {esEdicion ? "Actualizar equipo" : "Guardar equipo"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default InventarioFormPage;