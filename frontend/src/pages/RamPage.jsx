import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerRam,
  crearRAM,
  actualizarRAM,
  eliminarRAM
} from "../services/ramService";
import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function RamPage({ setLoading }) {
  const [ram, setRam] = useState([]);
  const [capacidad, setCapacidad] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarRam = async () => {
    try {
      setLoading(true);

      const data = await obtenerRam();
      setRam(data);
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Error al cargar listado de memorias ram"
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    cargarRam();
  }, []);

const limpiarFormulario = () => {
  setCapacidad("");
  setModoEdicion(false);
  setIdEditando(null);
};

  const guardarRam = async (e) => {
    e.preventDefault();

    if (!capacidad.trim) {
        toast.warning("Escribe la capacidad");
        return;
    }

    try {
      setLoading(true);

      const payload = {
        capacidad: capacidad.trim()
      };

      if (modoEdicion) {
        await actualizarRAM(idEditando, payload);
        toast.success("Ram actualizada correctamente");
      } else {
        await crearRAM(payload);
        toast.success("Ram creada correctamente");
      }

      limpiarFormulario();
      await cargarRam();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Error al guardar modelo de ram"
      );
    } finally {
      setLoading(false);
    }
  };

  const editarRam = (item) => {
    setCapacidad(item.capacidad);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarRam = async (id) => {
    if (!window.confirm("¿Deseas eliminar este modelo de ram?")) return;

    try {
      setLoading(true);

      await eliminarRAM(id);
      toast.success("modelo de ram eliminado correctamente");

      await cargarRam();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Error al eliminar modelo de ram"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Memorias Ram</h1>
          <p>Catálogo de modelos de memorias ram.</p>
        </div>
      </div>

      <div className="card">
        <h2>
          {modoEdicion ? "Editar modelo de ram" : "Agregar modelo de ram"}
        </h2>

        <form onSubmit={guardarRam} className="form-grid">
        <input
            placeholder="Capacidad de ram (Ej. 6GB, 8GB, 1TB)"
            value={capacidad}
            onChange={(e)=>setCapacidad(e.target.value)}
        />

          <button type="submit">
            {modoEdicion ? "Actualizar modelo de ram" : "Guardar modelo de ram"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de memorias RAM</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>capacidad</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {ram.map((item) => (
                <tr key={item.id}>
                  <td>{item.capacidad}</td>
                  <td>
                  <CatalogoActions
                  item={item}
                  onEditar={editarRam}
                  onEliminar={borrarRam}
                  />
                  </td>
                </tr>
              ))}

              {ram.length === 0 && (
                <tr>
                  <td colSpan="3">No hay memorias ram registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RamPage;