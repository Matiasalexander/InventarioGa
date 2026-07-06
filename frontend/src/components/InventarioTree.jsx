import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, Building2, MapPin } from "lucide-react";
import { obtenerArbolUnidades } from "../services/inventarioTreeService";

export default function InventarioTree({ onSeleccionarUnidad, unidadSeleccionada }) {
  const [arbol, setArbol] = useState([]);
  const [abiertos, setAbiertos] = useState({});
  const [busquedaArbol, setBusquedaArbol] = useState("");

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

  const arbolFiltrado = arbol.filter((marca) => {
  const texto = busquedaArbol.toLowerCase().trim();

  if (!texto) return true;

  const coincideMarca = marca.nombre?.toLowerCase().includes(texto);

  const coincideUnidad = marca.children?.some((unidad) =>
    unidad.nombre?.toLowerCase().includes(texto)
  );

  return coincideMarca || coincideUnidad;
});

const expandirTodo = () => {
  const abiertosTemp = {};

  arbol.forEach((marca) => {
    abiertosTemp[marca.id] = true;
  });

  setAbiertos(abiertosTemp);
};

const contraerTodo = () => {
  setAbiertos({});
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
<input
  placeholder="Buscar unidad..."
  value={busquedaArbol}
  onChange={(e) => setBusquedaArbol(e.target.value)}
  style={{
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 13
  }}
/>

<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
  <button type="button" onClick={expandirTodo}>
    Expandir
  </button>

  <button type="button" onClick={contraerTodo}>
    Contraer
  </button>
</div>
      {arbolFiltrado.map((marca) => (
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
        <span style={{ flex: 1 }}>{marca.nombre}</span>
<span style={{ fontSize: 12, color: "#64748b" }}>
  ({marca.total || 0})
</span>
          </div>

          {/* CAMBIO: aquí recuperamos el .map de unidades y calculamos si está activa */}
          {abiertos[marca.id] &&
            marca.children.map((unidad) => {
              const activo = unidadSeleccionada === unidad.id;

              return (
                <div
                  key={unidad.id}
                  onClick={() =>
                    onSeleccionarUnidad?.(
                      unidad.id,
                      `${marca.nombre} / ${unidad.nombre}`
                    )
                  }
                  style={{
                    marginLeft: 28,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    cursor: "pointer",
                    borderRadius: 6,

                    // CAMBIO: estilos para marcar la unidad seleccionada
                    background: activo ? "#eef2ff" : "transparent",
                    color: activo ? "#4f46e5" : "inherit",
                    fontWeight: activo ? 700 : 400,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f3f4f6")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = activo
                      ? "#eef2ff"
                      : "transparent")
                  }
                >
                  <MapPin size={15} />
                <span style={{ flex: 1 }}>{unidad.nombre}</span>
<span style={{ fontSize: 12, color: activo ? "#4f46e5" : "#64748b" }}>
  ({unidad.total || 0})
</span>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}