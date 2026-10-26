
import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, KeyRound } from "lucide-react";
import { toast } from "react-toastify";

import { obtenerLicencias } from "../services/licenciasService";
import "../styles/LicenciasPage.css";

export default function LicenciasPage() {
  const [licencias, setLicencias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(true);

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

  return (
    <div className="licencias-page">
      <div className="licencias-header">
        <div>
          <h1>Gestor de licencias</h1>
          <p>
            Consulta las licencias de software registradas
            y su asignación a equipos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => cargarLicencias(estado)}
          disabled={cargando}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      <div className="licencias-toolbar">
        <div className="licencias-busqueda">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar software, versión o equipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

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

      <div className="licencias-tabla-contenedor">
        <table className="licencias-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Software</th>
              <th>Versión</th>
              <th>Tipo de licencia</th>
              <th>Equipo asignado</th>
              <th>Fecha de activación</th>
              <th>Estado</th>
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
                  <td>{licencia.ID_LICENCIA}</td>
                  <td>
                    <span className="licencias-software">
                      <KeyRound size={16} />
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
                      className={`licencias-estado ${
                        licencia.ESTADO
                      }`}
                    >
                      {licencia.ESTADO === "EN_USO"
                        ? "En uso"
                        : licencia.ESTADO === "OBSOLETA"
                          ? "Obsoleta"
                          : "Disponible"}
                    </span>
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
  );
}
