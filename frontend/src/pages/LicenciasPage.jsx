
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Layers
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

import {
  obtenerLicencias,
  liberarLicenciaDeEquipo
} from "../services/licenciasService";

import LicenciaFormModal from "../components/LicenciaFormModal";
import LicenciaDetalleModal from "../components/LicenciaDetalleModal";
import LicenciaEditarModal from "../components/LicenciaEditarModal";
import LicenciasAcciones from "../components/LicenciasAcciones";

import "../styles/LicenciasPage.css";

const normalizar = (valor) =>
  String(valor ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-MX");

const esGratuita = (licencia) =>
  normalizar(licencia.TIPO_LICENCIA) === "gratuita";

const obtenerClaveGrupo = (licencia) =>
  [
    normalizar(licencia.SOFTWARE),
    normalizar(licencia.VERSION),
    normalizar(licencia.TIPO_LICENCIA)
  ].join("|");

export default function LicenciasPage() {
  const [licencias, setLicencias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [segmento, setSegmento] = useState("comerciales");
  const [gruposAbiertos, setGruposAbiertos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [mostrarModalRegistro, setMostrarModalRegistro] =
    useState(false);

  const [idLicenciaEditar, setIdLicenciaEditar] =
    useState(null);

  const [idLicenciaDetalle, setIdLicenciaDetalle] =
    useState(null);

  const [idLicenciaProcesando, setIdLicenciaProcesando] =
    useState(null);

  const { tienePermiso } = useAuth();
  const puedeCrear = tienePermiso("licencias.crear");

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

    const gratuita = esGratuita(licencia);

    if (gratuita) {
      toast.info(
        "Las licencias gratuitas compartidas deben " +
        "desvincularse desde el equipo correspondiente."
      );
      return;
    }

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
      await liberarLicenciaDeEquipo(
        licencia.ID_LICENCIA
      );

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

      await cargarLicencias(estado);
    } finally {
      setIdLicenciaProcesando(null);
    }
  };

  useEffect(() => {
    cargarLicencias(estado);
  }, [estado]);

  const totales = useMemo(() => {
    const gratuitas = licencias.filter(esGratuita);

    return {
      todas: licencias.length,
      gratuitas: gratuitas.length,
      comerciales: licencias.length - gratuitas.length
    };
  }, [licencias]);

  const licenciasFiltradas = useMemo(() => {
    const texto = normalizar(busqueda);

    return licencias.filter((licencia) => {
      const gratuita = esGratuita(licencia);

      if (segmento === "gratuitas" && !gratuita) {
        return false;
      }

      if (segmento === "comerciales" && gratuita) {
        return false;
      }

      if (!texto) return true;

      const contenido = [
        licencia.ID_LICENCIA,
        licencia.SOFTWARE,
        licencia.VERSION,
        licencia.TIPO_LICENCIA,
        licencia.NOMBRE_EQUIPO,
        licencia.ESTADO
      ]
        .map(normalizar)
        .join(" ");

      return contenido.includes(texto);
    });
  }, [licencias, busqueda, segmento]);

  const filasVisuales = useMemo(() => {
    const resultado = [];
    const grupos = new Map();

    licenciasFiltradas.forEach((licencia) => {
      if (!esGratuita(licencia)) {
        resultado.push({
          tipo: "licencia",
          clave: `licencia-${licencia.ID_LICENCIA}`,
          licencia
        });
        return;
      }

      const clave = obtenerClaveGrupo(licencia);

      if (!grupos.has(clave)) {
        const grupo = {
          tipo: "grupo",
          clave,
          software: licencia.SOFTWARE,
          version: licencia.VERSION,
          licencias: []
        };

        grupos.set(clave, grupo);
        resultado.push(grupo);
      }

      grupos.get(clave).licencias.push(licencia);
    });

    return resultado;
  }, [licenciasFiltradas]);

  const alternarGrupo = (clave) => {
    setGruposAbiertos((actuales) =>
      actuales.includes(clave)
        ? actuales.filter((item) => item !== clave)
        : [...actuales, clave]
    );
  };

  const formatearFecha = (valor) => {
    if (!valor) return "Sin activar";

    return String(valor).split("T")[0];
  };

  const renderizarLicencia = (licencia, dentroDeGrupo = false) => (
    <tr
      key={`licencia-${licencia.ID_LICENCIA}`}
      className={
        dentroDeGrupo
          ? "licencias-fila-agrupada"
          : ""
      }
    >
      <td>
        <span className="licencias-software">
          {dentroDeGrupo && (
            <span className="licencias-indicador-hijo">
              ↳
            </span>
          )}
          {licencia.SOFTWARE}
        </span>

        {dentroDeGrupo && (
          <small className="licencias-id-registro">
            Registro #{licencia.ID_LICENCIA}
          </small>
        )}
      </td>

      <td>{licencia.VERSION}</td>

      <td>
        {licencia.NOMBRE_EQUIPO || "Sin asignar"}
      </td>

      <td>
        <span
          className={`licencias-estado ${licencia.ESTADO}`}
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
          onEditar={setIdLicenciaEditar}
          procesando={idLicenciaProcesando !== null}
        />
      </td>
    </tr>
  );

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
                onClick={() =>
                  setMostrarModalRegistro(true)
                }
              >
                Agregar licencia
              </button>
            )}
          </div>
        </div>
      </div>

      <br />

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-header">
            <h2>Licencias</h2>
            <p>
              Busca licencias por software,
              versión o equipo.
            </p>
          </div>

          <div className="licencias-segmentos" role="group"
            aria-label="Segmentación de licencias"
          >
            <button
              type="button"
              className={
                segmento === "comerciales"
                  ? "licencias-segmento activo"
                  : "licencias-segmento"
              }
              onClick={() =>
                setSegmento("comerciales")
              }
              aria-pressed={segmento === "comerciales"}
            >
              Comerciales
              <span>{totales.comerciales}</span>
            </button>

            <button
              type="button"
              className={
                segmento === "gratuitas"
                  ? "licencias-segmento activo"
                  : "licencias-segmento"
              }
              onClick={() =>
                setSegmento("gratuitas")
              }
              aria-pressed={segmento === "gratuitas"}
            >
              Gratuitas
              <span>{totales.gratuitas}</span>
            </button>

            <button
              type="button"
              className={
                segmento === "todas"
                  ? "licencias-segmento activo"
                  : "licencias-segmento"
              }
              onClick={() =>
                setSegmento("todas")
              }
              aria-pressed={segmento === "todas"}
            >
              Todas
              <span>{totales.todas}</span>
            </button>
          </div>

          <div className="toolbar-search">
            <input
              type="search"
              className="search-input"
              placeholder="Buscar software, versión o equipo..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
            />

            <select
              aria-label="Filtrar por estado"
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value)
              }
            >
              <option value="">Todos los estados</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_USO">En uso</option>
              <option value="OBSOLETA">Obsoleta</option>
            </select>
          </div>
        </div>

        <div className="licencias-tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Software</th>
                <th>Versión</th>
                <th>Equipo asignado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>


