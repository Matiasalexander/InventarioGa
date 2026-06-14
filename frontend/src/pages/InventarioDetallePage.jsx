import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerInventarioPorId } from "../services/inventarioService";
import "../styles/InventarioPage.css";

function InventarioDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarEquipo = async () => {
      try {
        const data = await obtenerInventarioPorId(id);
        console.log("Equipo detalle:", data);
        setEquipo(data);
      } catch (error) {
        console.error("Error cargando detalle:", error.response?.data || error);
        setError("No se pudo cargar el detalle del equipo");
      }
    };

    cargarEquipo();
  }, [id]);

  if (error) {
    return (
      <div className="contenedor">
        <div className="card">
          <h2>{error}</h2>
          <button type="button" onClick={() => navigate("/inventario")}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="contenedor">
        <div className="card">
          <h2>Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Detalle del equipo</h1>
          <p>Información completa del equipo seleccionado.</p>
        </div>

        <button type="button" onClick={() => navigate("/inventario")}>
          Volver
        </button>
      </div>

      <div className="card">
        <h2>{equipo.NOMBRE_EQUIPO || "Equipo sin nombre"}</h2>

        <p><strong>ID:</strong> {equipo.id || "N/A"}</p>
        <p><strong>Localidad:</strong> {equipo.LOCALIDAD || "N/A"}</p>
        <p><strong>Ubicación:</strong> {equipo.UBICACION || "N/A"}</p>
        <p><strong>Nombre equipo:</strong> {equipo.NOMBRE_EQUIPO || "N/A"}</p>
        <p><strong>Serial:</strong> {equipo.SERIAL || "N/A"}</p>
        <p><strong>Modelo:</strong> {equipo.MODELO || "N/A"}</p>
        <p><strong>IP:</strong> {equipo.IP || "N/A"}</p>
        <p><strong>Estado físico:</strong> {equipo.ESTADO_FISICO || "N/A"}</p>
        <p><strong>Correo:</strong> {equipo.CORREO || "N/A"}</p>

        <hr />

        <p><strong>Fecha fabricación:</strong> {equipo.FECHA_FABRICACION || "N/A"}</p>
        <p><strong>Fecha garantía:</strong> {equipo.FECHA_GARANTIA || "N/A"}</p>
        <p><strong>Disco duro:</strong> {equipo.DISCO_DURO || "N/A"}</p>
        <p><strong>RAM:</strong> {equipo.RAM || "N/A"}</p>
        <p><strong>Modelo procesador:</strong> {equipo.MODELO_PROCESADOR || "N/A"}</p>
        <p><strong>Sistema operativo:</strong> {equipo.SISTEMA_OPERATIVO || "N/A"}</p>
        <p><strong>Lector de huella:</strong> {equipo.LECTOR_DE_HUELLA || "N/A"}</p>
        <p><strong>Conexión:</strong> {equipo.CONEXION || "N/A"}</p>
        <p><strong>Puerto:</strong> {equipo.PUERTO || "N/A"}</p>
        <p><strong>Comentario:</strong> {equipo.COMENTARIO || "N/A"}</p>
      </div>
    </div>
  );
}

export default InventarioDetallePage;