import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerInventario,
  eliminarInventario,
  exportarInventarioExcel
} from "../services/inventarioService";
import { toast } from "react-toastify";
import { getRol } from "../utils/roles";
import "../styles/InventarioPage.css";
import InventarioTree from "../components/InventarioTree";

function InventarioPage({ setLoading }) {
  const [inventario, setInventario] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [unidadNombreSeleccionada, setUnidadNombreSeleccionada] = useState("");

  const navigate = useNavigate();
  const rol = getRol();

  const puedeCrear = rol === "Administrador" || rol === "Sistemas";
  const puedeEditar = rol === "Administrador" || rol === "Sistemas";
  const puedeEliminar = rol === "Administrador";

  const cargarInventario = async (unidad = null) => {
    try {
      setLoading(true);
      const data = await obtenerInventario(unidad);
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

  // NOTA DEL ERROR:
  // Aquí faltaba esta función. El componente la usa en:
  // <InventarioTree onSeleccionarUnidad={handleSeleccionUnidad} />
  // Si no existe, React marca error porque la referencia está indefinida.
  const handleSeleccionUnidad = async (idUnidad, nombreCompleto) => {
    setUnidadSeleccionada(idUnidad);
    setUnidadNombreSeleccionada(nombreCompleto);
    setBusqueda("");
    await cargarInventario(idUnidad);
  };

  const mostrarTodos = async () => {
    setUnidadSeleccionada(null);
    setUnidadNombreSeleccionada("");
    setBusqueda("");
    await cargarInventario();
  };

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
      await cargarInventario(unidadSeleccionada);
      toast.success("Equipo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando equipo:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error eliminando equipo");
    }
  };


  const descargarExcel = async () => {
  try {
    setLoading(true);

    const blob = await exportarInventarioExcel(unidadSeleccionada);

    const url = window.URL.createObjectURL(
      new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );

    const link = document.createElement("a");
    link.href = url;

    const nombreArchivo = unidadNombreSeleccionada
      ? `Inventario_${unidadNombreSeleccionada.replaceAll(" / ", "_")}.xlsx`
      : "Inventario_General.xlsx";

    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

    toast.success("Excel descargado correctamente");
  } catch (error) {
    console.error("Error exportando Excel:", error);
    toast.error("Error exportando Excel");
  } finally {
    setLoading(false);
  }
};
  const estados = {
    "En uso": "badge badge-en-uso",
    "Activo": "badge badge-activo",
    "Baja": "badge badge-baja",
  };

  return (
    <>
         <div className="header">
          <div>
            <h1>Inventario</h1>
            <p>Administración de equipos registrados.</p>
          </div>

    <div className="header-actions">
          {puedeCrear && (
            <button type="button" onClick={irAgregar}>
              + Agregar equipo
            </button>
          )}

              <button type="button" onClick={descargarExcel}>
  📥 Exportar Excel
</button>
</div>
        </div>

    <div className="inventario-layout">
      
      <aside className="tree-panel">
   <InventarioTree
  onSeleccionarUnidad={handleSeleccionUnidad}
  unidadSeleccionada={unidadSeleccionada}
/>
</aside>
      <div className="contenedor">
   
    

        <div className="card">
          <div className="toolbar">
            <div>
              <h2>Equipos</h2>
              <p>
                {puedeEditar
                  ? "Consulta, actualiza o elimina registros del inventario."
                  : "Consulta de registros del inventario."}
              </p>

              {unidadSeleccionada && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: "#4f46e5",
                    fontWeight: 600
                  }}
                >
                  📍 {unidadNombreSeleccionada}

                  <button
                    type="button"
                    onClick={mostrarTodos}
                    style={{
                      marginLeft: 10,
                      border: "none",
                      background: "transparent",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Mostrar todos
                  </button>
                </div>
              )}
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
                {inventarioFiltrado.map((item) => (
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
                      <span className={estados[item.ESTATUS] || "badge badge-default"}>
                        {item.ESTATUS || "Sin estatus"}
                      </span>
                    </td>
                    <td>
                      {item.RESPONSIVA_DIGITAL ? (
                        <span className="badge">
                          RESP-{String(item.NUM_RESPONSIVA || "").padStart(5, "0")}
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
                        <button type="button" onClick={() => irActualizar(item.id)}>
                          Editar
                        </button>
                      )}

                      {puedeEliminar && (
                        <button type="button" onClick={() => borrarEquipo(item.id)}>
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
    </div>
    </>
  );
  
}

export default InventarioPage;