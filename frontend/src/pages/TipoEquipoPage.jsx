import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerTiposEquipo,
  crearTipoEquipo,
  actualizarTipoEquipo,
  eliminarTipoEquipo
} from "../services/tipoEquipoService";
import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function TipoEquipoPage({ setLoading }) {
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [tequipo, setTequipo] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const cargarTiposEquipo = async () => {
    try {
      setLoading(true);
      const data = await obtenerTiposEquipo();
      setTiposEquipo(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cargar listado de tipo equipo")
    }finally{
      setLoading(false);
    }
    
  };

  useEffect(() => {
    cargarTiposEquipo();
  }, []);

  const tipoEquipoFiltrados = useMemo(()=> {
    const texto = busqueda.toLocaleLowerCase().trim();
    if(!texto) return tiposEquipo;

    return tiposEquipo.filter((item)=>
      item.tequipo.toLocaleLowerCase().includes(texto)
    );
  }, [busqueda, tiposEquipo]

  );

  const limpiarFormulario = () => {
    setTequipo("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarTipoEquipo = async (e) => {
    e.preventDefault();

    if (!tequipo.trim()) {
      toast.warning("Escribe un tipo de equipo");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        tequipo: tequipo.trim()
      };

      if (modoEdicion) {
        await actualizarTipoEquipo(idEditando, payload);
        toast.success("Tipo de equipo actualizado correctamente");
      } else {
        await crearTipoEquipo(payload);
        toast.success("Tipo de equipo creado correctamente");
      }

      limpiarFormulario();
      await cargarTiposEquipo();
    } catch (error) {
      console.error("Error guardando tipo de equipo:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error guardando tipo de equipo");
    }finally{
      setLoading(false);
    }
  };

  const editarTipoEquipo = (item) => {
    setTequipo(item.tequipo);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarTipoEquipo = async (id) => {
    if (!window.confirm("¿Deseas eliminar este tipo de equipo?")) return;

    try {
      setLoading(true);
      await eliminarTipoEquipo(id);
      await cargarTiposEquipo();
      toast.success("Tipo de equipo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando tipo de equipo:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error eliminando tipo de equipo");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Tipos de equipo</h1>
          <p>Catálogo de tipos de equipo del inventario.</p>
        </div>
      </div>

      <div className="card">
       <h2>{modoEdicion ? "Editar tipo de equipo" : "Agregar tipo de equipo"}</h2>

        <form onSubmit={guardarTipoEquipo} className="form-grid">
          <input
            placeholder="Tipo de equipo"
            value={tequipo}
            onChange={(e) => setTequipo(e.target.value)}
          />
        <input
        className="search-input"
        placeholder="Buscar tipo de equipo..."
        value={busqueda}
        onChange={(e)=>setBusqueda(e.target.value)}
      />

          <button type="submit">
            {modoEdicion ? "Actualizar tipo" : "Guardar tipo"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
        
        <br></br>
        <h2>Listado de tipos de equipo</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo equipo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {tipoEquipoFiltrados.slice(0,6).map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.tequipo}</td>
                  <td>
                    <CatalogoActions
                      item={item}
                      onEditar={editarTipoEquipo}
                      onEliminar={borrarTipoEquipo}
                      />
                  </td>
                </tr>
              ))}

              {tipoEquipoFiltrados.length === 0 && (
                <tr>
                  <td colSpan="3">No hay tipos de equipo registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TipoEquipoPage;