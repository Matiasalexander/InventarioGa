import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, Building2, MapPin, UtensilsCrossed, PoundSterlingIcon, Store } from "lucide-react";
import { obtenerArbolUnidades } from "../services/inventarioTreeService";
import "../styles/InventarioTree.css";

export default function InventarioTree({
  onSeleccionarUnidad,
  unidadSeleccionada,
}) {
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
    <div className="tree-container">
      <h3 className="tree-title">Unidades</h3>

      <input
        className="tree-search"
        placeholder="Buscar unidad..."
        value={busquedaArbol}
        onChange={(e) => setBusquedaArbol(e.target.value)}
      />

      <div className="tree-actions">
        <button className="tree-btn tree-btn-expand" onClick={expandirTodo}>
          Expandir
        </button>

        <button className="tree-btn tree-btn-collapse" onClick={contraerTodo}>
          Contraer
        </button>
      </div>

      {arbolFiltrado.map((marca) => (
        <div key={marca.id}>
          <div
            className="tree-brand"
            onClick={() => toggle(marca.id)}
          >
            {abiertos[marca.id] ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}

            <Building2 size={16} />

            <span className="tree-brand-name">
              {marca.nombre}
            </span>

            <span className="tree-count">
              ({marca.total || 0})
            </span>
          </div>

          {abiertos[marca.id] &&
            marca.children.map((unidad) => {
              const activo = unidadSeleccionada === unidad.id;

              return (
                <div
                  key={unidad.id}
                  className={`tree-unit ${activo ? "active" : ""}`}
                  onClick={() =>
                    onSeleccionarUnidad?.(
                      unidad.id,
                      `${marca.nombre} / ${unidad.nombre}`
                    )
                  }
                >
                  <MapPin size={15} />

                  <span className="tree-unit-name">
                    {unidad.nombre}
                  </span>

                  <span className="tree-count">
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