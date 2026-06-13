import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerUnidades,
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad
} from "../services/unidadesService";
import { obtenerRestaurantes } from "../services/restaurantesService";
import "../styles/InventarioPage.css";

function UnidadesPage({ setLoading }) {
  const [unidades, setUnidades] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);

  const [formulario, setFormulario] = useState({
    id_marca: "",
    Ubicacion: "",
    Estado: "Open"
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const unidadesData = await obtenerUnidades();
      const restaurantesData = await obtenerRestaurantes();

      setUnidades(unidadesData);
      setRestaurantes(restaurantesData);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cargar listas")
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
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
      id_marca: "",
      Ubicacion: "",
      Estado: "Open"
    });

    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarUnidad = async (e) => {
    e.preventDefault();

    if (!formulario.id_marca || !formulario.Ubicacion.trim()) {
      toast.warning("Selecciona restaurante y escribe la ubicación");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        id_marca: formulario.id_marca,
        Ubicacion: formulario.Ubicacion.trim(),
        Estado: formulario.Estado
      };

      if (modoEdicion) {
        await actualizarUnidad(idEditando, payload);
        toast.success("Unidad actualizada correctamente");
      } else {
        await crearUnidad(payload);
        toast.success("Unidad creada correctamente");
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      console.error("Error guardando unidad:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error guardando unidad");
    }finally{
      setLoading(false);
    }
  };

  const editarUnidad = (item) => {
    setFormulario({
      id_marca: item.id_marca || "",
      Ubicacion: item.Ubicacion || "",
      Estado: item.Estado || "Open"
    });

    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarUnidad = async (id) => {
    if (!window.confirm("¿Deseas eliminar esta unidad?")) return;

    try {
      setLoading(true);
      await eliminarUnidad(id);
      await cargarDatos();
      toast.success("Unidad eliminada correctamente");
    } catch (error) {
      console.error("Error eliminando unidad:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error eliminando unidad");
    }finally{
      setLoading(false)
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Unidades</h1>
          <p>Catálogo de localidades asociadas a restaurantes.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar unidad" : "Agregar unidad"}</h2>

        <form onSubmit={guardarUnidad} className="form-grid">
          <select
            name="id_marca"
            value={formulario.id_marca}
            onChange={manejarCambio}
          >
            <option value="">Selecciona restaurante</option>

            {restaurantes.map((item) => (
              <option key={item.id_marca} value={item.id_marca}>
                {item.Marca}
              </option>
            ))}
          </select>

          <input
            name="Ubicacion"
            placeholder="Ubicación / Localidad"
            value={formulario.Ubicacion}
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
            {modoEdicion ? "Actualizar unidad" : "Guardar unidad"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de unidades</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Restaurante</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {unidades.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.Restaurante}</td>
                  <td>{item.Ubicacion}</td>
                  <td>{item.Estado}</td>
                  <td>
                    <button type="button" onClick={() => editarUnidad(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => borrarUnidad(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {unidades.length === 0 && (
                <tr>
                  <td colSpan="5">No hay unidades registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UnidadesPage;