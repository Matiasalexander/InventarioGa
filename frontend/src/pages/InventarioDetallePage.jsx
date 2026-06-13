import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerInventarioPorId } from "../services/inventarioService";
import { obtenerCatalogos } from "../services/catalogosService";
import "./InventarioPage.css";

function InventarioDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equipo, setEquipo] = useState(null);
  const [catalogos, setCatalogos] = useState({
    departamentos: [],
    procesadores: []
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const equipoData = await obtenerInventarioPorId(id);
        const catalogosData = await obtenerCatalogos();

        setEquipo(equipoData);
        setCatalogos(catalogosData);
      } catch (error) {
        console.error("Error cargando detalle:", error.response?.data || error);
        alert("Error cargando detalle del equipo");
      }
    };

    cargarDatos();
  }, [id]);

  if (!equipo) {
    return <p>Cargando...</p>;
  }

  const departamento = catalogos.departamentos.find(
    (item) => String(item.Id) === String(equipo.ID_DEPARTAMENTO)
  );

  const procesador = catalogos.procesadores.find(
    (item) => String(item.id) === String(equipo.ID_PROCESADOR)
  );

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Detalle del equipo</h1>
          <p>Información completa del registro seleccionado.</p>
        </div>

        <button type="button" onClick={() => navigate("/inventario")}>
          Volver
        </button>
      </div>

      <div className="card">
        <h2>{equipo.NOMBRE_EQUIPO || "Equipo sin nombre"}</h2>

        <p><strong>Localidad:</strong> {equipo.LOCALIDAD || "N/A"}</p>
        <p><strong>Ubicación:</strong> {equipo.UBICACION || "N/A"}</p>
        <p><strong>Departamento:</strong> {departamento?.Nombre_departamento || "N/A"}</p>
        <p><strong>Serial:</strong> {equipo.SERIAL || "N/A"}</p>
        <p><strong>Disco duro:</strong> {equipo.DISCO_DURO || "N/A"}</p>
        <p><strong>Memoria RAM:</strong> {equipo.RAM || "N/A"}</p>
        <p><strong>Procesador:</strong> {procesador?.Nombre || "N/A"}</p>
        <p><strong>Modelo procesador:</strong> {equipo.MODELO_PROCESADOR || "N/A"}</p>
        <p><strong>Sistema operativo:</strong> {equipo.SISTEMA_OPERATIVO || "N/A"}</p>
      </div>
    </div>
  );
}

export default InventarioDetallePage;