<tbody>
  {cargando ? (
    <tr>
      <td colSpan={7}>Cargando licencias...</td>
    </tr>
  ) : filasVisuales.length === 0 ? (
    <tr>
      <td colSpan={7}>
        No se encontraron licencias.
      </td>
    </tr>
  ) : (
    filasVisuales.map((fila) => {
      if (fila.tipo === "licencia") {
        return renderizarLicencia(fila.licencia);
      }

      const abierto =
        gruposAbiertos.includes(fila.clave);

      const totalRegistros =
        fila.licencias.length;

      const totalEnUso =
        fila.licencias.filter(
          (licencia) =>
            licencia.ESTADO === "EN_USO"
        ).length;

      return (
        <Fragment key={`grupo-${fila.clave}`}>
          <tr className="licencias-fila-grupo">
            <td colSpan={7}>
              <button
                type="button"
                className="licencias-grupo-boton"
                onClick={() =>
                  alternarGrupo(fila.clave)
                }
                aria-expanded={abierto}
              >
                <span className="licencias-grupo-identidad">
                  {abierto ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}

                  <Layers size={18} />

                  <span>
                    <strong>
                      {fila.software}
                      {" — "}
                      {fila.version}
                    </strong>

                    <small>
                      Licencia gratuita
                      {" · "}
                      {totalRegistros}
                      {" registro(s)"}
                    </small>
                  </span>
                </span>

                <span className="licencias-grupo-resumen">
                  {totalEnUso} registro(s) en uso
                </span>
              </button>
            </td>
          </tr>

          {abierto &&
            fila.licencias.map((licencia) =>
              renderizarLicencia(licencia, true)
            )}
        </Fragment>
      );
    })
  )}
</tbody>

          </table>
        </div>

        <p className="licencias-total">
          {licenciasFiltradas.length}
          {" registro(s) de licencia"}
          {busqueda && " encontrados"}
          {" · "}
          {filasVisuales.length}
          {" fila(s) principales"}
        </p>
      </div>

      <LicenciaDetalleModal
        idLicencia={idLicenciaDetalle}
        onCerrar={() =>
          setIdLicenciaDetalle(null)
        }
      />

      <LicenciaFormModal
        mostrar={mostrarModalRegistro}
        onCerrar={() =>
          setMostrarModalRegistro(false)
        }
        onGuardado={async () => {
          setMostrarModalRegistro(false);
          await cargarLicencias(estado);
        }}
      />

      <LicenciaEditarModal
        idLicencia={idLicenciaEditar}
        onCerrar={() =>
          setIdLicenciaEditar(null)
        }
        onGuardado={async () => {
          setIdLicenciaEditar(null);
          await cargarLicencias(estado);
        }}
      />
    </div>
  );
}
