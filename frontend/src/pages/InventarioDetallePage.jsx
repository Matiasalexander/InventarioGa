import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerInventarioPorId } from "../services/inventarioService";
import "../styles/InventarioDetallePage.css";

function InventarioDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState("");
  const [departamentos, setDepartamentos] = useState([]);
  const [procesadores, setProcesadores]=useState([]);

useEffect(() => {
  const cargarDatos = async () => {
    try {
      const data = await obtenerInventarioPorId(id);
      setEquipo(data);

      const response = await fetch("http://localhost:3001/api/catalogos");
      const catalogos = await response.json();

      setProcesadores(catalogos.procesadores);
      setDepartamentos(catalogos.departamentos);

    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la información");
    }
  };

  cargarDatos();
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

  const procesador = procesadores.find(
    (item)=>item.id == equipo.ID_PROCESADOR
  );

  const departamento = departamentos.find(
    (item)=>item.Id == equipo.ID_DEPARTAMENTO
  );



  return (

    <div className="contenedor">

    <div className="header">

        <div>
            <h1>{equipo.NOMBRE_EQUIPO}</h1>
            <p>Detalle del equipo</p>
        </div>

        <button
            type="button"
            onClick={() => navigate("/inventario")}
        >
            ← Volver
        </button>

    </div>

    <div className="detalle-grid">

        <div className="card">

            <h2>Información general</h2>

            <div className="detalle-item">
                <span>Localidad</span>
                <strong>{equipo.LOCALIDAD || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Ubicación</span>
                <strong>{equipo.UBICACION || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Departamento</span>
                <strong>{departamento?.Nombre_departamento || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Serial</span>
                <strong>{equipo.SERIAL || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Modelo</span>
                <strong>{equipo.MODELO || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>IP</span>
                <strong>{equipo.IP || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Correo</span>
                <strong>{equipo.CORREO || "N/A"}</strong>
            </div>

        </div>

        <div className="card">

            <h2> Especificaciones</h2>

            <div className="detalle-item">
                <span>Procesador</span>
                <strong>{procesador?.Nombre || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Modelo procesador</span>
                <strong>{equipo.MODELO_PROCESADOR || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>RAM</span>
                <strong>{equipo.RAM || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Disco duro</span>
                <strong>{equipo.DISCO_DURO || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Sistema operativo</span>
                <strong>{equipo.SISTEMA_OPERATIVO || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Conexión</span>
                <strong>{equipo.CONEXION || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Puerto</span>
                <strong>{equipo.PUERTO || "N/A"}</strong>
            </div>

        </div>

        <div className="card">

            <h2> Estado y fecha</h2>

            <div className="detalle-item">
                <span>Estado físico</span>
                <strong>{equipo.ESTADO_FISICO || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Fecha fabricación</span>
                <strong>{equipo.FECHA_FABRICACION || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Fecha garantía</span>
                <strong>{equipo.FECHA_GARANTIA || "N/A"}</strong>
            </div>

            <div className="detalle-item">
                <span>Lector de huella</span>
                <strong>{equipo.LECTOR_DE_HUELLA || "N/A"}</strong>
            </div>

        </div>

        <div className="card">

            <h2> Comentarios</h2>

            <p className="comentario">
                {equipo.COMENTARIO || "Sin comentarios registrados."}
            </p>

        </div>

    </div>

</div>
  );
}

export default InventarioDetallePage;