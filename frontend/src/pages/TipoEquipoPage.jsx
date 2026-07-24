import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerTiposEquipo,
  crearTipoEquipo,
  actualizarTipoEquipo,
  eliminarTipoEquipo
} from "../services/tipoEquipoService";

import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function TipoEquipoPage({ setLoading }) {
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [tequipo, setTequipo] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("catalogos.ver");
  const puedeCrear = tienePermiso("catalogos.crear");
  const puedeEditar = tienePermiso("catalogos.editar");
  const puedeEliminar = tienePermiso("catalogos.eliminar");

  const cargarTiposEquipo = async () => {
    try {
      setLoading(true);

      const data = await obtenerTiposEquipo();

      setTiposEquipo(data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar listado de tipos de equipo"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarTiposEquipo();
    }
  }, [puedeVer]);

  const tiposEquipoFiltrados = useMemo(() => {
    const texto = busqueda.toLocaleLowerCase().trim();

    if (!texto) {
      return tiposEquipo;
    }

    return tiposEquipo.filter((item) =>
      item.tequipo
        ?.toLocaleLowerCase()
        .includes(texto)
    );
  }, [busqueda, tiposEquipo]);

  const limpiarFormulario = () => {
    setTequipo("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarTipoEquipo = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar tipos de equipo."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear tipos de equipo."
      );
      return;
    }

    if (!tequipo.trim()) {
      toast.warning("Escribe un tipo de equipo.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        tequipo: tequipo.trim()
      };

      if (modoEdicion) {
        await actualizarTipoEquipo(
          idEditando,
          payload
        );

        toast.success(
          "Tipo de equipo actualizado correctamente."
        );
      } else {
        await crearTipoEquipo(payload);

        toast.success(
          "Tipo de equipo creado correctamente."
        );
      }

      limpiarFormulario();
      await cargarTiposEquipo();
    } catch (error) {
      console.error(
        "Error guardando tipo de equipo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error guardando tipo de equipo."
      );
    } finally {
      setLoading(false);
    }
  };

  const editarTipoEquipo = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar tipos de equipo."
      );
      return;
    }

    setTequipo(item.tequipo);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarTipoEquipo = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar tipos de equipo."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar este tipo de equipo?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      await eliminarTipoEquipo(id);
      await cargarTiposEquipo();

      toast.success(
        "Tipo de equipo eliminado correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando tipo de equipo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error eliminando tipo de equipo."
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
          <h1>Tipos de equipo</h1>

          <p>
            Catálogo de tipos de equipo del inventario.
          </p>
        </div>
      </div>

      {(puedeCrear || (modoEdicion && puedeEditar)) && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar tipo de equipo"
              : "Agregar tipo de equipo"}
          </h2>

          <form
            onSubmit={guardarTipoEquipo}
            className="form-grid"
          >
            <input
              placeholder="Tipo de equipo"
              value={tequipo}
              onChange={(e) =>
                setTequipo(e.target.value)
              }
            />

            <button type="submit">
              {modoEdicion
                ? "Actualizar tipo"
                : "Guardar tipo"}
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
          placeholder="Buscar tipo de equipo, Ej. APS"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
        />

        <br />

        <h2>Listado de tipos de equipo</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tipo equipo</th>

                {(puedeEditar || puedeEliminar) && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {tiposEquipoFiltrados
                .slice(0, 6)
                .map((item) => (
                  <tr key={item.id}>
                    <td>{item.tequipo}</td>

                    {(puedeEditar ||
                      puedeEliminar) && (
                      <td>
                        <CatalogoActions
                          item={item}
                          onEditar={
                            puedeEditar
                              ? editarTipoEquipo
                              : null
                          }
                          onEliminar={
                            puedeEliminar
                              ? borrarTipoEquipo
                              : null
                          }
                        />
                      </td>
                    )}
                  </tr>
                ))}

              {tiposEquipoFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      puedeEditar || puedeEliminar
                        ? 2
                        : 1
                    }
                  >
                    No hay tipos de equipo registrados.
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

export default TipoEquipoPage;