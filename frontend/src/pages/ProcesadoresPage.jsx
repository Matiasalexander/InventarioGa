import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerProcesadores,
  crearProcesador,
  actualizarProcesador,
  eliminarProcesador
} from "../services/procesadoresService";

import { useAuth } from "../context/AuthContext";

import "../styles/AreasUnidades.css";
import CatalogoActions from "../components/CatalogoActions";

function ProcesadoresPage({ setLoading }) {
  const [procesadores, setProcesadores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("procesadores.ver");
  const puedeCrear = tienePermiso("procesadores.crear");
  const puedeEditar = tienePermiso("procesadores.editar");
  const puedeEliminar = tienePermiso("procesadores.eliminar");

  const cargarProcesadores = async () => {
    try {
      setLoading?.(true);

      const data = await obtenerProcesadores();
      setProcesadores(data || []);
    } catch (error) {
      console.error(
        "Error cargando procesadores:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar listado de procesadores."
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarProcesadores();
    }
  }, [puedeVer]);

  const procesadoresFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return procesadores;

    return procesadores.filter((item) =>
      item.Nombre?.toLowerCase().includes(texto)
    );
  }, [busqueda, procesadores]);

  const limpiarFormulario = () => {
    setNombre("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarProcesador = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar procesadores."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear procesadores."
      );
      return;
    }

    if (!nombre.trim()) {
      toast.warning("Escribe un procesador.");
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        Nombre: nombre.trim()
      };

      if (modoEdicion) {
        await actualizarProcesador(idEditando, payload);

        toast.success(
          "Procesador actualizado correctamente."
        );
      } else {
        await crearProcesador(payload);

        toast.success(
          "Procesador creado correctamente."
        );
      }

      limpiarFormulario();
      await cargarProcesadores();
    } catch (error) {
      console.error(
        "Error guardando procesador:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error guardando procesador."
      );
    } finally {
      setLoading?.(false);
    }
  };

  const editarProcesador = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar procesadores."
      );
      return;
    }

    setNombre(item.Nombre || "");
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarProcesador = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar procesadores."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar este procesador?"
      )
    ) {
      return;
    }

    try {
      setLoading?.(true);

      await eliminarProcesador(id);
      await cargarProcesadores();

      toast.success(
        "Procesador eliminado correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando procesador:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error eliminando procesador."
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
    <div className="responsive-u">
      <div className="detail-item">
        <div className="header">
          <div>
            <h1>Procesadores</h1>

            <p>
              Catálogo de procesadores disponibles para equipos.
            </p>
          </div>
        </div>

        {mostrarFormulario && (
          <div className="card">
            <h2>
              {modoEdicion
                ? "Editar procesador"
                : "Agregar procesador"}
            </h2>

            <form
              onSubmit={guardarProcesador}
              className="form-grid"
            >
              <input
                placeholder="Nombre del procesador"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
              />

              <button type="submit">
                {modoEdicion
                  ? "Actualizar procesador"
                  : "Guardar procesador"}
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
            placeholder="Buscar procesador Ej. AMD"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />

          <br />

          <h2>Listado de procesadores</h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Procesador</th>

                  {mostrarAcciones && (
                    <th>Acciones</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {procesadoresFiltrados.map((item) => (
                  <tr key={item.id}>
                    <td>{item.Nombre}</td>

                    {mostrarAcciones && (
                      <td>
                        <CatalogoActions
                          item={item}
                          onEditar={
                            puedeEditar
                              ? editarProcesador
                              : null
                          }
                          onEliminar={
                            puedeEliminar
                              ? borrarProcesador
                              : null
                          }
                        />
                      </td>
                    )}
                  </tr>
                ))}

                {procesadoresFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={
                        mostrarAcciones ? 2 : 1
                      }
                    >
                      No hay procesadores registrados.
                    </td>
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