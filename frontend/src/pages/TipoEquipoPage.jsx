import { useEffect, useState } from "react";
import {
  obtenerTiposEquipo,
  crearTipoEquipo,
  actualizarTipoEquipo,
  eliminarTipoEquipo
} from "../services/tipoEquipoService";
import "./InventarioPage.css";

function TipoEquipoPage() {
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [tequipo, setTequipo] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarTiposEquipo = async () => {
    const data = await obtenerTiposEquipo();
    setTiposEquipo(data);
  };

  useEffect(() => {
    cargarTiposEquipo();
  }, []);

  const limpiarFormulario = () => {
    setTequipo("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarTipoEquipo = async (e) => {
    e.preventDefault();

    if (!tequipo.trim()) {
      alert("Escribe un tipo de equipo");
      return;
    }

    try {
      const payload = {
        tequipo: tequipo.trim()
      };

      if (modoEdicion) {
        await actualizarTipoEquipo(idEditando, payload);
        alert("Tipo de equipo actualizado correctamente");
      } else {
        await crearTipoEquipo(payload);
        alert("Tipo de equipo creado correctamente");
      }

      limpiarFormulario();
      await cargarTiposEquipo();
    } catch (error) {
      console.error("Error guardando tipo de equipo:", error.response?.data || error);
      alert(error.response?.data?.error || "Error guardando tipo de equipo");
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
      await eliminarTipoEquipo(id);
      await cargarTiposEquipo();
      alert("Tipo de equipo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando tipo de equipo:", error.response?.data || error);
      alert(error.response?.data?.error || "Error eliminando tipo de equipo");
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

          <button type="submit">
            {modoEdicion ? "Actualizar tipo" : "Guardar tipo"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
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
              {tiposEquipo.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.tequipo}</td>
                  <td>
                    <button type="button" onClick={() => editarTipoEquipo(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => borrarTipoEquipo(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {tiposEquipo.length === 0 && (
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