
import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

import { obtenerLicencias, liberarLicenciaDeEquipo } from "../services/licenciasService";
import "../styles/LicenciasPage.css";

//import del modal de licencias
import LicenciaFormModal from "../components/LicenciaFormModal";
import LicenciaDetalleModal from "../components/LicenciaDetalleModal";
import LicenciaEditarModal from "../components/LicenciaEditarModal";

//ACCIONES DE LA PAGE
import LicenciasAcciones from "../components/LicenciasAcciones";

export default function LicenciasPage() {
    const [licencias, setLicencias] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState("");
    const [cargando, setCargando] = useState(true);
    const [mostarModalRegistro, setMostrarModalRegistro] = useState(false);

    //ESTADOS DE LAS ACCIONES
const [idLicenciaEditar, setIdLicenciaEditar] =
  useState(null);
    const [idLicenciaProcesando, setIdLicenciaProcesando] =
        useState(null);

    const [idLicenciaDetalle, setIdLicenciaDetalle] =
        useState(null);

    const cargarLicencias = async (estadoActual = "") => {
        try {
            setCargando(true);

            const resultado = await obtenerLicencias(estadoActual);

            if (!Array.isArray(resultado)) {
                throw new Error("Formato de respuesta inválido.");
            }

            setLicencias(resultado);
        } catch (error) {
            console.error("Error consultando licencias:", error);

            toast.error(
                error.response?.data?.message ||
                "No se pudieron cargar las licencias."
            );
        } finally {
            setCargando(false);
        }
    };


    const manejarDesvinculacion = async (licencia) => {
        if (
            idLicenciaProcesando !== null ||
            licencia.ESTADO !== "EN_USO"
        ) {
            return;
        }

        const nombre =
            `${licencia.SOFTWARE} ${licencia.VERSION}`;

        const confirmado = window.confirm(
            `¿Desvincular la licencia "${nombre}"?\n\n` +
            `Equipo actual: ${licencia.NOMBRE_EQUIPO || "Sin nombre"}\n\n` +
            "La licencia cambiará a OBSOLETA y ya no " +
            "estará disponible para asignación.\n\n" +
            "Esta operación conservará el historial."
        );

        if (!confirmado) return;

        setIdLicenciaProcesando(licencia.ID_LICENCIA);

        try {
            const resultado = await liberarLicenciaDeEquipo(
                licencia.ID_LICENCIA
            );
console.log(
  "Respuesta de liberación:",
  resultado
);

// La API respondió correctamente.
// Recargamos la información real del backend.
toast.success(
  "Licencia desvinculada correctamente."
);

await cargarLicencias(estado);

        } catch (error) {
            console.error(
                "Error desvinculando licencia:",
                error
            );

            toast.error(
                error.response?.data?.message ||
                "No se pudo completar o verificar la desvinculación."
            );

            // Si se perdió una respuesta de red, consultar
            // nuevamente para conocer el estado real.
            await cargarLicencias(estado);

        } finally {
            setIdLicenciaProcesando(null);
        }
    };


    useEffect(() => {
        cargarLicencias(estado);
    }, [estado]);

    const licenciasFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) return licencias;

        return licencias.filter((licencia) =>
            [
                licencia.SOFTWARE,
                licencia.VERSION,
                licencia.TIPO_LICENCIA,
                licencia.NOMBRE_EQUIPO,
                licencia.ESTADO
            ]
                .map((valor) => String(valor ?? ""))
                .join(" ")
                .toLowerCase()
                .includes(texto)
        );
    }, [licencias, busqueda]);

    const formatearFecha = (valor) => {
        if (!valor) return "Sin activar";
        return String(valor).split("T")[0];
    };
    const { tienePermiso } = useAuth();
    const puedeCrear = tienePermiso("licencias.crear");
    return (
        <div className="roles-page">
            <div className="card-user">
                <div className="header-user">
                    <div>
                        <h1>Gestor de licencias</h1>
                        <p>
                            Consulta las licencias de software registradas
                            y su asignación a equipos.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap"
                        }}
                    >
                        <button
                            type="button"
                            className="btn-export"
                            onClick={() => cargarLicencias(estado)}
                            disabled={cargando}
                        >
                            <RefreshCw size={16} />
                            Actualizar
                        </button>

                        {puedeCrear && (
                            <button
                                type="button"
                                onClick={() => setMostrarModalRegistro(true)}

                            >
                                Agregar licencia

                            </button>
                        )}

                    </div>
                </div>
            </div><br></br>

            <div className="card">
                <div className="toolbar">
                    <div className="toolbar-header">
                        <h2>Licencias</h2>
                        <p>
                            Busca licencias de acuerdo al software, versión o equipo.
                        </p>
                    </div>
                    <div className="toolbar-search">
                        <input
                            type="search"
                            className="search-input"
                            placeholder="Buscar software, versión o equipo..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />

                        <select
                            aria-label="Filtrar por estado"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="DISPONIBLE">Disponible</option>
                            <option value="EN_USO">En uso</option>
                            <option value="OBSOLETA">Obsoleta</option>
                        </select>
                    </div>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Software</th>
                                <th>Versión</th>
                                <th>Tipo de licencia</th>
                                <th>Equipo asignado</th>
                                <th>Fecha de activación</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan={7}>
                                        Cargando licencias...
                                    </td>
                                </tr>
                            ) : licenciasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        No se encontraron licencias.
                                    </td>
                                </tr>
                            ) : (
                                licenciasFiltradas.map((licencia) => (
                                    <tr key={licencia.ID_LICENCIA}>
                                        <td>
                                            <span className="licencias-software">
                                                {licencia.SOFTWARE}
                                            </span>
                                        </td>
                                        <td>{licencia.VERSION}</td>
                                        <td>{licencia.TIPO_LICENCIA}</td>
                                        <td>
                                            {licencia.NOMBRE_EQUIPO || "Sin asignar"}
                                        </td>
                                        <td>
                                            {formatearFecha(
                                                licencia.FECHA_ACTIVACION
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`licencias-estado ${licencia.ESTADO
                                                    }`}
                                            >
                                                {licencia.ESTADO === "EN_USO"
                                                    ? "En uso"
                                                    : licencia.ESTADO === "OBSOLETA"
                                                        ? "Obsoleta"
                                                        : "Disponible"}
                                            </span>
                                        </td>


                                        <td>
                                            <LicenciasAcciones
                                                item={licencia}
                                                onDetalle={(idLicencia) =>
                                                    setIdLicenciaDetalle(idLicencia)
                                                }
                                                onDesvincular={manejarDesvinculacion}
onEditar={setIdLicenciaEditar}                                                procesando={idLicenciaProcesando !== null}
                                            />
                                        </td>


                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="licencias-total">
                    {licenciasFiltradas.length} licencia(s)
                    {busqueda && " encontradas"}
                </p>
            </div>

            <LicenciaDetalleModal
                idLicencia={idLicenciaDetalle}
                onCerrar={() => setIdLicenciaDetalle(null)}
            />

            <LicenciaFormModal
                mostrar={mostarModalRegistro}
                onCerrar={() => setMostrarModalRegistro(false)}
                onGuardado={async () => {
                    setMostrarModalRegistro(false);
                    await cargarLicencias(estado);
                }}
            />

            <LicenciaEditarModal
  idLicencia={idLicenciaEditar}
  onCerrar={() => setIdLicenciaEditar(null)}
  onGuardado={async () => {
    setIdLicenciaEditar(null);
    await cargarLicencias(estado);
  }}
/>
        </div>
    );
}
