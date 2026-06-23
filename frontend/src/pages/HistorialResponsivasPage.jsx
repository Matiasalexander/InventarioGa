import { useEffect, useState } from "react";
import { toast } from "react-toastify";

function HistorialResponsivasPage({ setLoading }) {

  const [responsivas, setResponsivas] = useState([]);
  const [detalle, setDetalle] = useState([]);

  useEffect(() => {
    cargarResponsivas();
  }, []);

  const cargarResponsivas = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3001/api/responsiva"
      );

      const data = await response.json();

      setResponsivas(data);

    } catch (error) {
      toast.error("Error cargando responsivas.");
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (id) => {
    try {

      const response = await fetch(
        `http://localhost:3001/api/responsiva/${id}`
      );

      const data = await response.json();

      setDetalle(data.detalle || []);

    } catch (error) {
      toast.error("Error obteniendo detalle.");
    }
  };

  const devolverEquipo = async (idDetalle) => {
    try {

      const response = await fetch(
        `http://localhost:3001/api/responsiva/detalle/${idDetalle}/devolver`,
        {
          method: "PUT"
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      toast.success("Equipo devuelto.");

      cargarResponsivas();

    } catch (error) {
      toast.error("Error devolviendo equipo.");
    }
  };

  return (
    <div>

      <h2>Historial de Responsivas</h2>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Receptor</th>
            <th>Fecha</th>
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {responsivas.map((item) => (
            <tr key={item.Id}>
              <td>{item.Id}</td>
              <td>{item.NombreReceptor}</td>
              <td>
                {new Date(item.Fecha).toLocaleDateString()}
              </td>
              <td>
                <button
                  className="btn-primary"
                  onClick={() => verDetalle(item.Id)}
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detalle.length > 0 && (
        <>
          <h3 style={{ marginTop: "30px" }}>
            Equipos de la Responsiva
          </h3>

          <table className="table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Serie</th>
                <th>Devuelto</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {detalle.map((item) => (
                <tr key={item.Id}>
                  <td>{item.Descripcion}</td>
                  <td>{item.Marca}</td>
                  <td>{item.Modelo}</td>
                  <td>{item.NoSerie}</td>

                  <td>
                    {item.Devuelto ? "Sí" : "No"}
                  </td>

                  <td>
                    {!item.Devuelto && (
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          devolverEquipo(item.Id)
                        }
                      >
                        Devolver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </>
      )}

    </div>
  );
}

export default HistorialResponsivasPage;