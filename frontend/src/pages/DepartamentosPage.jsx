import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento
} from "../services/departamentosService";

import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function DepartamentosPage({ setLoading }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [nombreDepartamento, setNombreDepartamento] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("departamentos.ver");
  const puedeCrear = tienePermiso("departamentos.crear");
  const puedeEditar = tienePermiso("departamentos.editar");
  const puedeEliminar = tienePermiso("departamentos.eliminar");

  const cargarDepartamentos = async () => {
    try {
      setLoading(true);

      const data = await obtenerDepartamentos();
      setDepartamentos(data || []);
    } catch (error) {
      console.error(
        "Error cargando departamentos:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar listado de departamentos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarDepartamentos();
    }
  }, [puedeVer]);

  const departamentosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return departamentos;

    return departamentos.filter((item) =>
      item.Nombre_departamento
        ?.toLowerCase()
        .includes(texto)
    );
  }, [busqueda, departamentos]);

  const limpiarFormulario = () => {
    setNombreDepartamento("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarDepartamento = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar departamentos."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear departamentos."
      );
      return;
    }

    if (!nombreDepartamento.trim()) {
      toast.warning("Escribe el nombre del departamento.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        Nombre_departamento: nombreDepartamento.trim()
      };

      if (modoEdicion) {
        await actualizarDepartamento(idEditando, payload);

        toast.success(
          "Departamento actualizado correctamente."
        );
      } else {
        await crearDepartamento(payload);

        toast.success(
          "Departamento creado correctamente."
        );
      }

      limpiarFormulario();
      await cargarDepartamentos();
    } catch (error) {
      console.error(
        "Error guardando departamento:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al guardar departamento."
      );
    } finally {
      setLoading(false);
    }
  };

  const editarDepartamento = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar departamentos."
      );
      return;
    }

    setNombreDepartamento(
      item.Nombre_departamento || ""
    );

    setModoEdicion(true);
    setIdEditando(item.Id);
  };

  const borrarDepartamento = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar departamentos."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar este departamento?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      await eliminarDepartamento(id);
      await cargarDepartamentos();

      toast.success(
        "Departamento eliminado correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando departamento:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al eliminar departamento."
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
          <h1>Departamentos</h1>
          <p>Catálogo de departamentos internos.</p>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar departamento"
              : "Agregar departamento"}
          </h2>

          <form
            onSubmit={guardarDepartamento}
            className="form-grid"
          >
            <input
              placeholder="Nombre del departamento"
              value={nombreDepartamento}
              onChange={(e) =>
                setNombreDepartamento(e.target.value)
              }
            />

            <button type="submit">
              {modoEdicion
                ? "Actualizar departamento"
                : "Guardar departamento"}
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
          placeholder="Buscar departamento Ej. Contabilidad, Marketing"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <br />

        <h2>Listado de departamentos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Departamento</th>

                {mostrarAcciones && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {departamentosFiltrados.map((item) => (
                <tr key={item.Id}>
                  <td>{item.Nombre_departamento}</td>

                  {mostrarAcciones && (
                    <td>
                      <CatalogoActions
                        item={item}
                        onEditar={
                          puedeEditar
                            ? editarDepartamento
                            : null
                        }
                        onEliminar={
                          puedeEliminar
                            ? borrarDepartamento
                            : null
                        }
                        getId={(item) => item.Id}
                      />
                    </td>
                  )}
                </tr>
              ))}

              {departamentosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={mostrarAcciones ? 2 : 1}>
                    No hay departamentos registrados.
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

export default DepartamentosPage;