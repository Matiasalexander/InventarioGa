import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerInventario,
  eliminarInventario,
  exportarInventarioExcel
} from "../services/inventarioService";
import { obtenerArbolUnidades } from "../services/inventarioTreeService";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import "../styles/InventarioPage.css";
import InventarioAccionesMenu from "../components/InventarioAccionesMenu";
import FiltrosModal from "../components/FiltrosModal";
import { FileUp } from "lucide-react";
import { Search } from "lucide-react";

function InventarioPage({ setLoading }) {
  const navigate = useNavigate();
  const { tienePermiso } = useAuth();

const puedeCrear = tienePermiso("inventario.crear");
const puedeEditar = tienePermiso("inventario.editar");
const puedeEliminar = tienePermiso("inventario.eliminar");
const puedeExportar = tienePermiso("inventario.exportar");





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
  cargarInventario();
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
  const localidadSeleccionada = useMemo(()=>localidadesDisponibles.find((unidad)=>Number(unidad.id) === Number(unidadSeleccionada)), [localidadesDisponibles, unidadSeleccionada]);

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
        const coincideLocalidad =
  !localidadSeleccionada?.nombre ||
  String(item.LOCALIDAD || "").trim().toLowerCase() ===
    String(localidadSeleccionada.nombre || "").trim().toLowerCase();

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
        coincideLocalidad &&
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
    restauranteActual,
    localidadSeleccionada
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
  const handleRestauranteChange =  (event) => {
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
  };

  // NUEVO:
  // Selección de la localidad/unidad.
const handleLocalidadChange = (event) => {
  const idUnidad = event.target.value;

  if (!idUnidad) {
    setUnidadSeleccionada(null);
    setUnidadNombreSeleccionada("");

    sessionStorage.removeItem("inventario_unidad_id");
    sessionStorage.removeItem("inventario_unidad_nombre");

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

  sessionStorage.setItem(
    "inventario_unidad_id",
    idUnidad
  );

  sessionStorage.setItem(
    "inventario_unidad_nombre",
    nombreCompleto
  );

  sessionStorage.removeItem("inventario_busqueda");
};
  // NUEVO:
  // Limpia solamente los filtros secundarios.
const limpiarFiltros = () => {
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

  setPaginaActual(1);
};

  const limpiarFiltrosSecundarios = () => {
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
  const mostrarTodos = () => {
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
       {puedeExportar && (
  
    <button
        type="button"
        className="btn-export"
        onClick={descargarExcel}
    >
      <FileUp className="file-icon"/>
       Exportar Excel
    </button>
)}

          {puedeCrear && (
            <button type="button" onClick={irAgregar}>
              + Agregar equipo
            </button>
          )}
        </div>
      </div>

      <div className="card">
<div className="toolbar">

  <div className="toolbar-header">
    <h2>Equipos</h2>
    <p>
      {puedeEditar
        ? "Consulta, actualiza o elimina registros del inventario."
        : "Consulta de registros del inventario."}
    </p>
  </div>

  <div className="toolbar-search">
    <input
      className="search-input"
      placeholder="Buscar por equipo, serial, marca, IP, responsiva..."
      value={busqueda}
      onChange={(event) => {
        const valor = event.target.value;
        setBusqueda(valor);
        sessionStorage.setItem("inventario_busqueda", valor);
      }}

    />    

    <button
      type="button"
      onClick={() => setMostrarFiltros(prev => !prev)}
      className={`btn-filtros ${mostrarFiltros ? "activo" : ""}`}
    >
      Filtros

      {cantidadFiltrosActivos > 0 && (
        <span className="badge-filtros">
          {cantidadFiltrosActivos}
        </span>
      )}
    </button>
  </div>

</div>

        {/* NUEVO:
            Restaurante y localidad ahora viven dentro del panel.
            Ya no se renderiza InventarioTree ni tree-panel. */}
<FiltrosModal
  abierto={mostrarFiltros}
  onCerrar={() => setMostrarFiltros(false)}

  onMostrarTodos={mostrarTodos}
  onLimpiarFiltros={limpiarFiltros}
  onLimpiarFiltrosSecundarios = {limpiarFiltrosSecundarios}

  arbolUnidades={arbolUnidades}

  restauranteSeleccionado={restauranteSeleccionado}
  unidadSeleccionada={unidadSeleccionada}

  localidadesDisponibles={localidadesDisponibles}

  filtros={filtros}
  setFiltros={setFiltros}

  tiposEquipo={tiposEquipo}
  marcas={marcas}
  estatusDisponibles={estatusDisponibles}
  estadosFisicos={estadosFisicos}

  handleRestauranteChange={handleRestauranteChange}
  handleLocalidadChange={handleLocalidadChange}
/>
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