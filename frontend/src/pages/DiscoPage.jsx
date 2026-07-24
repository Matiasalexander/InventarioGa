import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerDisco,
  crearDisco,
  actualizarDisco,
  eliminarDisco
} from "../services/discoService";

import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function DiscoPage({ setLoading }) {
  const [discos, setDiscos] = useState([]);
  const [modelo_disco, setModeloDisco] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("discosduros.ver");
  const puedeCrear = tienePermiso("discosduros.crear");
  const puedeEditar = tienePermiso("discosduros.editar");
  const puedeEliminar = tienePermiso("discosduros.eliminar");

  const cargarDiscos = async () => {
    try {
      setLoading?.(true);

      const data = await obtenerDisco();
      setDiscos(data || []);
    } catch (error) {
      console.error(
        "Error cargando discos duros:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar listado de discos duros."
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarDiscos();
    }
  }, [puedeVer]);

  const discosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return discos;

    return discos.filter(
      (item) =>
        item.modelo_disco
          ?.toLowerCase()
          .includes(texto) ||
        item.capacidad
          ?.toLowerCase()
          .includes(texto)
    );
  }, [busqueda, discos]);

  const limpiarFormulario = () => {
    setModeloDisco("");
    setCapacidad("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarDisco = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar discos duros."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear discos duros."
      );
      return;
    }

    if (!modelo_disco.trim()) {
      toast.warning("Escribe el modelo del disco.");
      return;
    }

    if (!capacidad.trim()) {
      toast.warning("Escribe la capacidad.");
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        modelo_disco: modelo_disco.trim(),
        capacidad: capacidad.trim()
      };

      if (modoEdicion) {
        await actualizarDisco(idEditando, payload);

        toast.success(
          "Disco duro actualizado correctamente."
        );
      } else {
        await crearDisco(payload);

        toast.success(
          "Disco duro creado correctamente."
        );
      }

      limpiarFormulario();
      await cargarDiscos();
    } catch (error) {
      console.error(
        "Error guardando disco duro:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al guardar disco duro."
      );
    } finally {
      setLoading?.(false);
    }
  };

  const editarDisco = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar discos duros."
      );
      return;
    }

    setModeloDisco(item.modelo_disco || "");
    setCapacidad(item.capacidad || "");
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarDisco = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar discos duros."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar este disco duro?"
      )
    ) {
      return;
    }

    try {
      setLoading?.(true);

      await eliminarDisco(id);
      await cargarDiscos();

      toast.success(
        "Disco duro eliminado correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando disco duro:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al eliminar disco duro."
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
          <h1>Discos Duros</h1>
          <p>Catálogo de discos duros.</p>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar disco duro"
              : "Agregar disco duro"}
          </h2>

          <form
            onSubmit={guardarDisco}
            className="form-grid"
          >
            <input
              placeholder="Modelo del disco"
              value={modelo_disco}
              onChange={(e) =>
                setModeloDisco(e.target.value)
              }
            />

            <input
              placeholder="Capacidad (Ej. 512GB, 1TB)"
              value={capacidad}
              onChange={(e) =>
                setCapacidad(e.target.value)
              }
            />

            <button type="submit">
              {modoEdicion
                ? "Actualizar disco duro"
                : "Guardar disco duro"}
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
          placeholder="Buscar disco duro Ej. SSD 512GB"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
        />

        <br />

        <h2>Listado de discos duros</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Capacidad</th>

                {mostrarAcciones && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {discosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.modelo_disco}</td>
                  <td>{item.capacidad}</td>

                  {mostrarAcciones && (
                    <td>
                      <CatalogoActions
                        item={item}
                        onEditar={
                          puedeEditar
                            ? editarDisco
                            : null
                        }
                        onEliminar={
                          puedeEliminar
                            ? borrarDisco
                            : null
                        }
                      />
                    </td>
                  )}
                </tr>
              ))}

              {discosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      mostrarAcciones ? 3 : 2
                    }
                  >
                    No hay discos duros registrados.
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

export default DiscoPage;