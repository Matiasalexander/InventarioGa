import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerInventario,
  eliminarInventario,
  exportarInventarioExcel
} from "../services/inventarioService";
import { obtenerArbolUnidades } from "../services/inventarioTreeService";
import { toast } from "react-toastify";
import { getRol } from "../utils/roles";
import "../styles/InventarioPage.css";
import InventarioAccionesMenu from "../components/InventarioAccionesMenu";

function InventarioPage({ setLoading }) {
  const navigate = useNavigate();
  const rol = getRol();

  const puedeCrear = rol === "Administrador" || rol === "Sistemas";
  const puedeEditar = rol === "Administrador" || rol === "Sistemas";
  const puedeEliminar = rol === "Administrador";

  const [inventario, setInventario] = useState([]);
  const [arbolUnidades, setArbolUnidades] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // NUEVO:
  // La búsqueda se conserva mientras la pestaña siga abierta.
  const [busqueda, setBusqueda] = useState(
    sessionStorage.getItem("inventario_busqueda") || ""
  );

  // NUEVO:
  // Conserva el restaurante seleccionado.
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(
    sessionStorage.getItem("inventario_restaurante_id") || ""
  );

  // NUEVO:
  // Conserva la localidad/unidad seleccionada.
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(() => {
    const unidadGuardada = sessionStorage.getItem("inventario_unidad_id");
    return unidadGuardada ? Number(unidadGuardada) : null;
  });

  const [unidadNombreSeleccionada, setUnidadNombreSeleccionada] = useState(
    sessionStorage.getItem("inventario_unidad_nombre") || ""
  );
  // NUEVO: paginación de la tabla
const [paginaActual, setPaginaActual] = useState(1);
const [registrosPorPagina, setRegistrosPorPagina] = useState(20);

  // NUEVO:
  // Filtros persistentes del panel.
  const [filtros, setFiltros] = useState(() => {
    const guardados = sessionStorage.getItem("inventario_filtros");

    return guardados
      ? JSON.parse(guardados)
      : {
          tipoEquipo: "",
          marca: "",
          estatus: "",
          estadoFisico: "",
          responsiva: ""
        };
  });

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

  const cargarArbolUnidades = async () => {
    try {
      const data = await obtenerArbolUnidades();
      setArbolUnidades(data);
    } catch (error) {
      console.error("Error cargando unidades:", error);
      toast.error("Error cargando unidades");
    }
  };

  useEffect(() => {
    cargarArbolUnidades();

    // NUEVO:
    // Si había una localidad guardada, vuelve a cargar esa localidad.
    cargarInventario(unidadSeleccionada);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      "inventario_filtros",
      JSON.stringify(filtros)
    );
  }, [filtros]);
  useEffect(() => {
  setPaginaActual(1);
}, [
  busqueda,
  filtros,
  restauranteSeleccionado,
  unidadSeleccionada,
  registrosPorPagina
]);

  // NUEVO:
  // Obtiene el restaurante elegido dentro del catálogo del árbol.
  const restauranteActual = useMemo(
    () =>
      arbolUnidades.find(
        (restaurante) =>
          String(restaurante.id) === String(restauranteSeleccionado)
      ),
    [arbolUnidades, restauranteSeleccionado]
  );

  // NUEVO:
  // Las localidades dependen del restaurante seleccionado.
  const localidadesDisponibles = restauranteActual?.children || [];

  const inventarioFiltrado = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inventario.filter((item) => {
      const coincideBusqueda =
        !texto ||
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
          .includes(texto);

      // NUEVO:
      // Permite filtrar por restaurante aun antes de elegir localidad.
      const coincideRestaurante =
        !restauranteActual?.nombre ||
        item.UNIDAD === restauranteActual.nombre;

      const coincideTipo =
        !filtros.tipoEquipo ||
        item.TIPO_EQUIPO === filtros.tipoEquipo;

      const coincideMarca =
        !filtros.marca ||
        item.MARCA === filtros.marca;

      const coincideEstatus =
        !filtros.estatus ||
        item.ESTATUS === filtros.estatus;

      const coincideEstadoFisico =
        !filtros.estadoFisico ||
        item.ESTADO_FISICO === filtros.estadoFisico;

      const coincideResponsiva =
        !filtros.responsiva ||
        (filtros.responsiva === "asignado"
          ? Boolean(item.RESPONSIVA_DIGITAL)
          : !item.RESPONSIVA_DIGITAL);

      return (
        coincideBusqueda &&
        coincideRestaurante &&
        coincideTipo &&
        coincideMarca &&
        coincideEstatus &&
        coincideEstadoFisico &&
        coincideResponsiva
      );
    });
  }, [
    busqueda,
    inventario,
    filtros,
    restauranteActual
  ]);
