import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto
} from "../services/puestosService";

import { obtenerDepartamentos } from "../services/departamentosService";
import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function PuestosPage({ setLoading }) {
  const [puestos, setPuestos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  const [formulario, setFormulario] = useState({
    Id_departamento: "",
    Nombre_puesto: ""
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("puestos.ver");
  const puedeCrear = tienePermiso("puestos.crear");
  const puedeEditar = tienePermiso("puestos.editar");
  const puedeEliminar = tienePermiso("puestos.eliminar");

  const puedeConsultarDepartamentos =
    tienePermiso("departamentos.ver");

  const cargarDatos = async () => {
    try {
      setLoading?.(true);

      const puestosData = puedeVer
        ? await obtenerPuestos()
        : [];

      const departamentosData = puedeConsultarDepartamentos
        ? await obtenerDepartamentos()
        : [];

      setPuestos(puestosData || []);
      setDepartamentos(departamentosData || []);
    } catch (error) {
      console.error(
        "Error cargando puestos:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar puestos."
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarDatos();
    }
  }, [puedeVer, puedeConsultarDepartamentos]);

  const puestosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return puestos;

    return puestos.filter(
      (item) =>
        item.Nombre_departamento
          ?.toLowerCase()
          .includes(texto) ||
        item.Nombre_puesto
          ?.toLowerCase()
          .includes(texto)
    );
  }, [busqueda, puestos]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormulario({
      Id_departamento: "",
      Nombre_puesto: ""
    });

    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarPuesto = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar puestos."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear puestos."
      );
      return;
    }

    if (!puedeConsultarDepartamentos) {
      toast.warning(
        "No tienes permiso para consultar departamentos."
      );
      return;
    }

    if (
      !formulario.Id_departamento ||
      !formulario.Nombre_puesto.trim()
    ) {
      toast.warning(
        "Selecciona un departamento y escribe el puesto."
      );
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        Id_departamento: formulario.Id_departamento,
        Nombre_puesto: formulario.Nombre_puesto.trim()
      };

      if (modoEdicion) {
        await actualizarPuesto(idEditando, payload);

        toast.success(
          "Puesto actualizado correctamente."
        );
      } else {
        await crearPuesto(payload);

        toast.success(
          "Puesto creado correctamente."
        );
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      console.error(
        "Error guardando puesto:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al guardar puesto."
      );
    } finally {
      setLoading?.(false);
    }
  };

  const editarPuesto = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar puestos."
      );
      return;
    }

    setFormulario({
      Id_departamento: item.Id_departamento || "",
      Nombre_puesto: item.Nombre_puesto || ""
    });

    setModoEdicion(true);
    setIdEditando(item.Id);
  };

  const borrarPuesto = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar puestos."
      );
      return;
    }

    if (!window.confirm("¿Deseas eliminar este puesto?")) {
      return;
    }

    try {
      setLoading?.(true);

      await eliminarPuesto(id);
      await cargarDatos();

      toast.success(
        "Puesto eliminado correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando puesto:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al eliminar puesto."
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
          <h1>Puestos</h1>
          <p>Catálogo de puestos por departamento.</p>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar puesto"
              : "Agregar puesto"}
          </h2>

          {!puedeConsultarDepartamentos && (
            <p>
              No tienes permiso para consultar departamentos.
            </p>
          )}

          <form
            onSubmit={guardarPuesto}
            className="form-grid"
          >
            <select
              name="Id_departamento"
              value={formulario.Id_departamento}
              onChange={manejarCambio}
              disabled={!puedeConsultarDepartamentos}
            >
              <option value="">
                Selecciona departamento
              </option>

              {departamentos.map((item) => (
                <option
                  key={item.Id}
                  value={item.Id}
                >
                  {item.Nombre_departamento}
                </option>
              ))}
            </select>

            <input
              name="Nombre_puesto"
              placeholder="Nombre del puesto"
              value={formulario.Nombre_puesto}
              onChange={manejarCambio}
            />

            <button
              type="submit"
              disabled={!puedeConsultarDepartamentos}
            >
              {modoEdicion
                ? "Actualizar puesto"
                : "Guardar puesto"}
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
          placeholder="Buscar puesto Ej. Contabilidad, Marketing"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <br />

        <h2>Listado de puestos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Departamento</th>
                <th>Puesto</th>

                {mostrarAcciones && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {puestosFiltrados.map((item) => (
                <tr key={item.Id}>
                  <td>{item.Nombre_departamento}</td>
                  <td>{item.Nombre_puesto}</td>

                  {mostrarAcciones && (
                    <td>
                      <CatalogoActions
                        item={item}
                        onEditar={
                          puedeEditar
                            ? editarPuesto
                            : null
                        }
                        onEliminar={
                          puedeEliminar
                            ? borrarPuesto
                            : null
                        }
                        getId={(item) => item.Id}
                      />
                    </td>
                  )}
                </tr>
              ))}

              {puestosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      mostrarAcciones ? 3 : 2
                    }
                  >
                    No hay puestos registrados.
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

export default PuestosPage;