import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/DashboardPage.css";
import { obtenerDashboard } from "../services/dashboardService";

import {
  Laptop,
  Utensils,
  ClipboardCheck,
  AlertTriangle,
  Package,
  CheckCircle2,
  UserRound,
  ShieldAlert,
  Clock3,
  RefreshCw,
  Wrench,
  XCircle,
  Info,
} from "lucide-react";

function DashboardPage({ setLoading }) {

  const [mostrarNotasVersion, setMostrarNotasVersion] = useState(false);
  const [noMostrarNuevamente, setNoMostrarNuevamente] = useState(false);

  //modificar esta nota de versión cuando se quiera desplegar en producto y anotar los nuevos cambios
  const VERSION_ACTUAL = "3.0.0";

  const [dashboard, setDashboard] = useState({
    resumen: {},
    porTipo: [],
    porRestaurante: [],
    porEstatus: [],
  });

  useEffect(() => {

    cargarDashboard();

    const versionVista =
      localStorage.getItem("notasVersionVistas");

    if (versionVista !== VERSION_ACTUAL) {
      setMostrarNotasVersion(true);
    }

  }, []);


  const cargarDashboard = async () => {

    try {

      setLoading(true);

      const data = await obtenerDashboard();

      setDashboard(data);

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Error cargando dashboard"
      );

    } finally {

      setLoading(false);

    }

  };

  const cerrarNotasVersion = () => {

    if (noMostrarNuevamente) {

      localStorage.setItem(
        "notasVersionVistas",
        VERSION_ACTUAL
      );

    }

    setMostrarNotasVersion(false);

  };

  const resumen = dashboard.resumen || {};

  const totalEquipos =
    Number(resumen.TotalEquipos) || 0;

  const equiposDisponibles =
    Number(resumen.EquiposDisponibles) || 0;

  const equiposAsignados =
    Number(resumen.EquiposAsignados) || 0;

  const equiposDanados =
    Number(resumen.EquiposDanados) || 0;

  const garantiasPorVencer =
    Number(resumen.GarantiasPorVencer) || 0;

  const garantiasVencidas =
    Number(resumen.GarantiasVencidas) || 0;

  const porcentajeDisponible =
    totalEquipos > 0
      ? ((equiposDisponibles / totalEquipos) * 100).toFixed(1)
      : 0;

  const porcentajeAsignado =
    totalEquipos > 0
      ? ((equiposAsignados / totalEquipos) * 100).toFixed(1)
      : 0;

  const porcentajeDanado =
    totalEquipos > 0
      ? ((equiposDanados / totalEquipos) * 100).toFixed(1)
      : 0;

  const maxTipo =
    dashboard.porTipo.length > 0
      ? Math.max(
          ...dashboard.porTipo.map(
            item => Number(item.Total) || 0
          )
        )
      : 1;

  const maxRestaurante =
    dashboard.porRestaurante.length > 0
      ? Math.max(
          ...dashboard.porRestaurante.map(
            item => Number(item.Total) || 0
          )
        )
      : 1;

  return (

    <div className="dashboard-page">

      <div className="dashboard-header">

        <div className="dashboard-header-main">

          <div className="dashboard-header-title">

            <span className="dashboard-header-label">
              PANEL GENERAL
            </span>

            <h1>
              Inventario Grupo Anderson's
            </h1>

            <p>
              Resumen general del inventario y estado de los equipos.
            </p>

          </div>


        </div>

      </div>

      <div className="dashboard-section-title">

        <div>
          <h2>Resumen del inventario</h2>

          <p>
            Estado actual de los equipos registrados.
          </p>
        </div>

      </div>


      <div className="dashboard-stats-grid">

        <div className="dashboard-stat-card dashboard-stat-total">

          <div className="dashboard-stat-icon">

            <Package size={21} />

          </div>

          <div className="dashboard-stat-content">

            <span>Total de equipos</span>

            <strong>
              {totalEquipos}
            </strong>

            <small>
              Inventario registrado
            </small>

          </div>

        </div>

        <div className="dashboard-stat-card dashboard-stat-disponibles">

          <div className="dashboard-stat-icon">

            <CheckCircle2 size={21} />

          </div>

          <div className="dashboard-stat-content">

            <span>Disponibles</span>

            <strong>
              {equiposDisponibles}
            </strong>

            <small>
              {porcentajeDisponible}% del inventario
            </small>

          </div>

        </div>

        <div className="dashboard-stat-card dashboard-stat-asignados">

          <div className="dashboard-stat-icon">

            <UserRound size={21} />

          </div>

          <div className="dashboard-stat-content">

            <span>Asignados</span>

            <strong>
              {equiposAsignados}
            </strong>

            <small>
              {porcentajeAsignado}% del inventario
            </small>

          </div>

        </div>

        <div className="dashboard-stat-card dashboard-stat-danados">

          <div className="dashboard-stat-icon">

            <Wrench size={21} />

          </div>

          <div className="dashboard-stat-content">

            <span>Dañados</span>

            <strong>
              {equiposDanados}
            </strong>

            <small>
              {porcentajeDanado}% del inventario
            </small>

          </div>

        </div>

        <div className="dashboard-stat-card dashboard-stat-garantias">

          <div className="dashboard-stat-icon">

            <Clock3 size={21} />

          </div>

          <div className="dashboard-stat-content">

            <span>Garantías por vencer</span>

            <strong>
              {garantiasPorVencer}
            </strong>

            <small>
              Requieren seguimiento
            </small>

          </div>

        </div>

        <div className="dashboard-stat-card dashboard-stat-vencidas">

          <div className="dashboard-stat-icon">

            <ShieldAlert size={21} />

          </div>

          <div className="dashboard-stat-content">

            <span>Garantías vencidas</span>

            <strong>
              {garantiasVencidas}
            </strong>

            <small>
              Requieren revisión
            </small>

          </div>

        </div>

      </div>

      <div className="dashboard-main-grid">

        <div className="dashboard-card dashboard-status-card">

          <div className="dashboard-card-header">

            <div className="dashboard-card-title">

              <div className="dashboard-card-icon">
                <ClipboardCheck size={19} />
              </div>

              <div>

                <h2>
                  Equipos por estatus
                </h2>

                <p>
                  Distribución actual del inventario
                </p>

              </div>

            </div>

          </div>


          <div className="dashboard-status-list">

            {dashboard.porEstatus.map(
              (item, index) => {

                const total =
                  Number(item.Total) || 0;

                const porcentaje =
                  totalEquipos > 0
                    ? ((total / totalEquipos) * 100)
                    : 0;

                return (

                  <div
                    className="dashboard-status-item"
                    key={index}
                  >

                    <div className="dashboard-status-info">

                      <span>
                        {item.Estatus || "Sin estatus"}
                      </span>

                      <strong>
                        {total}
                      </strong>

                    </div>


                    <div className="dashboard-progress">

                      <div
                        className="dashboard-progress-fill"
                        style={{
                          width: `${porcentaje}%`,
                        }}
                      />

                    </div>


                    <small>
                      {porcentaje.toFixed(1)}%
                    </small>

                  </div>

                );

              }
            )}

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div className="dashboard-card-title">

              <div className="dashboard-card-icon">
                <Laptop size={19} />
              </div>

              <div>

                <h2>
                  Equipos por tipo
                </h2>

                <p>
                  Distribución por categoría
                </p>

              </div>

            </div>

          </div>


          <div className="dashboard-ranking-list">

            {dashboard.porTipo.map(
              (item, index) => {

                const total =
                  Number(item.Total) || 0;

                const porcentaje =
                  (total / maxTipo) * 100;

                return (

                  <div
                    className="dashboard-ranking-item"
                    key={index}
                  >

                    <div className="dashboard-ranking-top">

                      <span>
                        {item.TipoEquipo || "Sin tipo"}
                      </span>

                      <strong>
                        {total}
                      </strong>

                    </div>


                    <div className="dashboard-ranking-bar">

                      <div
                        style={{
                          width: `${porcentaje}%`,
                        }}
                      />

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>


      </div>

      <div className="dashboard-card dashboard-restaurantes-card">

        <div className="dashboard-card-header">

          <div className="dashboard-card-title">

            <div className="dashboard-card-icon">
              <Utensils size={19} />
            </div>

            <div>

              <h2>
                Equipos por restaurante
              </h2>

              <p>
                Distribución del inventario por ubicación
              </p>

            </div>

          </div>

        </div>


        <div className="dashboard-restaurantes-grid">

          {dashboard.porRestaurante.map(
            (item, index) => {

              const total =
                Number(item.Total) || 0;

              const porcentaje =
                (total / maxRestaurante) * 100;

              return (

                <div
                  className="dashboard-restaurante-item"
                  key={index}
                >

                  <div className="dashboard-restaurante-info">

                    <span>
                      {item.Restaurante ||
                        "Sin restaurante"}
                    </span>

                    <strong>
                      {total}
                    </strong>

                  </div>


                  <div className="dashboard-ranking-bar">

                    <div
                      style={{
                        width: `${porcentaje}%`,
                      }}
                    />

                  </div>

                </div>

              );

            }
          )}

        </div>

      </div>


      {/*NOTAS DE VERSION */}

      {mostrarNotasVersion && (

        <div className="version-overlay">

          <div className="version-modal">


            <div className="version-header">

              <div>

                <span className="version-label">
                  Actualización
                </span>

                <h2>
                  Notas de versión
                </h2>

                <p>
                  Versión {VERSION_ACTUAL}
                </p>

              </div>


              <button
                type="button"
                className="version-close"
                onClick={cerrarNotasVersion}
              >
                ×
              </button>

            </div>


            <div className="version-body">


              <div className="version-item">

                <span className="version-item-icon">
                  <Wrench
                    size={20}
                  />
                </span>

                <div>

                  <h3>
                    Mejoras
                  </h3>

                  <p>
                    Se realizaron mejoras en el apartado de
                    responsivas, diseño y lógica por fecha de
                    fabricación.
                  </p>

                </div>

              </div>


              <div className="version-item">

                <span className="version-item-icon">
                  <Info
                    size={20}
                  />
                </span>

                <div>

                  <h3>
                    Mejoras de diseño
                  </h3>

                  <p>
                    Se realizaron mejoras en el diseño del
                    sistema, dashboard, roles, catálogos y
                    usuarios.
                  </p>

                </div>

              </div>


              <div className="version-item">

                <span className="version-item-icon">
                  <ClipboardCheck
                    size={20}
                  />
                </span>

                <div>

                  <h3>
                    Correcciones
                  </h3>

                  <p>
                    Se corrigieron errores detectados en
                    versiones anteriores del sistema.
                  </p>

                </div>

              </div>


            </div>


            <div className="version-footer">

              <label className="version-checkbox">

                <input
                  type="checkbox"
                  checked={noMostrarNuevamente}
                  onChange={(e) =>
                    setNoMostrarNuevamente(
                      e.target.checked
                    )
                  }
                />

                <span>
                  No volver a mostrar
                </span>

              </label>


              <button
                type="button"
                className="btn-version"
                onClick={cerrarNotasVersion}
              >
                Entendido
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default DashboardPage;