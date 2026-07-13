import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerProcesadores,
  crearProcesador,
  actualizarProcesador,
  eliminarProcesador
} from "../services/procesadoresService";
import "../styles/AreasUnidades.css";
import ModelosProcesadorPage from "./ModelosProcesadorPage";

function ProcesadoresPage({ setLoading }) {
  const [procesadores, setProcesadores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarProcesadores = async () => {
    try {
      setLoading(true);
      const data = await obtenerProcesadores();
      setProcesadores(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cargar listado de procesadores")
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProcesadores();
  }, []);

  const limpiarFormulario = () => {
    setNombre("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarProcesador = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.warning("Escribe un procesador");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        Nombre: nombre.trim()
      };

      if (modoEdicion) {
        await actualizarProcesador(idEditando, payload);
        toast.success("Procesador actualizado correctamente");
      } else {
        await crearProcesador(payload);
        toast.success("Procesador creado correctamente");
      }

      limpiarFormulario();
      await cargarProcesadores();
    } catch (error) {
      console.error("Error guardando procesador:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error guardando procesador");
    }finally{
      setLoading(false);
    }
  };

  const editarProcesador = (item) => {
    setNombre(item.Nombre);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarProcesador = async (id) => {
    if (!window.confirm("¿Deseas eliminar este procesador?")) return;

    try {
      setLoading(true);
      await eliminarProcesador(id);
      await cargarProcesadores();
      toast.success("Procesador eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando procesador:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error eliminando procesador");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="responsive-u">

      <div className="detail-item">
      <div className="header">
        <div>
          <h1>Procesadores</h1>
          <p>Catálogo de procesadores disponibles para equipos.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar procesador" : "Agregar procesador"}</h2>

        <form onSubmit={guardarProcesador} className="form-grid">
          <input
            placeholder="Nombre del procesador"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <button type="submit">
            {modoEdicion ? "Actualizar procesador" : "Guardar procesador"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de procesadores</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Procesador</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {procesadores.map((item) => (
                <tr key={item.id}>
                  <td>{item.Nombre}</td>
                  <td>
                    <button type="button" onClick={() => editarProcesador(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => borrarProcesador(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {procesadores.length === 0 && (
                <tr>
                  <td colSpan="3">No hay procesadores registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

export default ProcesadoresPage;