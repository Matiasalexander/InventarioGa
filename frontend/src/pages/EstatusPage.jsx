import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerEstatus,
  crearEstatus,
  actualizarEstatus,
  eliminarEstatus
} from "../services/estatusService";
import "./InventarioPage.css";

function EstatusPage({ setLoading }) {

  const [estatus, setEstatus] = useState([]);
  const [nombre, setNombre] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarEstatus = async () => {
    try {
      // setLoading(true);
      const data = await obtenerEstatus();
      setEstatus(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cargar listado de estatus")
    }finally{
      // setLoading(false);
    }
    
  };

  useEffect(() => {
    cargarEstatus();
  }, []);

  const limpiarFormulario = () => {
    setNombre("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarEstatus = async (e) => {
    e.preventDefault();

    try {      
      setLoading(true);
      const payload = {
        Estatus_equipo: nombre
      };

      if (modoEdicion) {
        await actualizarEstatus(idEditando, payload);
        toast.success("Estatus actualizado correctamente");
      } else {
        await crearEstatus(payload);
        toast.success("Estatus creado correctamente");
      }

      limpiarFormulario();
      await cargarEstatus();

    } catch (error) {

      console.error(error);
      toast.error("Error guardando estatus");

    }finally{
      setLoading(false);
    }
  };

  const editarEstatus = (item) => {
    setNombre(item.Estatus_equipo);
    setModoEdicion(true);
    setIdEditando(item.Id);
  };

  const borrarEstatus = async (id) => {

    if (!window.confirm("¿Eliminar estatus?")) {
      return;
    }
    try {
      setLoading(true);
      await eliminarEstatus(id);
      await cargarEstatus();
      toast.success("Estatus eliminado correctamente");

    } catch (error) {
      console.error("Error eliminando estatus:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error eliminando estatus");
    }finally{
      setLoading(false);
    }

    
  };

  return (
    <div className="contenedor">

      <div className="header">
        <div>
          <h1>Estatus</h1>
          <p>Catálogo de estatus de equipos.</p>
        </div>
      </div>

      <div className="card">

        <form onSubmit={guardarEstatus} className="form-grid">

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del estatus"
          />

          <button type="submit">
            {modoEdicion
              ? "Actualizar"
              : "Guardar"}
          </button>

          {
            modoEdicion && (
              <button
                type="button"
                onClick={limpiarFormulario}
              >
                Cancelar
              </button>
            )
          }

        </form>

      </div>

      <div className="card">

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>

            {
              estatus.map((item) => (
                <tr key={item.Id}>

                  <td>{item.Id}</td>

                  <td>{item.Estatus_equipo}</td>

                  <td>

                    <button
                      onClick={() => editarEstatus(item)}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => borrarEstatus(item.Id)}
                    >
                      Eliminar
                    </button>

                  </td>

                </tr>
              ))
            }

          </tbody>
        </table>

      </div>

    </div>
  );
}

export default EstatusPage;