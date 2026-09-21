import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/DashboardPage.css";
import { obtenerDashboard } from "../services/dashboardService";
import { Laptop, Utensils, ClipboardCheck, Star, Hammer, Palette } from "lucide-react";


function DashboardPage({ setLoading }) {
  // NOTAS DE VERSIÓN
  const [mostrarNotasVersion, setMostrarNotasVersion] = useState(false);
  const [noMostrarNuevamente, setNoMostrarNuevamente] = useState(false);

  const VERSION_ACTUAL = "3.0.0";


  // DASHBOARD
  const [dashboard, setDashboard] = useState({
    resumen: {},
    porTipo: [],
    porRestaurante: [],
    porEstatus: []
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

  // CERRAR NOTAS DE VERSIÓN
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
  
  return (

    <div className="dashboard-page">

      <div className="dashboard-header">

        <div className="dashboard-header-title">

          <h1>
            Inventario Grupo Anderson's
          </h1>

          <p>
            Resumen general del inventario y responsivas.
          </p>

        </div>

      </div>

      <div className="dashboard-stats-grid">

        <div className="dashboard-stat-card dashboard-stat-total">
          <span>Total equipos</span>
          <strong>
            {resumen.TotalEquipos || 0}
          </strong>
        </div>


        <div className="dashboard-stat-card dashboard-stat-disponibles">
          <span>Disponibles</span>
          <strong>
            {resumen.EquiposDisponibles || 0}
          </strong>
        </div>


        <div className="dashboard-stat-card dashboard-stat-asignados">
          <span>Asignados</span>
          <strong>
            {resumen.EquiposAsignados || 0}
          </strong>
        </div>


        <div className="dashboard-stat-card dashboard-stat-danados">
          <span>Dañados</span>
          <strong>
            {resumen.EquiposDanados || 0}
          </strong>
        </div>


        <div className="dashboard-stat-card dashboard-stat-garantias">
          <span>Garantías por vencer</span>
          <strong>
            {resumen.GarantiasPorVencer || 0}
          </strong>
        </div>


        <div className="dashboard-stat-card dashboard-stat-vencidas">
          <span>Garantías vencidas</span>
          <strong>
            {resumen.GarantiasVencidas || 0}
          </strong>
        </div>

      </div>

      <div className="dashboard-details-grid">


        {/* EQUIPOS POR TIPO */}

        <div className="dashboard-card dashboard-card-tipo">

          <h2>

            <Laptop
              size={20}
              strokeWidth={2.2}
            />

            <span>
              Equipos por tipo
            </span>

          </h2>


          <div className="dashboard-table-container">

            <div className="tabla-scroll">

              <table className="dashboard-table">

                <thead>

                  <tr>
                    <th>Tipo</th>
                    <th>Total</th>
                  </tr>

                </thead>


                <tbody>

                  {dashboard.porTipo.map(
                    (item, index) => (

                      <tr key={index}>

                        <td>
                          {item.TipoEquipo ||
                            "Sin tipo"}
                        </td>

                        <td>
                          {item.Total}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

        <div className="dashboard-card dashboard-card-restaurante">

          <h2>

            <Utensils
              size={20}
              strokeWidth={2.2}
            />

            <span>
              Equipos por restaurante
            </span>

          </h2>


          <div className="dashboard-table-container">

            <div className="tabla-scroll">

              <table className="dashboard-table">

                <thead>

                  <tr>
                    <th>Restaurante</th>
                    <th>Total</th>
                  </tr>

                </thead>


                <tbody>

                  {dashboard.porRestaurante.map(
                    (item, index) => (

                      <tr key={index}>

                        <td>
                          {item.Restaurante ||
                            "Sin restaurante"}
                        </td>

                        <td>
                          {item.Total}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

        <div className="dashboard-card dashboard-card-estatus">

          <h2>

            <ClipboardCheck
              size={20}
              strokeWidth={2.2}
            />

            <span>
              Equipos por estatus
            </span>

          </h2>


          <div className="dashboard-table-container">

            <div className="tabla-scroll">

              <table className="dashboard-table">

                <thead>

                  <tr>
                    <th>Estatus</th>
                    <th>Total</th>
                  </tr>

                </thead>


                <tbody>

                  {dashboard.porEstatus.map(
                    (item, index) => (

                      <tr key={index}>

                        <td>
                          {item.Estatus ||
                            "Sin estatus"}
                        </td>

                        <td>
                          {item.Total}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>

      {mostrarNotasVersion && (

        <div className="version-overlay">

          <div className="version-modal">


            {/* HEADER */}

            <div className="version-header">

          

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

            <div className="version-body">

{/*
              <div className="version-item">

                <span className="version-item-icon">
                   <Star
              size={20}
              strokeWidth={2.2}
            />
                </span>

                <div>

                  <h3>
                    Nueva funcionalidad
                  </h3>

                  <p>
                    Se agregaron mejoras al módulo de responsivas, diseño y lógica
                  </p>

                </div>

              </div>
 */}

              <div className="version-item">

                <span className="version-item-icon">
                  <Hammer
              size={20}
              strokeWidth={2.2}
              color="blue"
            />
                </span>

                <div>

                  <h3>
                    Mejoras
                  </h3>

                  <p>
                    Se realizaron mejoras en el apartado de responsivas, diseño y lógica por fecha de fabricación.
                  </p>

                </div>

              </div>

              <div className="version-item">

                <span className="version-item-icon">
                  <Palette
              size={20}
              strokeWidth={2.2}
              color="red"
            />
                </span>

                <div>

                  <h3>
                    Mejoras
                  </h3>

                  <p>
                    Se realizaron mejoras en el diseño del sistema, dashboard, roles, catalogos y usuarios.
                  </p>

                </div>

              </div>


              <div className="version-item">

                <span className="version-item-icon">
                   <ClipboardCheck
              size={20}
              strokeWidth={2.2}
              color="blue"
            />
                </span>

                <div>

                  <h3>
                    Correcciones
                  </h3>

                  <p>
                    Se corrigieron errores detectados
                    en versiones anteriores del sistema.
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