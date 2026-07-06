import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  obtenerResponsivas,
  obtenerResponsivaPorId,
  actualizarResponsiva,
  marcarEquipoDevuelto,
  descargarResponsivaPDF,
  reenviarResponsiva
} from "../services/responsivaService";

function HistorialResponsivasPage({ setLoading }) {
  const navigate = useNavigate();

  const [responsivas, setResponsivas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [responsivaSeleccionada, setResponsivaSeleccionada] = useState(null);

  const [editando, setEditando] = useState(null);
  const [formEditar, setFormEditar] = useState({
    Fecha: "",
    NombreReceptor: "",
    Puesto: "",
    Area: "",
    Correo: ""
  });

  useEffect(() => {
    cargarResponsivas();
  }, []);

  const formatearFechaInput = (fecha) => {
    if (!fecha) return "";
    return String(fecha).split("T")[0];
  };

  const cargarResponsivas = async () => {
    try {
      setLoading(true);
      const data = await obtenerResponsivas();
      setResponsivas(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error cargando responsivas.");
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
      toast.error(error.response?.data?.message || "Error obteniendo detalle.");
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (item) => {
    setEditando(item);
    setFormEditar({
      Fecha: formatearFechaInput(item.Fecha),
      NombreReceptor: item.NombreReceptor || "",
      Puesto: item.Puesto || "",
      Area: item.Area || "",
      Correo: item.Correo || ""
    });
  };

  const cerrarEditar = () => {
    setEditando(null);
    setFormEditar({
      Fecha: "",
      NombreReceptor: "",
      Puesto: "",
      Area: "",
      Correo: ""
    });
  };

  const guardarEdicion = async () => {
    try {
      if (!formEditar.Fecha || !formEditar.NombreReceptor || !formEditar.Puesto) {
        toast.warning("Fecha, receptor y puesto son obligatorios.");
        return;
      }

      setLoading(true);

      await actualizarResponsiva(editando.IdResponsiva, formEditar);

      toast.success("Responsiva actualizada correctamente.");
      cerrarEditar();
      await cargarResponsivas();

      if (responsivaSeleccionada?.IdResponsiva === editando.IdResponsiva) {
        await verDetalle(editando.IdResponsiva);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error actualizando responsiva."
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
      toast.error(error.response?.data?.message || "Error descargando responsiva.");
    } finally {
      setLoading(false);
    }
  };

  const reenviarCorreo = async (idResponsiva) => {
    try {
      setLoading(true);
      await reenviarResponsiva(idResponsiva);
      toast.success("Responsiva reenviada por correo.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error reenviando correo."
      );
    } finally {
      setLoading(false);
    }
  };

  const devolverEquipo = async (idDetalle) => {
    try {
      setLoading(true);

      await marcarEquipoDevuelto(idDetalle, "Equipo devuelto correctamente");

      toast.success("Equipo marcado como devuelto.");

      if (responsivaSeleccionada) {
        await verDetalle(responsivaSeleccionada.IdResponsiva);
      }

      await cargarResponsivas();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error devolviendo equipo.");
    } finally {
      setLoading(false);
    }
  };

  const estados = {
    "ACTIVA":"badge badge-activa",
    "INACTIVA":"badge badge-inactiva"
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
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {responsivas.length === 0 ? (
              <tr>
                <td colSpan="8">No hay responsivas registradas.</td>
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
                    <td>{item.Correo || ""}</td>
                    <td><span className={ estados[item.Estado] || "badge badge-default"} >
                    {item.Estado || "Sin estatus"}
                </span></td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                          onClick={() => abrirEditar(item)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => descargarPDF(item.IdResponsiva, folio)}
                        >
                          PDF
                        </button>

                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => reenviarCorreo(item.IdResponsiva)}
                          disabled={!item.Correo}
                        >
                          Correo
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

      {editando && (
        <div className="card" style={{ marginTop: "25px" }}>
          <h3>Editar responsiva {editando.Folio}</h3>

          <div className="form-responsiva">
            <p>Fecha:</p>
            <input
              type="date"
              value={formEditar.Fecha}
              onChange={(e) =>
                setFormEditar({ ...formEditar, Fecha: e.target.value })
              }
            />

            <p>Nombre receptor:</p>
            <input
              type="text"
              value={formEditar.NombreReceptor}
              onChange={(e) =>
                setFormEditar({
                  ...formEditar,
                  NombreReceptor: e.target.value
                })
              }
            />

            <p>Puesto:</p>
            <input
              type="text"
              value={formEditar.Puesto}
              onChange={(e) =>
                setFormEditar({ ...formEditar, Puesto: e.target.value })
              }
            />

            <p>Área:</p>
            <input
              type="text"
              value={formEditar.Area}
              onChange={(e) =>
                setFormEditar({ ...formEditar, Area: e.target.value })
              }
            />

            <p>Correo:</p>
            <input
              type="email"
              value={formEditar.Correo}
              onChange={(e) =>
                setFormEditar({ ...formEditar, Correo: e.target.value })
              }
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <button className="btn-primary" type="button" onClick={guardarEdicion}>
              Guardar cambios
            </button>

            <button className="btn-secondary" type="button" onClick={cerrarEditar}>
              Cancelar
            </button>
          </div>
        </div>
      )}

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
                          ? new Date(item.FechaDevolucion).toLocaleString("es-MX")
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