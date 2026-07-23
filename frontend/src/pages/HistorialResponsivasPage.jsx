import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";

import {
  obtenerResponsivas,
  obtenerResponsivaPorId,
  actualizarResponsiva,
  marcarEquipoDevuelto,
  descargarResponsivaPDF,
  reenviarResponsiva
} from "../services/responsivaService";

import ResponsivasAcciones from "../components/ResponsivasAcciones";

function HistorialResponsivasPage({ setLoading }) {
  const navigate = useNavigate();
  const { tienePermiso } = useAuth();

  const puedeCrear = tienePermiso("responsivas.crear");
  const puedeEditar = tienePermiso("responsivas.editar");
  const puedeDevolver = tienePermiso("responsivas.devolver");

  const [responsivas, setResponsivas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [responsivaSeleccionada, setResponsivaSeleccionada] =
    useState(null);

  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

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

  const responsivasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return responsivas;
    }

    return responsivas.filter((item) => {
      const folio = (
        item.Folio ||
        `RESP-${String(item.IdResponsiva).padStart(5, "0")}`
      ).toLowerCase();

      const receptor = String(
        item.NombreReceptor || ""
      ).toLowerCase();

      const area = String(item.Area || "").toLowerCase();
      const correo = String(item.Correo || "").toLowerCase();
      const puesto = String(item.Puesto || "").toLowerCase();

      return (
        folio.includes(texto) ||
        receptor.includes(texto) ||
        area.includes(texto) ||
        correo.includes(texto) ||
        puesto.includes(texto)
      );
    });
  }, [busqueda, responsivas]);

  const formatearFechaInput = (fecha) => {
    if (!fecha) return "";

    return String(fecha).split("T")[0];
  };

  const cargarResponsivas = async () => {
    try {
      setLoading(true);

      const data = await obtenerResponsivas();

      setResponsivas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Error cargando responsivas:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
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
      console.error(
        "Error obteniendo detalle:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error obteniendo detalle."
      );
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar responsivas."
      );
      return;
    }

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
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar responsivas."
      );
      return;
    }

    if (!editando?.IdResponsiva) {
      toast.error("No se encontró la responsiva a editar.");
      return;
    }

    if (
      !formEditar.Fecha ||
      !formEditar.NombreReceptor.trim() ||
      !formEditar.Puesto.trim()
    ) {
      toast.warning(
        "Fecha, receptor y puesto son obligatorios."
      );
      return;
    }

    if (
      formEditar.Correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formEditar.Correo
      )
    ) {
      toast.warning("Ingresa un correo válido.");
      return;
    }

    const idResponsiva = editando.IdResponsiva;

    try {
      setLoading(true);

      await actualizarResponsiva(
        idResponsiva,
        formEditar
      );

      toast.success(
        "Responsiva actualizada correctamente."
      );

      cerrarEditar();

      await cargarResponsivas();

      if (
        responsivaSeleccionada?.IdResponsiva ===
        idResponsiva
      ) {
        await verDetalle(idResponsiva);
      }
    } catch (error) {
      console.error(
        "Error actualizando responsiva:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error actualizando responsiva."
      );
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (
    idResponsiva,
    folio
  ) => {
    try {
      setLoading(true);

      await descargarResponsivaPDF(
        idResponsiva,
        folio
      );

      toast.success(
        "Responsiva descargada correctamente."
      );
    } catch (error) {
      console.error(
        "Error descargando responsiva:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error descargando responsiva."
      );
    } finally {
      setLoading(false);
    }
  };

  const reenviarCorreo = async (idResponsiva) => {
    try {
      setLoading(true);

      await reenviarResponsiva(idResponsiva);

      toast.success(
        "Responsiva reenviada por correo."
      );
    } catch (error) {
      console.error(
        "Error reenviando correo:",
        error.response?.data || error
      );

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
    if (!puedeDevolver) {
      toast.warning(
        "No tienes permiso para devolver equipos."
      );
      return;
    }

    const confirmar = window.confirm(
      "¿Deseas marcar este equipo como devuelto?"
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      await marcarEquipoDevuelto(
        idDetalle,
        "Equipo devuelto correctamente"
      );

      toast.success(
        "Equipo marcado como devuelto."
      );

      if (responsivaSeleccionada) {
        await verDetalle(
          responsivaSeleccionada.IdResponsiva
        );
      }

      await cargarResponsivas();
    } catch (error) {
      console.error(
        "Error devolviendo equipo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error devolviendo equipo."
      );
    } finally {
      setLoading(false);
    }
  };

  const estados = {
    ACTIVA: "badge badge-activa",
    INACTIVA: "badge badge-inactiva"
  };

  return (
    <div className="card">
      <div className="header">
        <div>
          <h2>Historial de Responsivas</h2>
          <p>
            Consulta, edita y administra las
            responsivas registradas.
          </p>
        </div>

        {puedeCrear && (
          <button
            type="button"
            onClick={() =>
              navigate("/responsiva")
            }
          >
            Crear Responsiva
          </button>
        )}
      </div>

      <div
        style={{
          marginBottom: "16px"
        }}
      >
        <input
          className="search-input"
          placeholder="Buscar por folio, receptor, puesto, área o correo..."
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
        />
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
            {responsivasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="8">
                  {responsivas.length === 0
                    ? "No hay responsivas registradas."
                    : "No se encontraron responsivas con esa búsqueda."}
                </td>
              </tr>
            ) : (
              responsivasFiltradas.map((item) => {
                const folio =
                  item.Folio ||
                  `RESP-${String(
                    item.IdResponsiva
                  ).padStart(5, "0")}`;

                return (
                  <tr key={item.IdResponsiva}>
                    <td>{folio}</td>

                    <td>
                      {item.Fecha
                        ? new Date(
                            item.Fecha
                          ).toLocaleDateString(
                            "es-MX"
                          )
                        : ""}
                    </td>

                    <td>
                      {item.NombreReceptor || ""}
                    </td>

                    <td>{item.Puesto || ""}</td>
                    <td>{item.Area || ""}</td>
                    <td>{item.Correo || ""}</td>

                    <td>
                      <span
                        className={
                          estados[item.Estado] ||
                          "badge badge-default"
                        }
                      >
                        {item.Estado ||
                          "Sin estatus"}
                      </span>
                    </td>

                    <td>
                      <ResponsivasAcciones
                        item={item}
                        onDetalle={verDetalle}
                        onEditar={abrirEditar}
                        onPDF={(id) =>
                          descargarPDF(
                            id,
                            folio
                          )
                        }
                        onCorreo={
                          reenviarCorreo
                        }
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editando && puedeEditar && (
        <div
          className="card"
          style={{
            marginTop: "25px"
          }}
        >
          <h3>
            Editar responsiva{" "}
            {editando.Folio ||
              `RESP-${String(
                editando.IdResponsiva
              ).padStart(5, "0")}`}
          </h3>

          <div className="form-responsiva">
            <p>Fecha:</p>

            <input
              type="date"
              value={formEditar.Fecha}
              onChange={(event) =>
                setFormEditar((prev) => ({
                  ...prev,
                  Fecha: event.target.value
                }))
              }
            />

            <p>Nombre receptor:</p>

            <input
              type="text"
              value={
                formEditar.NombreReceptor
              }
              onChange={(event) =>
                setFormEditar((prev) => ({
                  ...prev,
                  NombreReceptor:
                    event.target.value
                }))
              }
            />

            <p>Puesto:</p>

            <input
              type="text"
              value={formEditar.Puesto}
              onChange={(event) =>
                setFormEditar((prev) => ({
                  ...prev,
                  Puesto: event.target.value
                }))
              }
            />

            <p>Área:</p>

            <input
              type="text"
              value={formEditar.Area}
              onChange={(event) =>
                setFormEditar((prev) => ({
                  ...prev,
                  Area: event.target.value
                }))
              }
            />

            <p>Correo:</p>

            <input
              type="email"
              value={formEditar.Correo}
              onChange={(event) =>
                setFormEditar((prev) => ({
                  ...prev,
                  Correo: event.target.value
                }))
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "15px"
            }}
          >
            <button
              className="btn-primary"
              type="button"
              onClick={guardarEdicion}
            >
              Guardar cambios
            </button>

            <button
              className="btn-secondary"
              type="button"
              onClick={cerrarEditar}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {responsivaSeleccionada && (
        <>
          <h3
            style={{
              marginTop: "30px"
            }}
          >
            Detalle de{" "}
            {responsivaSeleccionada.Folio ||
              `RESP-${String(
                responsivaSeleccionada.IdResponsiva
              ).padStart(5, "0")}`}{" "}
            -{" "}
            {
              responsivaSeleccionada.NombreReceptor
            }
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
                    <td colSpan="8">
                      Sin equipos registrados.
                    </td>
                  </tr>
                ) : (
                  detalle.map((item) => (
                    <tr key={item.IdDetalle}>
                      <td>
                        {item.Descripcion}
                      </td>

                      <td>{item.Marca}</td>
                      <td>{item.Modelo}</td>
                      <td>{item.NoSerie}</td>

                      <td>
                        {item.Devuelto
                          ? "Sí"
                          : "No"}
                      </td>

                      <td>
                        {item.FechaDevolucion
                          ? new Date(
                              item.FechaDevolucion
                            ).toLocaleString(
                              "es-MX"
                            )
                          : ""}
                      </td>

                      <td>
                        {item.ComentariosDevolucion ||
                          ""}
                      </td>

                      <td>
                        {item.Devuelto ? (
                          "Devuelto"
                        ) : puedeDevolver ? (
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() =>
                              devolverEquipo(
                                item.IdDetalle
                              )
                            }
                          >
                            Devolver
                          </button>
                        ) : (
                          "Pendiente"
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