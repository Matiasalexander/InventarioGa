import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerRam,
  crearRAM,
  actualizarRAM,
  eliminarRAM
} from "../services/ramService";

import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function RamPage({ setLoading }) {
  const [ram, setRam] = useState([]);
  const [capacidad, setCapacidad] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("memoriaram.ver");
  const puedeCrear = tienePermiso("memoriaram.crear");
  const puedeEditar = tienePermiso("memoriaram.editar");
  const puedeEliminar = tienePermiso("memoriaram.eliminar");

  const cargarRam = async () => {
    try {
      setLoading?.(true);

      const data = await obtenerRam();
      setRam(data || []);
    } catch (error) {
      console.error(
        "Error cargando memorias RAM:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar listado de memorias RAM."
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarRam();
    }
  }, [puedeVer]);

  const ramFiltrada = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return ram;

    return ram.filter((item) =>
      item.capacidad?.toLowerCase().includes(texto)
    );
  }, [busqueda, ram]);

  const limpiarFormulario = () => {
    setCapacidad("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarRam = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar memorias RAM."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear memorias RAM."
      );
      return;
    }

    if (!capacidad.trim()) {
      toast.warning("Escribe la capacidad.");
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        capacidad: capacidad.trim()
      };

      if (modoEdicion) {
        await actualizarRAM(idEditando, payload);

        toast.success(
          "Memoria RAM actualizada correctamente."
        );
      } else {
        await crearRAM(payload);

        toast.success(
          "Memoria RAM creada correctamente."
        );
      }

      limpiarFormulario();
      await cargarRam();
    } catch (error) {
      console.error(
        "Error guardando memoria RAM:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al guardar memoria RAM."
      );
    } finally {
      setLoading?.(false);
    }
  };

  const editarRam = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar memorias RAM."
      );
      return;
    }

    setCapacidad(item.capacidad || "");
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarRam = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar memorias RAM."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar esta memoria RAM?"
      )
    ) {
      return;
    }

    try {
      setLoading?.(true);

      await eliminarRAM(id);
      await cargarRam();

      toast.success(
        "Memoria RAM eliminada correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando memoria RAM:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al eliminar memoria RAM."
      );
    } finally {
      setLoading?.(false);
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
          <h1>Memorias RAM</h1>
          <p>Catálogo de capacidades de memoria RAM.</p>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar memoria RAM"
              : "Agregar memoria RAM"}
          </h2>

          <form
            onSubmit={guardarRam}
            className="form-grid"
          >
            <input
              placeholder="Capacidad de RAM (Ej. 8GB, 16GB, 32GB)"
              value={capacidad}
              onChange={(e) =>
                setCapacidad(e.target.value)
              }
            />

            <button type="submit">
              {modoEdicion
                ? "Actualizar memoria RAM"
                : "Guardar memoria RAM"}
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
          className="search-input"
          placeholder="Buscar memoria RAM Ej. 64GB"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
        />

        <br />

        <h2>Listado de memorias RAM</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Capacidad</th>

                {mostrarAcciones && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {ramFiltrada.map((item) => (
                <tr key={item.id}>
                  <td>{item.capacidad}</td>

                  {mostrarAcciones && (
                    <td>
                      <CatalogoActions
                        item={item}
                        onEditar={
                          puedeEditar
                            ? editarRam
                            : null
                        }
                        onEliminar={
                          puedeEliminar
                            ? borrarRam
                            : null
                        }
                      />
                    </td>
                  )}
                </tr>
              ))}

              {ramFiltrada.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      mostrarAcciones ? 2 : 1
                    }
                  >
                    No hay memorias RAM registradas.
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

export default RamPage;