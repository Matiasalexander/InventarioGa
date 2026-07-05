import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerModelos,
  crearModelo,
  actualizarModelo,
  eliminarModelo
} from "../services/modelosService";
import { obtenerCatalogos } from "../services/catalogosService";
import "../styles/InventarioPage.css";

function ModelosPage({ setLoading }) {
  const [modelos, setModelos] = useState([]);

  const [catalogos, setCatalogos] = useState({
    tiposEquipo: [],
    marcas: [],
    modelosEspeciales: []
  });

  const [formulario, setFormulario] = useState({
    id_tequipo: "",
    id_marca: "",
    id_modelos: ""
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const modelosData = await obtenerModelos();
      const catalogosData = await obtenerCatalogos();

      setModelos(modelosData);
      setCatalogos(catalogosData);
    } catch (error) {
      console.error("Error cargando modelos:", error.response?.data || error);
      toast.error("Error al cargar listado de modelos");
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormulario({
      id_tequipo: "",
      id_marca: "",
      id_modelos: ""
    });

    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarModelo = async (e) => {
    e.preventDefault();

    if (!formulario.id_tequipo || !formulario.id_marca || !formulario.id_modelos) {
      toast.warning("Selecciona tipo de equipo, marca y modelo");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        id_tequipo: formulario.id_tequipo,
        id_marca: formulario.id_marca,
        id_modelos: formulario.id_modelos
      };

      if (modoEdicion) {
        await actualizarModelo(idEditando, payload);
        toast.success("Modelo actualizado correctamente");
      } else {
        await crearModelo(payload);
        toast.success("Modelo creado correctamente");
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      console.error("Error guardando modelo:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error guardando modelo");
    }finally{
      setLoading(false);
    }
  };

  const editarModelo = (item) => {
    setFormulario({
      id_tequipo: item.id_tequipo || "",
      id_marca: item.id_marca || "",
      id_modelos: item.id_modelos || ""
    });

    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarModelo = async (id) => {
    if (!window.confirm("¿Deseas eliminar este modelo?")) return;

    try {
      setLoading(true);
      await eliminarModelo(id);
      await cargarDatos();
      toast.success("Modelo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando modelo:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error eliminando modelo");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Modelos</h1>
          <p>Relaciona tipo de equipo, marca y modelo específico.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar modelo" : "Agregar modelo"}</h2>

        <form onSubmit={guardarModelo} className="form-grid">
          <select
            name="id_tequipo"
            value={formulario.id_tequipo}
            onChange={manejarCambio}
          >
            <option value="">Selecciona tipo de equipo</option>

            {catalogos.tiposEquipo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.tequipo}
              </option>
            ))}
          </select>

          <select
            name="id_marca"
            value={formulario.id_marca}
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
            name="id_modelos"
            value={formulario.id_modelos}
            onChange={manejarCambio}
          >
            <option value="">Selecciona modelo</option>

            {catalogos.modelosEspeciales.map((item) => (
              <option key={item.id} value={item.id}>
                {item.Mod_esp}
              </option>
            ))}
          </select>

          <button type="submit">
            {modoEdicion ? "Actualizar modelo" : "Guardar modelo"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
        <br></br>

        <h2>Listado de modelos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo equipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {modelos.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.tequipo}</td>
                  <td>{item.Marca}</td>
                  <td>{item.Modelo}</td>
                  <td>
                    <button type="button" onClick={() => editarModelo(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => borrarModelo(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {modelos.length === 0 && (
                <tr>
                  <td colSpan="5">No hay modelos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ModelosPage;