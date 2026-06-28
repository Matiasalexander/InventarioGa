import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/InventarioPage.css";

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

      const response = await fetch("http://localhost:3001/api/dashboard");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error cargando dashboard");
      }

      setDashboard(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resumen = dashboard.resumen || {};

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Inventario Grupo Anderson's</h1>
          <p>Resumen general del inventario y responsivas.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total equipos</span>
          <strong>{resumen.TotalEquipos || 0}</strong>
        </div>

        <div className="stat-card">
          <span>Disponibles</span>
          <strong>{resumen.EquiposDisponibles || 0}</strong>
        </div>

        <div className="stat-card">
          <span>Asignados</span>
          <strong>{resumen.EquiposAsignados || 0}</strong>
        </div>

        <div className="stat-card">
          <span>Dañados</span>
          <strong>{resumen.EquiposDanados || 0}</strong>
        </div>

        <div className="stat-card">
          <span>Garantías por vencer</span>
          <strong>{resumen.GarantiasPorVencer || 0}</strong>
        </div>

        <div className="stat-card">
          <span>Garantías vencidas</span>
          <strong>{resumen.GarantiasVencidas || 0}</strong>
        </div>
      </div>

      <div className="detalle-grid">
        <div className="card">
          <h2>Equipos por tipo</h2>

          <div className="table-container">
            <table>
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

        <div className="card">
          <h2>Equipos por restaurante</h2>

          <div className="table-container">
            <table>
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

        <div className="card">
          <h2>Equipos por estatus</h2>

          <div className="table-container">
            <table>
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
  );
}

export default DashboardPage;