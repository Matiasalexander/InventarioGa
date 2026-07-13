import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento
} from "../services/departamentosService";
import "../styles/InventarioPage.css";

function DepartamentosPage({ setLoading }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [nombreDepartamento, setNombreDepartamento] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarDepartamentos = async () => {
    try {
      setLoading(true);

      const data = await obtenerDepartamentos();
      setDepartamentos(data);
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Error al cargar listado de departamentos"
      );
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    cargarDepartamentos();
  }, []);

  const limpiarFormulario = () => {
    setNombreDepartamento("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarDepartamento = async (e) => {
    e.preventDefault();

    if (!nombreDepartamento.trim()) {
      toast.warning("Escribe el nombre del departamento");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        Nombre_departamento: nombreDepartamento.trim()
      };

      if (modoEdicion) {
        await actualizarDepartamento(idEditando, payload);
        toast.success("Departamento actualizado correctamente");
      } else {
        await crearDepartamento(payload);
        toast.success("Departamento creado correctamente");
      }

      limpiarFormulario();
      await cargarDepartamentos();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Error al guardar departamento"
      );
    } finally {
      setLoading(false);
    }
  };

  const editarDepartamento = (item) => {
    setNombreDepartamento(item.Nombre_departamento);
    setModoEdicion(true);
    setIdEditando(item.Id);
  };

  const borrarDepartamento = async (id) => {
    if (!window.confirm("¿Deseas eliminar este departamento?")) return;

    try {
      setLoading(true);

      await eliminarDepartamento(id);
      toast.success("Departamento eliminado correctamente");

      await cargarDepartamentos();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Error al eliminar departamento"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Departamentos</h1>
          <p>Catálogo de departamentos internos.</p>
        </div>
      </div>

      <div className="card">
        <h2>
          {modoEdicion ? "Editar departamento" : "Agregar departamento"}
        </h2>

        <form onSubmit={guardarDepartamento} className="form-grid">
          <input
            placeholder="Nombre del departamento"
            value={nombreDepartamento}
            onChange={(e) => setNombreDepartamento(e.target.value)}
          />

          <button type="submit">
            {modoEdicion ? "Actualizar departamento" : "Guardar departamento"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de departamentos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Departamento</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {departamentos.map((item) => (
                <tr key={item.Id}>
                  <td>{item.Nombre_departamento}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => editarDepartamento(item)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => borrarDepartamento(item.Id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {departamentos.length === 0 && (
                <tr>
                  <td colSpan="3">No hay departamentos registrados.</td>
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