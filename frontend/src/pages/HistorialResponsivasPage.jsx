import { useEffect, useState } from "react";
import { toast } from "react-toastify";

function HistorialResponsivasPage({ setLoading }) {
  const [responsivas, setResponsivas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [responsivaSeleccionada, setResponsivaSeleccionada] = useState(null);

  useEffect(() => {
    cargarResponsivas();
  }, []);

  const cargarResponsivas = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/api/responsiva");
      const data = await response.json();

      setResponsivas(data);
    } catch (error) {
      toast.error("Error cargando responsivas.");
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (idResponsiva) => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:3001/api/responsiva/${idResponsiva}`
      );

      const data = await response.json();

      setResponsivaSeleccionada(data.responsiva);
      setDetalle(data.equipos || []);
    } catch (error) {
      toast.error("Error obteniendo detalle.");
    } finally {
      setLoading(false);
    }
  };

  const devolverEquipo = async (idDetalle) => {
    try {
      const comentarios = window.prompt(
        "Comentarios de devolución:",
        "Equipo devuelto correctamente"
      );

      const response = await fetch(
        `http://localhost:3001/api/responsiva/detalle/${idDetalle}/devolver`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ComentariosDevolucion: comentarios || null
          })
        }
      );

      if (!response.ok) {
        throw new Error("Error devolviendo equipo.");
      }

      toast.success("Equipo marcado como devuelto.");

      if (responsivaSeleccionada) {
        verDetalle(responsivaSeleccionada.IdResponsiva);
      }

      cargarResponsivas();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <h2>Historial de Responsivas</h2>

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
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {responsivas.length === 0 ? (
              <tr>
                <td colSpan="7">No hay responsivas registradas.</td>
              </tr>
            ) : (
              responsivas.map((item) => (
                <tr key={item.IdResponsiva}>
                  <td>RESP-{String(item.IdResponsiva).padStart(5, "0")}</td>
                  <td>{new Date(item.Fecha).toLocaleDateString()}</td>
                  <td>{item.NombreReceptor}</td>
                  <td>{item.Puesto}</td>
                  <td>{item.Area}</td>
                  <td>{item.Estado}</td>
                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => verDetalle(item.IdResponsiva)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {responsivaSeleccionada && (
        <>
          <h3 style={{ marginTop: "30px" }}>
            Detalle de {responsivaSeleccionada.NombreReceptor}
          </h3>

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
                {detalle.map((item) => (
                  <tr key={item.IdDetalle}>
                    <td>{item.Descripcion}</td>
                    <td>{item.Marca}</td>
                    <td>{item.Modelo}</td>
                    <td>{item.NoSerie}</td>
                    <td>{item.Devuelto ? "Sí" : "No"}</td>
                    <td>
                      {item.FechaDevolucion
                        ? new Date(item.FechaDevolucion).toLocaleString()
                        : ""}
                    </td>
                    <td>{item.ComentariosDevolucion || ""}</td>
                    <td>
                      {!item.Devuelto ? (
                        <button
                          className="btn-secondary"
                          onClick={() => devolverEquipo(item.IdDetalle)}
                        >
                          Devolver
                        </button>
                      ) : (
                        "Devuelto"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default HistorialResponsivasPage;