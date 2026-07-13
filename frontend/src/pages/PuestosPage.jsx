import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto
} from "../services/puestosService";
import { obtenerDepartamentos } from "../services/departamentosService";
import "../styles/InventarioPage.css";


function PuestosPage({ setLoading }) {
  const [puestos, setPuestos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  const [formulario, setFormulario] = useState({
    Id_departamento: "",
    Nombre_puesto: ""
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading?.(true);

      const puestosData = await obtenerPuestos();
      const departamentosData = await obtenerDepartamentos();

      setPuestos(puestosData);
      setDepartamentos(departamentosData);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cargar puestos");
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

    if (!formulario.Id_departamento || !formulario.Nombre_puesto.trim()) {
      toast.warning("Selecciona departamento y escribe el puesto");
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
        toast.success("Puesto actualizado correctamente");
      } else {
        await crearPuesto(payload);
        toast.success("Puesto creado correctamente");
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al guardar puesto");
    } finally {
      setLoading?.(false);
    }
  };

  const editarPuesto = (item) => {
    setFormulario({
      Id_departamento: item.Id_departamento || "",
      Nombre_puesto: item.Nombre_puesto || ""
    });

    setModoEdicion(true);
    setIdEditando(item.Id);
  };

  const borrarPuesto = async (id) => {
    if (!window.confirm("¿Deseas eliminar este puesto?")) return;

    try {
      setLoading?.(true);

      await eliminarPuesto(id);
      toast.success("Puesto eliminado correctamente");

      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al eliminar puesto");
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Puestos</h1>
          <p>Catálogo de puestos por departamento.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar puesto" : "Agregar puesto"}</h2>

        <form onSubmit={guardarPuesto} className="form-grid">
          <select
            name="Id_departamento"
            value={formulario.Id_departamento}
            onChange={manejarCambio}
          >
            <option value="">Selecciona departamento</option>

            {departamentos.map((item) => (
              <option key={item.Id} value={item.Id}>
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

          <button type="submit">
            {modoEdicion ? "Actualizar puesto" : "Guardar puesto"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de puestos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Departamento</th>
                <th>Puesto</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {puestos.map((item) => (
                <tr key={item.Id}>
                  <td>{item.Nombre_departamento}</td>
                  <td>{item.Nombre_puesto}</td>
                  <td>
                    <button type="button" onClick={() => editarPuesto(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => borrarPuesto(item.Id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {puestos.length === 0 && (
                <tr>
                  <td colSpan="4">No hay puestos registrados.</td>
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