// NUEVO: cálculos de paginación
const totalRegistros = inventarioFiltrado.length;

const totalPaginas = Math.max(
  1,
  Math.ceil(totalRegistros / registrosPorPagina)
);

const indiceInicial =
  (paginaActual - 1) * registrosPorPagina;

const indiceFinal =
  indiceInicial + registrosPorPagina;

const inventarioPaginado = inventarioFiltrado.slice(
  indiceInicial,
  indiceFinal
);
  const tiposEquipo = useMemo(
    () =>
      [
        ...new Set(
          inventario
            .map((item) => item.TIPO_EQUIPO)
            .filter(Boolean)
        )
      ].sort(),
    [inventario]
  );

  const marcas = useMemo(
    () =>
      [
        ...new Set(
          inventario
            .map((item) => item.MARCA)
            .filter(Boolean)
        )
      ].sort(),
    [inventario]
  );

  const estatusDisponibles = useMemo(
    () =>
      [
        ...new Set(
          inventario
            .map((item) => item.ESTATUS)
            .filter(Boolean)
        )
      ].sort(),
    [inventario]
  );

  const estadosFisicos = useMemo(
    () =>
      [
        ...new Set(
          inventario
            .map((item) => item.ESTADO_FISICO)
            .filter(Boolean)
        )
      ].sort(),
    [inventario]
  );

  // NUEVO:
  // Selección del restaurante desde el panel.
  const handleRestauranteChange = async (event) => {
    const idRestaurante = event.target.value;

    setRestauranteSeleccionado(idRestaurante);
    setUnidadSeleccionada(null);
    setUnidadNombreSeleccionada("");
    setBusqueda("");

    if (idRestaurante) {
      sessionStorage.setItem(
        "inventario_restaurante_id",
        idRestaurante
      );
    } else {
      sessionStorage.removeItem("inventario_restaurante_id");
    }

    sessionStorage.removeItem("inventario_unidad_id");
    sessionStorage.removeItem("inventario_unidad_nombre");
    sessionStorage.removeItem("inventario_busqueda");

    // Carga el inventario general y el useMemo filtra por restaurante.
    await cargarInventario();
  };

  // NUEVO:
  // Selección de la localidad/unidad.
  const handleLocalidadChange = async (event) => {
    const idUnidad = event.target.value;

    if (!idUnidad) {
      setUnidadSeleccionada(null);
      setUnidadNombreSeleccionada("");

      sessionStorage.removeItem("inventario_unidad_id");
      sessionStorage.removeItem("inventario_unidad_nombre");

      await cargarInventario();
      return;
    }

    const unidad = localidadesDisponibles.find(
      (item) => String(item.id) === String(idUnidad)
    );

    const nombreCompleto = unidad
      ? `${restauranteActual?.nombre || ""} / ${unidad.nombre}`
      : "";

    setUnidadSeleccionada(Number(idUnidad));
    setUnidadNombreSeleccionada(nombreCompleto);
    setBusqueda("");

    sessionStorage.setItem("inventario_unidad_id", idUnidad);
    sessionStorage.setItem(
      "inventario_unidad_nombre",
      nombreCompleto
    );
    sessionStorage.removeItem("inventario_busqueda");

    await cargarInventario(Number(idUnidad));
  };

  // NUEVO:
  // Limpia solamente los filtros secundarios.
  const limpiarFiltros = () => {
    const filtrosVacios = {
      tipoEquipo: "",
      marca: "",
      estatus: "",
      estadoFisico: "",
      responsiva: ""
    };

    setFiltros(filtrosVacios);
    sessionStorage.removeItem("inventario_filtros");
  };

  // NUEVO:
  // Limpia restaurante, localidad, búsqueda y filtros.
  const mostrarTodos = async () => {
    setRestauranteSeleccionado("");
    setUnidadSeleccionada(null);
    setUnidadNombreSeleccionada("");
    setBusqueda("");

    setFiltros({
      tipoEquipo: "",
      marca: "",
      estatus: "",
      estadoFisico: "",
      responsiva: ""
    });

    sessionStorage.removeItem("inventario_restaurante_id");
    sessionStorage.removeItem("inventario_unidad_id");
    sessionStorage.removeItem("inventario_unidad_nombre");
    sessionStorage.removeItem("inventario_busqueda");
    sessionStorage.removeItem("inventario_filtros");

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
    const confirmar = window.confirm(
      "¿Deseas eliminar este equipo?"
    );

    if (!confirmar) return;

    try {
      await eliminarInventario(id);

      // Conserva la localidad después de borrar.
      await cargarInventario(unidadSeleccionada);

      toast.success("Equipo eliminado correctamente");
    } catch (error) {
      console.error(
        "Error eliminando equipo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.error ||
          "Error eliminando equipo"
      );
    }
  };

  const descargarExcel = async () => {
    try {
      setLoading(true);

      const blob = await exportarInventarioExcel(
        unidadSeleccionada
      );

      const url = window.URL.createObjectURL(
        new Blob([blob], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        })
      );

      const link = document.createElement("a");
      link.href = url;

      const nombreArchivo = unidadNombreSeleccionada
        ? `Inventario_${unidadNombreSeleccionada.replaceAll(
            " / ",
            "_"
          )}.xlsx`
        : restauranteActual?.nombre
          ? `Inventario_${restauranteActual.nombre.replaceAll(
              " ",
              "_"
            )}.xlsx`
          : "Inventario_General.xlsx";

      link.download = nombreArchivo;

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
    Activo: "badge badge-activo",
    Baja: "badge badge-baja"
  };

  const labelFiltroStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#475569"
  };

  const selectFiltroStyle = {
    width: "100%",
    padding: "9px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "white",
    color: "#0f172a",
    fontSize: 13,
    outline: "none"
  };

  // NUEVO:
  // Cuenta también restaurante y localidad como filtros activos.
  const cantidadFiltrosActivos =
    Object.values(filtros).filter(Boolean).length +
    (restauranteSeleccionado ? 1 : 0) +
    (unidadSeleccionada ? 1 : 0);

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Inventario</h1>
          <p>Administración de equipos registrados.</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <button type="button" onClick={descargarExcel}>
            📥 Exportar Excel
          </button>

          {puedeCrear && (
            <button type="button" onClick={irAgregar}>
              + Agregar equipo
            </button>
          )}
        </div>
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

            {(restauranteSeleccionado ||
              unidadSeleccionada) && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  fontSize: 13,
                  color: "#4f46e5",
                  fontWeight: 600
                }}
              >
                <span>
                  📍{" "}
                  {unidadNombreSeleccionada ||
                    restauranteActual?.nombre}
                </span>

                <button
                  type="button"
                  onClick={mostrarTodos}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#48506a",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Mostrar todos
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap"
            }}
          >
            <input
              className="search-input"
              placeholder="Buscar por equipo, serial, marca, IP, responsiva..."
              value={busqueda}
              onChange={(event) => {
                const valor = event.target.value;

                setBusqueda(valor);
                sessionStorage.setItem(
                  "inventario_busqueda",
                  valor
                );
              }}
            />

            <button
              type="button"
              onClick={() =>
                setMostrarFiltros((prev) => !prev)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: mostrarFiltros
                  ? "#eef2ff"
                  : "white",
                color: mostrarFiltros
                  ? "#4338ca"
                  : "#334155",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Filtros

              {cantidadFiltrosActivos > 0 && (
                <span
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 999,
                    background: "#4f46e5",
                    color: "white",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11
                  }}
                >
                  {cantidadFiltrosActivos}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* NUEVO:
            Restaurante y localidad ahora viven dentro del panel.
            Ya no se renderiza InventarioTree ni tree-panel. */}
        {mostrarFiltros && (
          <div
            style={{
              margin: "0 16px 16px",
              padding: 18,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              background: "white",
              boxShadow:
                "0 8px 24px rgba(15, 23, 42, 0.08)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16
                  }}
                >
                  Filtros de inventario
                </h3>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: "#64748b"
                  }}
                >
                  Selecciona una unidad y refina los equipos
                  mostrados.
                </p>
              </div>

              <button
                type="button"
                onClick={mostrarTodos}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#dc2626",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Limpiar todo
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14
              }}
            >
              {/* NUEVO: filtro Restaurante */}
              <div>
                <label style={labelFiltroStyle}>
                  Restaurante
                </label>

                <select
                  value={restauranteSeleccionado}
                  onChange={handleRestauranteChange}
                  style={selectFiltroStyle}
                >
                  <option value="">
                    Todos los restaurantes
                  </option>

                  {arbolUnidades.map((restaurante) => (
                    <option
                      key={restaurante.id}
                      value={restaurante.id}
                    >
                      {restaurante.nombre} (
                      {restaurante.total || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* NUEVO: filtro Localidad dependiente */}
              <div>
                <label style={labelFiltroStyle}>
                  Localidad
                </label>

                <select
                  value={unidadSeleccionada || ""}
                  onChange={handleLocalidadChange}
                  disabled={!restauranteSeleccionado}
                  style={{
                    ...selectFiltroStyle,
                    opacity: restauranteSeleccionado
                      ? 1
                      : 0.55,
                    cursor: restauranteSeleccionado
                      ? "pointer"
                      : "not-allowed"
                  }}
                >
                  <option value="">
                    {restauranteSeleccionado
                      ? "Todas las localidades"
                      : "Selecciona un restaurante"}
                  </option>

                  {localidadesDisponibles.map((unidad) => (
                    <option
                      key={unidad.id}
                      value={unidad.id}
                    >
                      {unidad.nombre} ({unidad.total || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelFiltroStyle}>
                  Tipo de equipo
                </label>

                <select
                  value={filtros.tipoEquipo}
                  onChange={(event) =>
                    setFiltros((prev) => ({
                      ...prev,
                      tipoEquipo: event.target.value
                    }))
                  }
                  style={selectFiltroStyle}
                >
                  <option value="">Todos</option>

                  {tiposEquipo.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelFiltroStyle}>
                  Marca
                </label>

                <select
                  value={filtros.marca}
                  onChange={(event) =>
                    setFiltros((prev) => ({
                      ...prev,
                      marca: event.target.value
                    }))
                  }
                  style={selectFiltroStyle}
                >
                  <option value="">Todas</option>

                  {marcas.map((marca) => (
                    <option key={marca} value={marca}>
                      {marca}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelFiltroStyle}>
                  Estatus
                </label>

                <select
                  value={filtros.estatus}
                  onChange={(event) =>
                    setFiltros((prev) => ({
                      ...prev,
                      estatus: event.target.value
                    }))
                  }
                  style={selectFiltroStyle}
                >
                  <option value="">Todos</option>

                  {estatusDisponibles.map((estatus) => (
                    <option
                      key={estatus}
                      value={estatus}
                    >
                      {estatus}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelFiltroStyle}>
                  Estado físico
                </label>

                <select
                  value={filtros.estadoFisico}
                  onChange={(event) =>
                    setFiltros((prev) => ({
                      ...prev,
                      estadoFisico: event.target.value
                    }))
                  }
                  style={selectFiltroStyle}
                >
                  <option value="">Todos</option>

                  {estadosFisicos.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelFiltroStyle}>
                  Responsiva
                </label>

                <select
                  value={filtros.responsiva}
                  onChange={(event) =>
                    setFiltros((prev) => ({
                      ...prev,
                      responsiva: event.target.value
                    }))
                  }
                  style={selectFiltroStyle}
                >
                  <option value="">Todas</option>
                  <option value="asignado">
                    Con responsiva
                  </option>
                  <option value="disponible">
                    Sin responsiva
                  </option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 14
              }}
            >
              <button
                type="button"
                onClick={limpiarFiltros}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "white",
                  color: "#475569",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Limpiar filtros secundarios
              </button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Localidad</th>
                <th>Ubicación</th>
                <th>Tipo equipo</th>
                <th>Nombre equipo</th>
                <th>Serial</th>
                <th>Marca</th>
                <th>Modelo</th>
                {/* <th>IP</th> */}
                <th>Estatus</th>
                {/* <th>Responsiva</th> */}
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {inventarioPaginado.map((item) => (
                <tr key={item.id}>
                  <td>{item.UNIDAD}</td>
                  <td>{item.LOCALIDAD}</td>
                  <td>{item.UBICACION}</td>
                  <td>{item.TIPO_EQUIPO}</td>
                  <td>{item.NOMBRE_EQUIPO}</td>
                  <td>{item.SERIAL}</td>
                  <td>{item.MARCA}</td>
                  <td>{item.MODELO}</td>
                  {/* <td>{item.IP}</td> */}

                  <td>
                    <span
                      className={
                        estados[item.ESTATUS] ||
                        "badge badge-default"
                      }
                    >
                      {item.ESTATUS || "Sin estatus"}
                    </span>
                  </td>

              {/*    <td>
                    {item.RESPONSIVA_DIGITAL ? (
                      <span className="badge">
                        RESP-
                        {String(
                          item.NUM_RESPONSIVA || ""
                        ).padStart(5, "0")}
                      </span>
                    ) : (
                      <span className="badge">
                        Disponible
                      </span>
                    )}
                  </td>*/}

<td>
  {/* NUEVO:
      Sustituye los tres botones por un menú contextual reutilizable. */}
  <InventarioAccionesMenu
    item={item}
    puedeEditar={puedeEditar}
    puedeEliminar={puedeEliminar}
    onDetalle={irDetalle}
    onEditar={irActualizar}
    onEliminar={borrarEquipo}
  />
</td>
                </tr>
              ))}

              {inventarioFiltrado.length === 0 && (
                <tr>
                  {/* CORRECCIÓN:
                      La tabla tiene 12 columnas, no 13. */}
                  <td colSpan="12">
                    No hay equipos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    {/* NUEVO: barra de paginación */}
<div className="inventario-paginacion">
  <div className="inventario-paginacion-info">
    {totalRegistros === 0
      ? "0 registros"
      : `${indiceInicial + 1}-${Math.min(
          indiceFinal,
          totalRegistros
        )} de ${totalRegistros}`}
  </div>

  <div className="inventario-paginacion-controles">
    <label>
      Registros por página:
    </label>

    <select
      value={registrosPorPagina}
      onChange={(e) =>
        setRegistrosPorPagina(Number(e.target.value))
      }
    >
      <option value={10}>10</option>
      <option value={20}>20</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
    </select>

    <button
      type="button"
      onClick={() =>
        setPaginaActual((prev) =>
          Math.max(1, prev - 1)
        )
      }
      disabled={paginaActual === 1}
      aria-label="Página anterior"
    >
      ‹
    </button>

    <span>
      Página {paginaActual} de {totalPaginas}
    </span>

    <button
      type="button"
      onClick={() =>
        setPaginaActual((prev) =>
          Math.min(totalPaginas, prev + 1)
        )
      }
      disabled={paginaActual === totalPaginas}
      aria-label="Página siguiente"
    >
      ›
    </button>
  </div>
</div>
    </div>
  );
}

export default InventarioPage;