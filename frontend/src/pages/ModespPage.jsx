import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerModesp,
  crearModesp,
  actualizarModesp,
  eliminarModesp
} from "../services/modespService";
import "../styles/InventarioPage.css";

function ModespPage({ setLoading }) {
  const [modelos, setModelos] = useState([]);
  const [modEsp, setModEsp] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarModelos = async () => {
    try {
      setLoading?.(true);
      const data = await obtenerModesp();
      setModelos(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cargar modelos");
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    cargarModelos();
  }, []);

  const limpiarFormulario = () => {
    setModEsp("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarModelo = async (e) => {
    e.preventDefault();

    if (!modEsp.trim()) {
      toast.warning("Escribe el modelo");
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        Mod_esp: modEsp.trim()
      };

      if (modoEdicion) {
        await actualizarModesp(idEditando, payload);
        toast.success("Modelo actualizado correctamente");
      } else {
        await crearModesp(payload);
        toast.success("Modelo creado correctamente");
      }

      limpiarFormulario();
      await cargarModelos();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al guardar modelo");
    } finally {
      setLoading?.(false);
    }
  };

  const editarModelo = (item) => {
    setModEsp(item.Mod_esp);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarModelo = async (id) => {
    if (!window.confirm("¿Deseas eliminar este modelo?")) return;

    try {
      setLoading?.(true);
      await eliminarModesp(id);
      toast.success("Modelo eliminado correctamente");
      await cargarModelos();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al eliminar modelo");
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Modelos base</h1>
          <p>Catálogo base de modelos específicos.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar modelo base" : "Agregar modelo base"}</h2>

        <form onSubmit={guardarModelo} className="form-grid">
          <input
            placeholder="Modelo, ejemplo: LATITUDE 3440"
            value={modEsp}
            onChange={(e) => setModEsp(e.target.value)}
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
        <h2>Listado de modelos base</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Modelo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {modelos.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.Mod_esp}</td>
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
                  <td colSpan="3">No hay modelos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ModespPage;