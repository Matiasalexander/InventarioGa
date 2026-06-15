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

  //const para enums
  const tiposRam = [
    "4GB",
    "8GB",
    "16GB",
    "32GB",
    "64GB"
  ];

  const tiposDisco = [
    "128G", "512G", "1TB", "2TB"
  ];

  const tiposSistemas = [
    "Windows","Android","Linux"
  ];

  const tiposImpresoras = [
    "Serial","Ethernet" , "Blueetoth"
  ];

  const tiposConexiones = [
    "Directo a la pared", "UPS"
  ];

  //si ya hay serial existente
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
    SERIAL: "",
    DISCO_DURO: "",
    RAM: "",
    ID_PROCESADOR: "",
    SISTEMA_OPERATIVO: "",
    TIPO_IMPRESORA: "",
    CONEXION: "",
    Id: "",
    ID_MARCA: "",
    MODELO: "",
    IP: "",
    PUERTO: "",
    ID_ESTATUS: "",
    ESTADO_FISICO: "",
    CORREO: ""
  });

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

setModelosProcesadorFiltrados(modelosProcesador);

    setLocalidadesFiltradas(localidades);
    setModelosFiltrados(modelos);

    setFormulario({
      ID_RESTAURANTE: unidadSeleccionada?.id_marca || "",
      ID_UNIDAD: equipo.ID_UNIDAD || "",
      LOCALIDAD: equipo.LOCALIDAD || "",
      UBICACION: equipo.UBICACION || "",
      ID_TIPO_EQUIPO: equipo.ID_TIPO_EQUIPO || "",
      NOMBRE_EQUIPO: equipo.NOMBRE_EQUIPO || "",
      ID_DEPARTAMENTO: equipo.ID_DEPARTAMENTO || "",
      SERIAL: equipo.SERIAL || "",
      DISCO_DURO: equipo.DISCO_DURO || "",
      RAM: equipo.RAM  || "",
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
      CORREO: equipo.CORREO || ""
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
      }finally{
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
        LOCALIDAD: ""
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
        LOCALIDAD: unidadSeleccionada?.localidad || ""
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
        UBICACION: formulario.UBICACION,
        ID_TIPO_EQUIPO: formulario.ID_TIPO_EQUIPO,
        NOMBRE_EQUIPO: formulario.NOMBRE_EQUIPO,
        ID_DEPARTAMENTO: formulario.ID_DEPARTAMENTO,
        SERIAL: formulario.SERIAL,
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
        CORREO: formulario.CORREO
      };

      if (esEdicion) {
        await actualizarInventario(id, payload);
        toast.success("Equipo actualizado correctamente");
      } else {
        await crearInventario(payload);
        toast.success("Equipo agregado correctamente");
      }

      navigate("/inventario");
    } catch (error) {
      const mensaje = error.response?.data?.message || "ERROR GUARDANDO EL EQUIPO";
      if (mensaje.includes("Numero de serie")) {
        setErrorSerial("Este número de serie ya existe");
      } else {
        toast.error(mensaje);
      }

      console.error("Error guardando equipo:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error guardando equipo");
    }finally{
      setLoading(false);
    }
  };

  //id dependiendo del tipo de equipo.
  const esLaptop = Number(formulario.ID_TIPO_EQUIPO) === 1;
  const esDesktop = Number(formulario.ID_TIPO_EQUIPO) === 2;
  const esImpresora = Number(formulario.ID_TIPO_EQUIPO) === 3;
  const esPOS = Number(formulario.ID_TIPO_EQUIPO) === 4;
  //

  //VISTA FORMULARIO
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

          <div className="card">
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

          <input
            name="UBICACION"
            placeholder="Ubicación interna / área / lugar físico"
            value={formulario.UBICACION}
            onChange={manejarCambio}
          />

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

         
          <div className="card">
            <h2>Especificaciones del equipo: </h2>
 <input
            name="NOMBRE_EQUIPO"
            placeholder="Nombre equipo"
            value={formulario.NOMBRE_EQUIPO}
            onChange={manejarCambio}
          />

          <input
            name="SERIAL"
            placeholder="Serial"
            value={formulario.SERIAL}
            onChange={manejarCambio}
          />


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

          {
            //si es laptop mostrar campos de laptop
            (esLaptop || esDesktop) && (
              <>
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

                <select
                  name="DISCO_DURO"
                  value={formulario.DISCO_DURO || ""}
                  onChange={manejarCambio}
                >
                  <option value="">Selecciona disco duro</option>
                  {
                    tiposDisco.map((disco) => (
                      <option key={disco} value={disco}>
                        {disco}
                      </option>
                    ))
                  }
                </select>

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

                <select
                  name = "MODELO_PROCESADOR"
                  value = {formulario.MODELO_PROCESADOR || ""}
                  onChange={manejarCambio}
                  disabled = {!formulario.ID_PROCESADOR}
                >

                  <option value = "">Selecciona el modelo de procesador</option>
                  {modelosProcesadorFiltrados.map(
                    (item)=> (
                      <option key={item.Id} value={item.Modelo}>
                        {item.Modelo}
                      </option>
                    )
                  )}
                  
                </select>

                <select
                  name="SISTEMA_OPERATIVO"
                  value={formulario.SISTEMA_OPERATIVO || ""}
                  onChange={manejarCambio}
                >
                  <option value="">Selecciona el Sistema Operativo</option>
                  {
                    tiposSistemas.map((sistema)=>(
                      <option key={sistema} value={sistema}>
                        {sistema}
                      </option>
                    )

                    )
                  }
                </select>

              </>
            )
            //si es desktop mostrar campos de desktop
          }

          {
            esImpresora &&(
              <>

               <select
                  name="TIPO_IMPRESORA"
                  value={formulario.TIPO_IMPRESORA || ""}
                  onChange={manejarCambio}
                >
                  <option value="">Selecciona el tipo de impresora: </option>
                  {
                    tiposImpresoras.map((impresora)=>(
                      <option key={impresora} value={impresora}>
                        {impresora}
                      </option>
                    )

                    )
                  }
                </select>

                 <select
                  name="CONEXION"
                  value={formulario.CONEXION || ""}
                  onChange={manejarCambio}
                >
                  <option value="">Selecciona el tipo de conexion</option>
                  {
                    tiposConexiones.map((conexion)=>(
                      <option key={conexion} value={conexion}>
                        {conexion}
                      </option>
                    )

                    )
                  }
                </select>

            <input
            name="IP"
            placeholder="000.000.0.0"
            value={formulario.IP}
            onChange={manejarCambio}
            />

            <input
            name = "PUERTO"
            placeholder="INGRESE PUERTO"
            value={formulario.PUERTO}
            onChange={manejarCambio}
            />

              </>
            )
          }

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

          <input
            name="CORREO"
            placeholder="Correo"
            value={formulario.CORREO}
            onChange={manejarCambio}
          />

          <button type="submit">
            {esEdicion ? "Actualizar equipo" : "Guardar equipo"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default InventarioFormPage;