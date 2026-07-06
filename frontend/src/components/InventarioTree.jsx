import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, Building2, MapPin } from "lucide-react";
import { obtenerArbolUnidades } from "../services/inventarioTreeService";

export default function InventarioTree({ onSeleccionarUnidad }) {
  const [arbol, setArbol] = useState([]);
  const [abiertos, setAbiertos] = useState({});

  useEffect(() => {
    cargarArbol();
  }, []);

  const cargarArbol = async () => {
    try {
      const data = await obtenerArbolUnidades();
      setArbol(data);
    } catch (error) {
      console.error(error);
    }
  };

  const toggle = (id) => {
    setAbiertos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      style={{
        width: 260,
        borderRight: "1px solid #e5e7eb",
        padding: 15,
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginBottom: 15 }}>Grupo Anderson's</h3>

      {arbol.map((marca) => (
        <div key={marca.id}>

          <div
            onClick={() => toggle(marca.id)}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 4px",
              fontWeight: 600,
            }}
          >
            {abiertos[marca.id] ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}

            <Building2 size={16} />

            {marca.nombre}
          </div>

          {abiertos[marca.id] &&
  marca.children.map((unidad) => (
    <div
      key={unidad.id}
      onClick={() => onSeleccionarUnidad?.(unidad.id)}
      style={{
        marginLeft: 28,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
        cursor: "pointer",
        borderRadius: 6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <MapPin size={15} />
      {unidad.nombre}
    </div>
  ))}
        </div>
      ))}
    </div>
  );
}