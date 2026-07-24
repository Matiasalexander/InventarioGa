import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerRestaurantes,
  crearRestaurante,
  actualizarRestaurante,
  eliminarRestaurante
} from "../services/restaurantesService";

import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function RestaurantesPage({ setLoading }) {
  const [restaurantes, setRestaurantes] = useState([]);

  const [formulario, setFormulario] = useState({
    Marca: "",
    Estado: "Open"
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("restaurantes.ver");
  const puedeCrear = tienePermiso("restaurantes.crear");
  const puedeEditar = tienePermiso("restaurantes.editar");
  const puedeEliminar = tienePermiso("restaurantes.eliminar");

  const cargarRestaurantes = async () => {
    try {
      setLoading(true);

      const data = await obtenerRestaurantes();

      setRestaurantes(data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar listado de restaurantes"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarRestaurantes();
    }
  }, [puedeVer]);

  const restaurantesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return restaurantes;

    return restaurantes.filter(
      (item) =>
        item.Marca?.toLowerCase().includes(texto) ||
        item.Estado?.toLowerCase().includes(texto)
    );
  }, [busqueda, restaurantes]);

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

    if (modoEdicion && !puedeEditar) {
      toast.warning("No tienes permiso para editar restaurantes.");
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning("No tienes permiso para crear restaurantes.");
      return;
    }

    if (!formulario.Marca.trim()) {
      toast.warning("Escribe el nombre del restaurante.");
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
        toast.success("Restaurante actualizado correctamente.");
      } else {
        await crearRestaurante(payload);
        toast.success("Restaurante creado correctamente.");
      }

      limpiarFormulario();
      await cargarRestaurantes();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error guardando restaurante."
      );
    } finally {
      setLoading(false);
    }
  };

  const editarRestaurante = (item) => {
    if (!puedeEditar) {
      toast.warning("No tienes permiso para editar restaurantes.");
      return;
    }

    setFormulario({
      Marca: item.Marca || "",
      Estado: item.Estado || "Open"
    });

    setModoEdicion(true);
    setIdEditando(item.id_marca);
  };

  const borrarRestaurante = async (id) => {
    if (!puedeEliminar) {
      toast.warning("No tienes permiso para eliminar restaurantes.");
      return;
    }

    if (!window.confirm("¿Deseas eliminar este restaurante?")) return;

    try {
      setLoading(true);

      await eliminarRestaurante(id);

      await cargarRestaurantes();

      toast.success("Restaurante eliminado correctamente.");
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error eliminando restaurante."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!puedeVer) {
    return null;
  }

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Restaurantes</h1>
          <p>Catálogo principal de restaurantes / marcas operativas.</p>
        </div>
      </div>

      {(puedeCrear || (modoEdicion && puedeEditar)) && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar restaurante"
              : "Agregar restaurante"}
          </h2>

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
              {modoEdicion
                ? "Actualizar restaurante"
                : "Guardar restaurante"}
            </button>

            {modoEdicion && (
              <button type="button" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </form>
        </div>
      )}

      <div className="card">
        <input
          className="search-input-f"
          placeholder="Buscar restaurante Ej. Mayan Monkey"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <br />

        <h2>Listado de restaurantes</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Estado</th>

                {(puedeEditar || puedeEliminar) && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {restaurantesFiltrados.map((item) => (
                <tr key={item.id_marca}>
                  <td>{item.Marca}</td>
                  <td>{item.Estado}</td>

                  {(puedeEditar || puedeEliminar) && (
                    <td>
                   <CatalogoActions
                   item={item}
                   onEditar={puedeEditar ? editarRestaurante : null}
                   onEliminar={puedeEliminar ? borrarRestaurante : null}
                  getId={(item) => item.id_marca}
                   />
                    </td>
                  )}
                </tr>
              ))}

              {restaurantesFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      puedeEditar || puedeEliminar ? 3 : 2
                    }
                  >
                    No hay restaurantes registrados.
                  </td>
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