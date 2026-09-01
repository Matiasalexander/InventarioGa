import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerSistemasOperativos,
  crearSistemaOperativo,
  actualizarSistemaOperativo,
  eliminarSistemaOperativo
} from "../services/sistemasOperativos";

import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function SistemasOperativosPage({ setLoading }) {
  const [sistemasOperativos, setSistemasOperativos] = useState([]);

  const [nombre, setNombre] = useState("");
  const [version, setVersion] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("sistemasoperativos.ver");
  const puedeCrear = tienePermiso("sistemasoperativos.crear");
  const puedeEditar = tienePermiso("sistemasoperativos.editar");
  const puedeEliminar = tienePermiso("sistemasoperativos.eliminar");

  const cargarSistemasOperativos = async () => {
    try {
      setLoading?.(true);

      const data = await obtenerSistemasOperativos();

      setSistemasOperativos(data || []);
    } catch (error) {
      console.error(
        "Error cargando sistemas operativos:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar listado de sistemas operativos."
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarSistemasOperativos();
    }
  }, [puedeVer]);

  const sistemasOperativosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return sistemasOperativos;
    }

    return sistemasOperativos.filter((item) =>
      `${item.Nombre || ""} ${item.N_Version || ""}`
        .toLowerCase()
        .includes(texto)
    );
  }, [busqueda, sistemasOperativos]);

  const limpiarFormulario = () => {
    setNombre("");
    setVersion("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarSistemaOperativo = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar sistemas operativos."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear sistemas operativos."
      );
      return;
    }

    if (!nombre.trim()) {
      toast.warning("Escribe el nombre del sistema operativo.");
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        Nombre: nombre.trim(),
        N_Version: version.trim()
      };

      if (modoEdicion) {
        await actualizarSistemaOperativo(idEditando, payload);

        toast.success(
          "Sistema operativo actualizado correctamente."
        );
      } else {
        await crearSistemaOperativo(payload);

        toast.success(
          "Sistema operativo creado correctamente."
        );
      }

      limpiarFormulario();

      await cargarSistemasOperativos();
    } catch (error) {
      console.error(
        "Error guardando sistema operativo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al guardar sistema operativo."
      );
    } finally {
      setLoading?.(false);
    }
  };

  const editarSistemaOperativo = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar sistemas operativos."
      );
      return;
    }

    setNombre(item.Nombre || "");
    setVersion(item.N_Version || "");

    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarSistemaOperativo = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar sistemas operativos."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar este sistema operativo?"
      )
    ) {
      return;
    }

    try {
      setLoading?.(true);

      await eliminarSistemaOperativo(id);

      await cargarSistemasOperativos();

      toast.success(
        "Sistema operativo eliminado correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando sistema operativo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al eliminar sistema operativo."
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
          <h1>Sistemas Operativos</h1>

          <p>
            Catálogo de sistemas operativos y sus versiones.
          </p>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card">

          <h2>
            {modoEdicion
              ? "Editar sistema operativo"
              : "Agregar sistema operativo"}
          </h2>

          <form
            onSubmit={guardarSistemaOperativo}
            className="form-grid"
          >

            <input
              placeholder="Nombre del sistema operativo (Ej. Windows)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={150}
            />

            <input
              placeholder="Versión (Ej. 11)"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              maxLength={150}
            />

            <button type="submit">
              {modoEdicion
                ? "Actualizar sistema operativo"
                : "Guardar sistema operativo"}
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
          placeholder="Buscar sistema operativo Ej. Windows 11"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <br />

        <h2>
          Listado de sistemas operativos
        </h2>

        <div className="table-container">

          <table>

            <thead>
              <tr>

                <th>Nombre</th>

                <th>Versión</th>

                {mostrarAcciones && (
                  <th>Acciones</th>
                )}

              </tr>
            </thead>

            <tbody>

              {sistemasOperativosFiltrados.map((item) => (
                <tr key={item.id}>

                  <td>
                    {item.Nombre}
                  </td>

                  <td>
                    {item.N_Version || "—"}
                  </td>

                  {mostrarAcciones && (
                    <td>
                      <CatalogoActions
                        item={item}
                        onEditar={
                          puedeEditar
                            ? editarSistemaOperativo
                            : null
                        }
                        onEliminar={
                          puedeEliminar
                            ? borrarSistemaOperativo
                            : null
                        }
                      />
                    </td>
                  )}

                </tr>
              ))}

              {sistemasOperativosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      mostrarAcciones ? 3 : 2
                    }
                  >
                    No hay sistemas operativos registrados.
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

export default SistemasOperativosPage;