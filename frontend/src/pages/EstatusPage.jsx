import { useEffect, useState } from "react";
import {
  obtenerEstatus,
  crearEstatus,
  actualizarEstatus,
  eliminarEstatus
} from "../services/estatusService";
import "./InventarioPage.css";

function EstatusPage() {

  const [estatus, setEstatus] = useState([]);
  const [nombre, setNombre] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarEstatus = async () => {
    const data = await obtenerEstatus();
    setEstatus(data);
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

      const payload = {
        Estatus_equipo: nombre
      };

      if (modoEdicion) {
        await actualizarEstatus(idEditando, payload);
      } else {
        await crearEstatus(payload);
      }

      limpiarFormulario();
      await cargarEstatus();

    } catch (error) {

      console.error(error);
      alert("Error guardando estatus");

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

    await eliminarEstatus(id);
    await cargarEstatus();
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