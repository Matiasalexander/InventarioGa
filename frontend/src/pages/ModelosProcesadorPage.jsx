import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerModelosProcesador,
  crearModeloProcesador,
  actualizarModeloProcesador,
  eliminarModeloProcesador
} from "../services/modelosProcesadorService";

import { obtenerProcesadores } from "../services/procesadoresService";
import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function ModelosProcesadorPage({ setLoading }) {
  const [modelos, setModelos] = useState([]);
  const [procesadores, setProcesadores] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [formulario, setFormulario] = useState({
    Id_procesador: "",
    Modelo: ""
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("modelosprocesador.ver");
  const puedeCrear = tienePermiso("modelosprocesador.crear");
  const puedeEditar = tienePermiso("modelosprocesador.editar");
  const puedeEliminar = tienePermiso("modelosprocesador.eliminar");

  const puedeConsultarProcesadores =
    tienePermiso("procesadores.ver");

  const cargarDatos = async () => {
    try {
      setLoading?.(true);

      const modelosData = puedeVer
        ? await obtenerModelosProcesador()
        : [];

      const procesadoresData = puedeConsultarProcesadores
        ? await obtenerProcesadores()
        : [];

      setModelos(modelosData || []);
      setProcesadores(procesadoresData || []);
    } catch (error) {
      console.error(
        "Error cargando modelos de procesador:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar modelos de procesador."
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarDatos();
    }
  }, [puedeVer, puedeConsultarProcesadores]);

  const modelosProcesadoresFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return modelos;

    return modelos.filter(
      (item) =>
        item.Modelo?.toLowerCase().includes(texto) ||
        item.Nombre?.toLowerCase().includes(texto)
    );
  }, [busqueda, modelos]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormulario({
      Id_procesador: "",
      Modelo: ""
    });

    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarModelo = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar modelos de procesador."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear modelos de procesador."
      );
      return;
    }

    if (!puedeConsultarProcesadores) {
      toast.warning(
        "No tienes permiso para consultar procesadores."
      );
      return;
    }

    if (
      !formulario.Id_procesador ||
      !formulario.Modelo.trim()
    ) {
      toast.warning(
        "Selecciona un procesador y escribe el modelo."
      );
      return;
    }

    try {
      setLoading?.(true);

      const payload = {
        Id_procesador: formulario.Id_procesador,
        Modelo: formulario.Modelo.trim()
      };

      if (modoEdicion) {
        await actualizarModeloProcesador(
          idEditando,
          payload
        );

        toast.success(
          "Modelo actualizado correctamente."
        );
      } else {
        await crearModeloProcesador(payload);

        toast.success(
          "Modelo creado correctamente."
        );
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      console.error(
        "Error guardando modelo de procesador:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al guardar modelo."
      );
    } finally {
      setLoading?.(false);
    }
  };

  const editarModelo = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar modelos de procesador."
      );
      return;
    }

    setFormulario({
      Id_procesador: item.Id_procesador || "",
      Modelo: item.Modelo || ""
    });

    setModoEdicion(true);
    setIdEditando(item.Id);
  };

  const borrarModelo = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar modelos de procesador."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar este modelo de procesador?"
      )
    ) {
      return;
    }

    try {
      setLoading?.(true);

      await eliminarModeloProcesador(id);
      await cargarDatos();

      toast.success(
        "Modelo eliminado correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando modelo de procesador:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al eliminar modelo."
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
    <div className="detail-item">
      <div className="header">
        <div>
          <h1>Modelos de Procesador</h1>
          <p>
            Catálogo de modelos asociados a cada procesador.
          </p>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar modelo de procesador"
              : "Agregar modelo de procesador"}
          </h2>

          {!puedeConsultarProcesadores && (
            <p>
              No tienes permiso para consultar procesadores.
            </p>
          )}

          <form
            onSubmit={guardarModelo}
            className="form-grid"
          >
            <select
              name="Id_procesador"
              value={formulario.Id_procesador}
              onChange={manejarCambio}
              disabled={!puedeConsultarProcesadores}
            >
              <option value="">
                Selecciona procesador
              </option>

              {procesadores.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.Nombre}
                </option>
              ))}
            </select>

            <input
              name="Modelo"
              placeholder="Modelo, ejemplo: Ryzen 7"
              value={formulario.Modelo}
              onChange={manejarCambio}
            />

            <button
              type="submit"
              disabled={!puedeConsultarProcesadores}
            >
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
          className="search-input"
          placeholder="Buscar procesador o modelo Ej. AMD, Ryzen 7"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
        />

        <br />

        <h2>Listado de modelos de procesador</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Procesador</th>
                <th>Modelo</th>

                {mostrarAcciones && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {modelosProcesadoresFiltrados.map((item) => (
                <tr key={item.Id}>
                  <td>{item.Nombre}</td>
                  <td>{item.Modelo}</td>

                  {mostrarAcciones && (
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
                        getId={(item) => item.Id}
                      />
                    </td>
                  )}
                </tr>
              ))}

              {modelosProcesadoresFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      mostrarAcciones ? 3 : 2
                    }
                  >
                    No hay modelos de procesador registrados.
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

export default ModelosProcesadorPage;