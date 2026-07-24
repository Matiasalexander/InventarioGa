import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerUnidades,
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad
} from "../services/unidadesService";

import { obtenerRestaurantes } from "../services/restaurantesService";
import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

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
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("unidades.ver");
  const puedeCrear = tienePermiso("unidades.crear");
  const puedeEditar = tienePermiso("unidades.editar");
  const puedeEliminar = tienePermiso("unidades.eliminar");

  /*
   * El selector de restaurantes consume /api/restaurantes.
   * Por eso el usuario también necesita restaurantes.ver.
   */
  const puedeConsultarRestaurantes =
    tienePermiso("restaurantes.ver");

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const unidadesData = puedeVer
        ? await obtenerUnidades()
        : [];

      const restaurantesData = puedeConsultarRestaurantes
        ? await obtenerRestaurantes()
        : [];

      setUnidades(unidadesData || []);
      setRestaurantes(restaurantesData || []);
    } catch (error) {
      console.error(
        "Error cargando unidades:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar las listas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarDatos();
    }
  }, [puedeVer, puedeConsultarRestaurantes]);

  const unidadesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return unidades;

    return unidades.filter(
      (item) =>
        item.Restaurante?.toLowerCase().includes(texto) ||
        item.Ubicacion?.toLowerCase().includes(texto) ||
        item.Estado?.toLowerCase().includes(texto)
    );
  }, [busqueda, unidades]);

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

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar unidades."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear unidades."
      );
      return;
    }

    if (!puedeConsultarRestaurantes) {
      toast.warning(
        "No tienes permiso para consultar restaurantes."
      );
      return;
    }

    if (
      !formulario.id_marca ||
      !formulario.Ubicacion.trim()
    ) {
      toast.warning(
        "Selecciona un restaurante y escribe la ubicación."
      );
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

        toast.success(
          "Unidad actualizada correctamente."
        );
      } else {
        await crearUnidad(payload);

        toast.success(
          "Unidad creada correctamente."
        );
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      console.error(
        "Error guardando unidad:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error guardando la unidad."
      );
    } finally {
      setLoading(false);
    }
  };

  const editarUnidad = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar unidades."
      );
      return;
    }

    setFormulario({
      id_marca: item.id_marca || "",
      Ubicacion: item.Ubicacion || "",
      Estado: item.Estado || "Open"
    });

    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarUnidad = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar unidades."
      );
      return;
    }

    if (!window.confirm("¿Deseas eliminar esta unidad?")) {
      return;
    }

    try {
      setLoading(true);

      await eliminarUnidad(id);
      await cargarDatos();

      toast.success(
        "Unidad eliminada correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando unidad:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error eliminando la unidad."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!puedeVer) {
    return null;
  }

  const mostrarFormulario =
    puedeCrear || (modoEdicion && puedeEditar);

  const mostrarAcciones =
    puedeEditar || puedeEliminar;

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Unidades</h1>

          <p>
            Catálogo de localidades asociadas a restaurantes.
          </p>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar unidad"
              : "Agregar unidad"}
          </h2>

          {!puedeConsultarRestaurantes && (
            <p>
              No tienes permiso para consultar el catálogo de
              restaurantes.
            </p>
          )}

          <form
            onSubmit={guardarUnidad}
            className="form-grid"
          >
            <select
              name="id_marca"
              value={formulario.id_marca}
              onChange={manejarCambio}
              disabled={!puedeConsultarRestaurantes}
            >
              <option value="">
                Selecciona restaurante
              </option>

              {restaurantes.map((item) => (
                <option
                  key={item.id_marca}
                  value={item.id_marca}
                >
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

            <button
              type="submit"
              disabled={!puedeConsultarRestaurantes}
            >
              {modoEdicion
                ? "Actualizar unidad"
                : "Guardar unidad"}
            </button>

            {modoEdicion && (
              <button
                type="button"
                onClick={limpiarFormulario}
              >
                Cancelar
              </button>
            )}
          </form>
        </div>
      )}

      <div className="card">
        <input
          className="search-input-f"
          placeholder="Buscar unidad Ej. Bahama Bay"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <br />

        <h2>Listado de unidades</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Ubicación</th>
                <th>Estado</th>

                {mostrarAcciones && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {unidadesFiltradas
                .slice(0, 10)
                .map((item) => (
                  <tr key={item.id}>
                    <td>{item.Restaurante}</td>
                    <td>{item.Ubicacion}</td>
                    <td>{item.Estado}</td>

                    {mostrarAcciones && (
                      <td>
                        <CatalogoActions
                          item={item}
                          onEditar={
                            puedeEditar
                              ? editarUnidad
                              : null
                          }
                          onEliminar={
                            puedeEliminar
                              ? borrarUnidad
                              : null
                          }
                        />
                      </td>
                    )}
                  </tr>
                ))}

              {unidadesFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      mostrarAcciones ? 4 : 3
                    }
                  >
                    No hay unidades registradas.
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

export default UnidadesPage;