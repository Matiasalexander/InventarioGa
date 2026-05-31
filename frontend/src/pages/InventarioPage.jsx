import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerInventario,
  eliminarInventario
} from "../services/inventarioService";
import "./InventarioPage.css";

function InventarioPage() {
  const [inventario, setInventario] = useState([]);

  const navigate = useNavigate();

  const cargarInventario = async () => {
    try {
      const data = await obtenerInventario();
      setInventario(data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      alert("Error cargando inventario");
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const irAgregar = () => {
    navigate("/inventario/nuevo");
  };

  const irActualizar = (id) => {
    navigate(`/inventario/editar/${id}`);
  };

  const borrarEquipo = async (id) => {
    const confirmar = window.confirm("¿Deseas eliminar este equipo?");

    if (!confirmar) return;

    try {
      await eliminarInventario(id);
      await cargarInventario();
      alert("Equipo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando equipo:", error.response?.data || error);
      alert(error.response?.data?.error || "Error eliminando equipo");
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Inventario GA2</h1>
          <p>Listado general de equipos registrados.</p>
        </div>

        <button type="button" onClick={irAgregar}>
          Agregar equipo
        </button>
      </div>

      <div className="card">
        <h2>Equipos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Restaurante</th>
                <th>Localidad</th>
                <th>Ubicación</th>
                <th>Tipo equipo</th>
                <th>Nombre equipo</th>
                <th>Serial</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>IP</th>
                <th>Estatus</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {inventario.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.UNIDAD}</td>
                  <td>{item.LOCALIDAD}</td>
                  <td>{item.UBICACION}</td>
                  <td>{item.TIPO_EQUIPO}</td>
                  <td>{item.NOMBRE_EQUIPO}</td>
                  <td>{item.SERIAL}</td>
                  <td>{item.MARCA}</td>
                  <td>{item.MODELO}</td>
                  <td>{item.IP}</td>
                  <td>{item.ESTATUS}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => irActualizar(item.id)}
                    >
                      Actualizar
                    </button>

                    <button
                      type="button"
                      onClick={() => borrarEquipo(item.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {inventario.length === 0 && (
                <tr>
                  <td colSpan="12">No hay equipos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventarioPage;