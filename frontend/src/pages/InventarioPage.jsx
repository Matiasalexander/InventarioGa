import { useEffect, useState } from "react";
import {
  obtenerInventario,
  crearInventario,
  actualizarInventario,
  eliminarInventario
} from "../services/inventarioService";
import { obtenerCatalogos } from "../services/catalogosService";
import "./InventarioPage.css";

function InventarioPage() {
  const [inventario, setInventario] = useState([]);

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

  const estadosFisicos = ["Bueno", "Regular", "Dañado"];

  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState([]);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    ID_RESTAURANTE: "",
    ID_UNIDAD: "",
    LOCALIDAD: "",
    UBICACION: "",
    ID_TIPO_EQUIPO: "",
    NOMBRE_EQUIPO: "",
    ID_DEPARTAMENTO: "",
    SERIAL: "",
    ID_PROCESADOR: "",
    ID_MARCA: "",
    MODELO: "",
    IP: "",
    ID_ESTATUS: "",
    ESTADO_FISICO: "",
    CORREO: ""
  });

  const limpiarFormulario = () => {
    setFormulario({
      ID_RESTAURANTE: "",
      ID_UNIDAD: "",
      LOCALIDAD: "",
      UBICACION: "",
      ID_TIPO_EQUIPO: "",
      NOMBRE_EQUIPO: "",
      ID_DEPARTAMENTO: "",
      SERIAL: "",
      ID_PROCESADOR: "",
      ID_MARCA: "",
      MODELO: "",
      IP: "",
      ID_ESTATUS: "",
      ESTADO_FISICO: "",
      CORREO: ""
    });

    setLocalidadesFiltradas([]);
    setModelosFiltrados([]);
    setModoEdicion(false);
    setIdEditando(null);
  };

  const cargarInventario = async () => {
    const data = await obtenerInventario();
    setInventario(data);
  };

  const cargarCatalogos = async () => {
    const data = await obtenerCatalogos();
    setCatalogos(data);
  };

  useEffect(() => {
    cargarInventario();
    cargarCatalogos();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

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

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarEquipo = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ID_UNIDAD: formulario.ID_UNIDAD,
        LOCALIDAD: formulario.LOCALIDAD,
        UBICACION: formulario.UBICACION,
        ID_TIPO_EQUIPO: formulario.ID_TIPO_EQUIPO,
        NOMBRE_EQUIPO: formulario.NOMBRE_EQUIPO,
        ID_DEPARTAMENTO: formulario.ID_DEPARTAMENTO,
        SERIAL: formulario.SERIAL,
        ID_PROCESADOR: formulario.ID_PROCESADOR,
        ID_MARCA: formulario.ID_MARCA,
        MODELO: formulario.MODELO,
        IP: formulario.IP,
        ID_ESTATUS: formulario.ID_ESTATUS,
        ESTADO_FISICO: formulario.ESTADO_FISICO,
        CORREO: formulario.CORREO
      };

      if (modoEdicion) {
        await actualizarInventario(idEditando, payload);
        alert("Equipo actualizado correctamente");
      } else {
        await crearInventario(payload);
        alert("Equipo agregado correctamente");
      }

      limpiarFormulario();
      await cargarInventario();
    } catch (error) {
      console.error("Error guardando equipo:", error.response?.data || error);
      alert(error.response?.data?.error || "Error guardando equipo");
    }
  };

  const editarEquipo = (item) => {
    const restaurante = catalogos.unidades.find(
      (x) => String(x.id) === String(item.ID_UNIDAD)
    );

    const localidades = catalogos.unidades.filter(
      (x) => String(x.id_marca) === String(restaurante?.id_marca)
    );

    const modelos = catalogos.modelos.filter(
      (x) => String(x.id_marca) === String(item.ID_MARCA)
    );

    setLocalidadesFiltradas(localidades);
    setModelosFiltrados(modelos);

    setFormulario({
      ID_RESTAURANTE: restaurante?.id_marca || "",
      ID_UNIDAD: item.ID_UNIDAD || "",
      LOCALIDAD: item.LOCALIDAD || "",
      UBICACION: item.UBICACION || "",
      ID_TIPO_EQUIPO: item.ID_TIPO_EQUIPO || "",
      NOMBRE_EQUIPO: item.NOMBRE_EQUIPO || "",
      ID_DEPARTAMENTO: item.ID_DEPARTAMENTO || "",
      SERIAL: item.SERIAL || "",
      ID_PROCESADOR: item.ID_PROCESADOR || "",
      ID_MARCA: item.ID_MARCA || "",
      MODELO: item.MODELO || "",
      IP: item.IP || "",
      ID_ESTATUS: item.ID_ESTATUS || "",
      ESTADO_FISICO: item.ESTADO_FISICO || "",
      CORREO: item.CORREO || ""
    });

    setModoEdicion(true);
    setIdEditando(item.id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const borrarEquipo = async (id) => {
    if (!window.confirm("¿Deseas eliminar este equipo?")) return;

    try {
      await eliminarInventario(id);
      await cargarInventario();
      alert("Equipo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando equipo:", error.response?.data || error);
      alert(error.response?.data?.error || "Error eliminando equipo");
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <h1>Inventario GA2</h1>
        <p>Administración de equipos, unidades, marcas y estatus.</p>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar equipo" : "Agregar equipo"}</h2>

        <form onSubmit={guardarEquipo} className="form-grid">
          <select name="ID_RESTAURANTE" value={formulario.ID_RESTAURANTE} onChange={manejarCambio}>
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

          <select name="ID_DEPARTAMENTO" value={formulario.ID_DEPARTAMENTO} onChange={manejarCambio}>
            <option value="">Selecciona departamento</option>
            {catalogos.departamentos.map((item) => (
              <option key={item.Id} value={item.Id}>
                {item.Nombre_departamento}
              </option>
            ))}
          </select>

          <input
            name="NOMBRE_EQUIPO"
            placeholder="Nombre equipo"
            value={formulario.NOMBRE_EQUIPO}
            onChange={manejarCambio}
          />

          <input name="SERIAL" placeholder="Serial" value={formulario.SERIAL} onChange={manejarCambio} />

          <select name="ID_TIPO_EQUIPO" value={formulario.ID_TIPO_EQUIPO} onChange={manejarCambio}>
            <option value="">Selecciona tipo de equipo</option>
            {catalogos.tiposEquipo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.tequipo}
              </option>
            ))}
          </select>

          <select name="ID_MARCA" value={formulario.ID_MARCA} onChange={manejarCambio}>
            <option value="">Selecciona marca</option>
            {catalogos.marcas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.Marca}
              </option>
            ))}
          </select>

          <select name="MODELO" value={formulario.MODELO} onChange={manejarCambio} disabled={!formulario.ID_MARCA}>
            <option value="">Selecciona modelo</option>
            {modelosFiltrados.map((item) => (
              <option key={item.id} value={item.Modelo}>
                {item.Modelo}
              </option>
            ))}
          </select>

          <select name="ID_PROCESADOR" value={formulario.ID_PROCESADOR} onChange={manejarCambio}>
            <option value="">Selecciona procesador</option>
            {catalogos.procesadores.map((item) => (
              <option key={item.id} value={item.id}>
                {item.Nombre}
              </option>
            ))}
          </select>

          <input name="IP" placeholder="IP" value={formulario.IP} onChange={manejarCambio} />

          <select name="ID_ESTATUS" value={formulario.ID_ESTATUS} onChange={manejarCambio}>
            <option value="">Selecciona estatus</option>
            {catalogos.estatus.map((item) => (
              <option key={item.Id} value={item.Id}>
                {item.Estatus_equipo}
              </option>
            ))}
          </select>

          <select name="ESTADO_FISICO" value={formulario.ESTADO_FISICO} onChange={manejarCambio}>
            <option value="">Selecciona estado físico</option>
            {estadosFisicos.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>

          <input name="CORREO" placeholder="Correo" value={formulario.CORREO} onChange={manejarCambio} />

          <button type="submit">
            {modoEdicion ? "Actualizar equipo" : "Guardar equipo"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de equipos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Restaurante</th>
                <th>Localidad</th>
                <th>Ubicación</th>
                <th>Tipo equipo</th>
                <th>Nombre equipo</th>
                <th>Serial</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>IP</th>
                <th>Estatus</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {inventario.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.UNIDAD}</td>
                  <td>{item.LOCALIDAD}</td>
                  <td>{item.UBICACION}</td>
                  <td>{item.TIPO_EQUIPO}</td>
                  <td>{item.NOMBRE_EQUIPO}</td>
                  <td>{item.SERIAL}</td>
                  <td>{item.MARCA}</td>
                  <td>{item.MODELO}</td>
                  <td>{item.IP}</td>
                  <td>{item.ESTATUS}</td>
                  <td>
                    <button type="button" onClick={() => editarEquipo(item)}>
                      Editar
                    </button>
                    <button type="button" onClick={() => borrarEquipo(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {inventario.length === 0 && (
                <tr>
                  <td colSpan="12">No hay equipos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventarioPage;