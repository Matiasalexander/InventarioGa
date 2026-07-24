import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerModesp,
  crearModesp,
  actualizarModesp,
  eliminarModesp
} from "../services/modespService";

import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function ModespPage({ setLoading }) {
  const [modelos, setModelos] = useState([]);
  const [modEsp, setModEsp] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("catalogos.ver");
  const puedeCrear = tienePermiso("catalogos.crear");
  const puedeEditar = tienePermiso("catalogos.editar");
  const puedeEliminar = tienePermiso("catalogos.eliminar");

  const cargarModelos = async () => {
    try {
      setLoading?.(true);

      const data = await obtenerModesp();

      setModelos(data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar modelos base"
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarModelos();
    }
  }, [puedeVer]);

  const modespFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return modelos;
    }

    return modelos.filter((item) =>
      String(item.Mod_esp ?? "")
        .toLowerCase()
        .includes(texto)
    );
  }, [busqueda, modelos]);

  const limpiarFormulario = () => {
    setModEsp("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarModelo = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar modelos base."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear modelos base."
      );
      return;
    }

    if (!modEsp.trim()) {
      toast.warning("Escribe el modelo.");
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        Mod_esp: modEsp.trim()
      };

      if (modoEdicion) {
        await actualizarModesp(
          idEditando,
          payload
        );

        toast.success(
          "Modelo base actualizado correctamente."
        );
      } else {
        await crearModesp(payload);

        toast.success(
          "Modelo base creado correctamente."
        );
      }

      limpiarFormulario();
      await cargarModelos();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al guardar modelo base."
      );
    } finally {
      setLoading?.(false);
    }
  };

  const editarModelo = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar modelos base."
      );
      return;
    }

    setModEsp(item.Mod_esp);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarModelo = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar modelos base."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar este modelo base?"
      )
    ) {
      return;
    }

    try {
      setLoading?.(true);

      await eliminarModesp(id);

      toast.success(
        "Modelo base eliminado correctamente."
      );

      await cargarModelos();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al eliminar modelo base."
      );
    } finally {
      setLoading?.(false);
    }
  };

  if (!puedeVer) {
    return null;
  }

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Modelos base</h1>

          <p>
            Catálogo base de modelos específicos.
          </p>
        </div>
      </div>

      {(puedeCrear || (modoEdicion && puedeEditar)) && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar modelo base"
              : "Agregar modelo base"}
          </h2>

          <form
            onSubmit={guardarModelo}
            className="form-grid"
          >
            <input
              placeholder="Modelo, ejemplo: LATITUDE 3440"
              value={modEsp}
              onChange={(e) =>
                setModEsp(e.target.value)
              }
            />

            <button type="submit">
              {modoEdicion
                ? "Actualizar modelo"
                : "Guardar modelo"}
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
          placeholder="Buscar modelo específico, Ej. LATITUDE"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
        />

        <br />

        <h2>Listado de modelos base</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Modelo</th>

                {(puedeEditar || puedeEliminar) && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {modespFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.Mod_esp}</td>

                  {(puedeEditar ||
                    puedeEliminar) && (
                    <td>
                      <CatalogoActions
                        item={item}
                        onEditar={
                          puedeEditar
                            ? editarModelo
                            : null
                        }
                        onEliminar={
                          puedeEliminar
                            ? borrarModelo
                            : null
                        }
                      />
                    </td>
                  )}
                </tr>
              ))}

              {modespFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      puedeEditar || puedeEliminar
                        ? 2
                        : 1
                    }
                  >
                    No hay modelos registrados.
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

export default ModespPage;