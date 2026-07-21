import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerModelosProcesador,
  crearModeloProcesador,
  actualizarModeloProcesador,
  eliminarModeloProcesador
} from "../services/modelosProcesadorService";
import { obtenerProcesadores } from "../services/procesadoresService";
import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function ModelosProcesadorPage({ setLoading }) {
  const [modelos, setModelos] = useState([]);
  const [procesadores, setProcesadores] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [formulario, setFormulario] = useState({
    Id_procesador: "",
    Modelo: ""
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading?.(true);

      const modelosData = await obtenerModelosProcesador();
      const procesadoresData = await obtenerProcesadores();

      setModelos(modelosData);
      setProcesadores(procesadoresData);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cargar modelos de procesador");
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

 const modelosProcesadoresFiltrados = useMemo(() => {
  const texto = busqueda.toLowerCase().trim();

  if (!texto) return modelos;

  return modelos.filter((item) =>
    (item.Modelo || "").toLowerCase().includes(texto)
  );
}, [busqueda, modelos]);


  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormulario({
      Id_procesador: "",
      Modelo: ""
    });

    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarModelo = async (e) => {
    e.preventDefault();

    if (!formulario.Id_procesador || !formulario.Modelo.trim()) {
      toast.warning("Selecciona procesador y escribe el modelo");
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        Id_procesador: formulario.Id_procesador,
        Modelo: formulario.Modelo.trim()
      };

      if (modoEdicion) {
        await actualizarModeloProcesador(idEditando, payload);
        toast.success("Modelo actualizado correctamente");
      } else {
        await crearModeloProcesador(payload);
        toast.success("Modelo creado correctamente");
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al guardar modelo");
    } finally {
      setLoading?.(false);
    }
  };

  const editarModelo = (item) => {
    setFormulario({
      Id_procesador: item.Id_procesador || "",
      Modelo: item.Modelo || ""
    });

    setModoEdicion(true);
    setIdEditando(item.Id);
  };

  const borrarModelo = async (id) => {
    if (!window.confirm("¿Deseas eliminar este modelo de procesador?")) return;

    try {
      setLoading?.(true);

      await eliminarModeloProcesador(id);
      toast.success("Modelo eliminado correctamente");

      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al eliminar modelo");
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <div className="detail-item">
      <div className="header">
        <div>
          <h1>Modelos de Procesador</h1>
          <p>Catálogo de modelos asociados a cada procesador.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar modelo de procesador" : "Agregar modelo de procesador"}</h2>

        <form onSubmit={guardarModelo} className="form-grid">
          <select
            name="Id_procesador"
            value={formulario.Id_procesador}
            onChange={manejarCambio}
          >
            <option value="">Selecciona procesador</option>

            {procesadores.map((item) => (
              <option key={item.id} value={item.id}>
                {item.Nombre}
              </option>
            ))}
          </select>

          <input
            name="Modelo"
            placeholder="Modelo, ejemplo: Ryzen 7"
            value={formulario.Modelo}
            onChange={manejarCambio}
          />
               <input
        className="search-input"
        placeholder="Buscar modelo de procesador..."
        value={busqueda}
        onChange={(e)=>setBusqueda(e.target.value)}
      />

          <button type="submit">
            {modoEdicion ? "Actualizar modelo" : "Guardar modelo"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de modelos de procesador</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Procesador</th>
                <th>Modelo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {modelosProcesadoresFiltrados.slice(0,7).map((item) => (
                <tr key={item.Id}>
                  <td>{item.Nombre}</td>
                  <td>{item.Modelo}</td>
                  <td>
         <CatalogoActions
         item={item}
         onEditar={editarModelo}
         onEliminar={borrarModelo}
         />
                  </td>
                </tr>
              ))}

              {modelosProcesadoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan="4">No hay modelos de procesador registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ModelosProcesadorPage;