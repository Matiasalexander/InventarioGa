import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerInventario,
  eliminarInventario
} from "../services/inventarioService";
import { toast } from "react-toastify";
import { getRol } from "../utils/roles";
import "../styles/InventarioPage.css";
import InventarioTree from "../components/InventarioTree";

function InventarioPage({ setLoading }) {
  const [inventario, setInventario] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();
  const rol = getRol();

  const puedeCrear = rol === "Administrador" || rol === "Sistemas";
  const puedeEditar = rol === "Administrador" || rol === "Sistemas";
  const puedeEliminar = rol === "Administrador";

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const data = await obtenerInventario();
      setInventario(data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      toast.error("Error cargando inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const inventarioFiltrado = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return inventario;

    return inventario.filter((item) =>
      [
        item.UNIDAD,
        item.LOCALIDAD,
        item.UBICACION,
        item.TIPO_EQUIPO,
        item.NOMBRE_EQUIPO,
        item.SERIAL,
        item.MARCA,
        item.MODELO,
        item.IP,
        item.ESTATUS,
        item.RESPONSIVA_DIGITAL
          ? "asignado responsiva ocupado"
          : "disponible sin responsiva"
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [busqueda, inventario]);

  const irDetalle = (id) => {
    navigate(`/inventario/detalle/${id}`);
  };

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
      toast.success("Equipo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando equipo:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error eliminando equipo");
    }
  };

  const estados = {
    "En uso":"badge badge-en-uso",
    "Activo": "badge badge-activo",
    "Baja":"badge badge-baja",
  };
  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Inventario</h1>
          <p>Administración de equipos registrados.</p>
        </div>

        {puedeCrear && (
          <button type="button" onClick={irAgregar}>
            + Agregar equipo
          </button>
        )}
      </div>

      <div className="card">
        <div className="toolbar">
          <div>
            <h2>Equipos</h2>
            <p>
              {puedeEditar
                ? "Consulta, actualiza o elimina registros del inventario."
                : "Consulta de registros del inventario."}
            </p>
          </div>

          <input
            className="search-input"
            placeholder="Buscar por equipo, serial, marca, IP, responsiva..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

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
                <th>Responsiva</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {inventarioFiltrado.slice(0,5).map((item) => (
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
                  <td>
                <span className={ estados[item.ESTATUS] || "badge badge-default"} >
                    {item.ESTATUS || "Sin estatus"}
                </span>
                  </td>
                  <td>
                    {item.RESPONSIVA_DIGITAL ? (
                      <span className="badge">
                        RESP-
                        {String(item.NUM_RESPONSIVA || "").padStart(5, "0")}
                      </span>
                    ) : (
                      <span className="badge">Disponible</span>
                    )}
                  </td>
                  <td>
                    <button type="button" onClick={() => irDetalle(item.id)}>
                      Detalles
                    </button>

                    {puedeEditar && (
                      <button
                        type="button"
                        onClick={() => irActualizar(item.id)}
                      >
                        Editar
                      </button>
                    )}

                    {puedeEliminar && (
                      <button
                        type="button"
                        onClick={() => borrarEquipo(item.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {inventarioFiltrado.length === 0 && (
                <tr>
                  <td colSpan="13">No hay equipos para mostrar.</td>
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