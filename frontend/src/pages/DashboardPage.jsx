import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/DashboardPage.css";
import { obtenerDashboard } from "../services/dashboardService";
import { Laptop, Utensils, ClipboardCheck } from "lucide-react";
import logo from "../img/gandersons-logo.png";


function DashboardPage({ setLoading }) {
  const [dashboard, setDashboard] = useState({
    resumen: {},
    porTipo: [],
    porRestaurante: [],
    porEstatus: []
  });

  useEffect(() => {
    cargarDashboard();
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

  const resumen = dashboard.resumen || {};

  return (
    <div className="dashboard-page">

      {/* ENCABEZADO */}
      <div className="dashboard-header">
    
        <div className="dashboard-header-title">
          <h1>Inventario Grupo Anderson's</h1>
          <p>Resumen general del inventario y responsivas.</p>
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="dashboard-stats-grid">

        <div className="dashboard-stat-card dashboard-stat-total">
          <span>Total equipos</span>
          <strong>{resumen.TotalEquipos || 0}</strong>
        </div>

        <div className="dashboard-stat-card dashboard-stat-disponibles">
          <span>Disponibles</span>
          <strong>{resumen.EquiposDisponibles || 0}</strong>
        </div>

        <div className="dashboard-stat-card dashboard-stat-asignados">
          <span>Asignados</span>
          <strong>{resumen.EquiposAsignados || 0}</strong>
        </div>

        <div className="dashboard-stat-card dashboard-stat-danados">
          <span>Dañados</span>
          <strong>{resumen.EquiposDanados || 0}</strong>
        </div>

        <div className="dashboard-stat-card dashboard-stat-garantias">
          <span>Garantías por vencer</span>
          <strong>{resumen.GarantiasPorVencer || 0}</strong>
        </div>

        <div className="dashboard-stat-card dashboard-stat-vencidas">
          <span>Garantías vencidas</span>
          <strong>{resumen.GarantiasVencidas || 0}</strong>
        </div>

      </div>

      {/* DETALLES */}
      <div className="dashboard-details-grid">

        {/* EQUIPOS POR TIPO */}
        <div className="dashboard-card dashboard-card-tipo">
          <h2>
            <Laptop size={20} strokeWidth={2.2} />
            <span>Equipos por tipo</span>
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
                {dashboard.porTipo.map((item, index) => (
                  <tr key={index}>
                    <td>{item.TipoEquipo || "Sin tipo"}</td>
                    <td>{item.Total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* EQUIPOS POR RESTAURANTE */}
        <div className="dashboard-card dashboard-card-restaurante">
          <h2>
            <Utensils size={20} strokeWidth={2.2} />
            <span>Equipos por restaurante</span>
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
                {dashboard.porRestaurante.map((item, index) => (
                  <tr key={index}>
                    <td>{item.Restaurante || "Sin restaurante"}</td>
                    <td>{item.Total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* EQUIPOS POR ESTATUS */}
        <div className="dashboard-card dashboard-card-estatus">
          <h2>
            <ClipboardCheck size={20} strokeWidth={2.2} />
            <span>Equipos por estatus</span>
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
                {dashboard.porEstatus.map((item, index) => (
                  <tr key={index}>
                    <td>{item.Estatus || "Sin estatus"}</td>
                    <td>{item.Total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;