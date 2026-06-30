import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  obtenerResponsivas,
  obtenerResponsivaPorId,
  marcarEquipoDevuelto,
  descargarResponsivaPDF
} from "../services/responsivaService";

function HistorialResponsivasPage({ setLoading }) {
  const navigate = useNavigate();

  const [responsivas, setResponsivas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [responsivaSeleccionada, setResponsivaSeleccionada] = useState(null);

  useEffect(() => {
    cargarResponsivas();
  }, []);

  const cargarResponsivas = async () => {
    try {
      setLoading(true);
      const data = await obtenerResponsivas();
      setResponsivas(data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error cargando responsivas."
      );
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (idResponsiva) => {
    try {
      setLoading(true);
      const data = await obtenerResponsivaPorId(idResponsiva);

      setResponsivaSeleccionada(data.responsiva);
      setDetalle(data.equipos || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error obteniendo detalle."
      );
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (idResponsiva, folio) => {
    try {
      setLoading(true);
      await descargarResponsivaPDF(idResponsiva, folio);
      toast.success("Responsiva descargada correctamente.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error descargando responsiva."
      );
    } finally {
      setLoading(false);
    }
  };

  const devolverEquipo = async (idDetalle) => {
    try {
      setLoading(true);

      await marcarEquipoDevuelto(
        idDetalle,
        "Equipo devuelto correctamente"
      );

      toast.success("Equipo marcado como devuelto.");

      if (responsivaSeleccionada) {
        await verDetalle(responsivaSeleccionada.IdResponsiva);
      }

      await cargarResponsivas();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error devolviendo equipo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="header">
        <h2>Historial de Responsivas</h2>

        <button type="button" onClick={() => navigate("/responsiva")}>
          Crear Responsiva
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Receptor</th>
              <th>Puesto</th>
              <th>Área</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {responsivas.length === 0 ? (
              <tr>
                <td colSpan="7">No hay responsivas registradas.</td>
              </tr>
            ) : (
              responsivas.map((item) => {
                const folio =
                  item.Folio ||
                  `RESP-${String(item.IdResponsiva).padStart(5, "0")}`;

                return (
                  <tr key={item.IdResponsiva}>
                    <td>{folio}</td>
                    <td>
                      {item.Fecha
                        ? new Date(item.Fecha).toLocaleDateString("es-MX")
                        : ""}
                    </td>
                    <td>{item.NombreReceptor}</td>
                    <td>{item.Puesto}</td>
                    <td>{item.Area}</td>
                    <td>{item.Estado}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center"
                        }}
                      >
                        <button
                          className="btn-primary"
                          type="button"
                          onClick={() => verDetalle(item.IdResponsiva)}
                        >
                          Ver detalle
                        </button>

                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() =>
                            descargarPDF(item.IdResponsiva, folio)
                          }
                        >
                          Descargar PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {responsivaSeleccionada && (
        <>
          <h3 style={{ marginTop: "30px" }}>
            Detalle de{" "}
            {responsivaSeleccionada.Folio ||
              `RESP-${String(responsivaSeleccionada.IdResponsiva).padStart(
                5,
                "0"
              )}`}{" "}
            - {responsivaSeleccionada.NombreReceptor}
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <button
              className="btn-secondary"
              type="button"
              onClick={() =>
                descargarPDF(
                  responsivaSeleccionada.IdResponsiva,
                  responsivaSeleccionada.Folio ||
                    `RESP-${String(
                      responsivaSeleccionada.IdResponsiva
                    ).padStart(5, "0")}`
                )
              }
            >
              Descargar PDF
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Serie</th>
                  <th>Devuelto</th>
                  <th>Fecha devolución</th>
                  <th>Comentarios</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {detalle.length === 0 ? (
                  <tr>
                    <td colSpan="8">Sin equipos registrados.</td>
                  </tr>
                ) : (
                  detalle.map((item) => (
                    <tr key={item.IdDetalle}>
                      <td>{item.Descripcion}</td>
                      <td>{item.Marca}</td>
                      <td>{item.Modelo}</td>
                      <td>{item.NoSerie}</td>
                      <td>{item.Devuelto ? "Sí" : "No"}</td>
                      <td>
                        {item.FechaDevolucion
                          ? new Date(item.FechaDevolucion).toLocaleString(
                              "es-MX"
                            )
                          : ""}
                      </td>
                      <td>{item.ComentariosDevolucion || ""}</td>
                      <td>
                        {!item.Devuelto ? (
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => devolverEquipo(item.IdDetalle)}
                          >
                            Devolver
                          </button>
                        ) : (
                          "Devuelto"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default HistorialResponsivasPage;