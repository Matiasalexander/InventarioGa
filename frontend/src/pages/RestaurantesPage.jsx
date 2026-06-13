import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerRestaurantes,
  crearRestaurante,
  actualizarRestaurante,
  eliminarRestaurante
} from "../services/restaurantesService";
import "./InventarioPage.css";

function RestaurantesPage({ setLoading }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [formulario, setFormulario] = useState({
    Marca: "",
    Estado: "Open"
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarRestaurantes = async () => {
    try {
      setLoading(true);
      const data = await obtenerRestaurantes();
      setRestaurantes(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cargar listado de restaurantes")
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRestaurantes();
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
      Marca: "",
      Estado: "Open"
    });

    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarRestaurante = async (e) => {
    e.preventDefault();

    if (!formulario.Marca.trim()) {
      toast.warning("Escribe el nombre del restaurante");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        Marca: formulario.Marca.trim(),
        Estado: formulario.Estado
      };

      if (modoEdicion) {
        await actualizarRestaurante(idEditando, payload);
        toast.success("Restaurante actualizado correctamente");
      } else {
        await crearRestaurante(payload);
        toast.success("Restaurante creado correctamente");
      }

      limpiarFormulario();
      await cargarRestaurantes();
    } catch (error) {
      console.error("Error guardando restaurante:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error guardando restaurante");
    }finally{
      setLoading(false);
    }
  };

  const editarRestaurante = (item) => {
    setFormulario({
      Marca: item.Marca || "",
      Estado: item.Estado || "Open"
    });

    setModoEdicion(true);
    setIdEditando(item.id_marca);
  };

  const borrarRestaurante = async (id) => {
    if (!window.confirm("¿Deseas eliminar este restaurante?")) return;

    try {
      setLoading(true);
      await eliminarRestaurante(id);
      await cargarRestaurantes();
      toast.success("Restaurante eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando restaurante:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error eliminando restaurante");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Restaurantes</h1>
          <p>Catálogo principal de restaurantes / marcas operativas.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar restaurante" : "Agregar restaurante"}</h2>

        <form onSubmit={guardarRestaurante} className="form-grid">
          <input
            name="Marca"
            placeholder="Nombre del restaurante"
            value={formulario.Marca}
            onChange={manejarCambio}
          />

          <select
            name="Estado"
            value={formulario.Estado}
            onChange={manejarCambio}
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>

          <button type="submit">
            {modoEdicion ? "Actualizar restaurante" : "Guardar restaurante"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de restaurantes</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Restaurante</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {restaurantes.map((item) => (
                <tr key={item.id_marca}>
                  <td>{item.id_marca}</td>
                  <td>{item.Marca}</td>
                  <td>{item.Estado}</td>
                  <td>
                    <button type="button" onClick={() => editarRestaurante(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => borrarRestaurante(item.id_marca)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {restaurantes.length === 0 && (
                <tr>
                  <td colSpan="4">No hay restaurantes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RestaurantesPage;