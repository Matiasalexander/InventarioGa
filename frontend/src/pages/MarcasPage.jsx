import { useEffect, useState } from "react";
import {
  obtenerMarcas,
  crearMarca,
  actualizarMarca,
  eliminarMarca
} from "../services/marcasService";
import "./InventarioPage.css";

function MarcasPage() {
  const [marcas, setMarcas] = useState([]);
  const [marca, setMarca] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarMarcas = async () => {
    const data = await obtenerMarcas();
    setMarcas(data);
  };

  useEffect(() => {
    cargarMarcas();
  }, []);

  const limpiarFormulario = () => {
    setMarca("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarMarca = async (e) => {
    e.preventDefault();

    if (!marca.trim()) {
      alert("Escribe una marca");
      return;
    }

    try {
      const payload = {
        Marca: marca.trim()
      };

      if (modoEdicion) {
        await actualizarMarca(idEditando, payload);
        alert("Marca actualizada correctamente");
      } else {
        await crearMarca(payload);
        alert("Marca creada correctamente");
      }

      limpiarFormulario();
      await cargarMarcas();
    } catch (error) {
      console.error("Error guardando marca:", error.response?.data || error);
      alert(error.response?.data?.error || "Error guardando marca");
    }
  };

  const editarMarca = (item) => {
    setMarca(item.Marca);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarMarca = async (id) => {
    if (!window.confirm("¿Deseas eliminar esta marca?")) return;

    try {
      await eliminarMarca(id);
      await cargarMarcas();
      alert("Marca eliminada correctamente");
    } catch (error) {
      console.error("Error eliminando marca:", error.response?.data || error);
      alert(error.response?.data?.error || "Error eliminando marca");
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Marcas</h1>
          <p>Catálogo de marcas de equipos.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar marca" : "Agregar marca"}</h2>

        <form onSubmit={guardarMarca} className="form-grid">
          <input
            placeholder="Nombre de la marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
          />

          <button type="submit">
            {modoEdicion ? "Actualizar marca" : "Guardar marca"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de marcas</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Marca</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {marcas.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.Marca}</td>
                  <td>
                    <button type="button" onClick={() => editarMarca(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => borrarMarca(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {marcas.length === 0 && (
                <tr>
                  <td colSpan="3">No hay marcas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MarcasPage;