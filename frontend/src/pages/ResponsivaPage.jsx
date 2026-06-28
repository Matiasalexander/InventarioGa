import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "react-toastify";
import logo from "../img/gandersons-logo.png";
import "../styles/Responsiva.css";
import { useNavigate } from "react-router-dom";
import {
  obtenerEquiposDisponibles,
  crearResponsiva,
  generarPDFResponsiva
} from "../services/responsivaService";

function Responsiva({ setLoading }) {
  const navigate = useNavigate();
  const sigCanvas = useRef();

  const [fecha, setFecha] = useState("");
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [puesto, setPuesto] = useState("");
  const [area, setArea] = useState("");

  const [equipos, setEquipos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [busquedaEquipo, setBusquedaEquipo] = useState("");

  useEffect(() => {
    cargarInventarioDisponible();
  }, []);

  const cargarInventarioDisponible = async () => {
    try {
      setLoading(true);

      const data = await obtenerEquiposDisponibles();

      setInventario(data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error cargando equipos disponibles."
      );
    } finally {
      setLoading(false);
    }
  };

  const agregarEquipoDesdeInventario = (item) => {
    const yaAgregado = equipos.some(
      (equipo) => equipo.IdInventario === item.id
    );

    if (yaAgregado) {
      toast.warning("Este equipo ya fue agregado.");
      return;
    }

    const nuevoEquipo = {
      IdInventario: item.id,
      Descripcion: item.TIPO_EQUIPO || item.NOMBRE_EQUIPO || "",
      Marca: item.MARCA || "",
      Modelo: item.MODELO || "",
      NoSerie: item.SERIAL || ""
    };

    setEquipos([...equipos, nuevoEquipo]);
    toast.success("Equipo agregado a la responsiva.");
  };

  const eliminarEquipo = (index) => {
    setEquipos(equipos.filter((_, i) => i !== index));
  };

  const validarResponsiva = () => {
    if (!fecha || !nombreReceptor || !puesto) {
      toast.warning("Fecha, nombre receptor y puesto son obligatorios.");
      return false;
    }

    if (equipos.length === 0) {
      toast.warning("Agrega al menos un equipo.");
      return false;
    }

    if (sigCanvas.current.isEmpty()) {
      toast.warning("Firma requerida.");
      return false;
    }

    return true;
  };

  const guardarResponsiva = async () => {
    try {
      setLoading(true);

      if (!validarResponsiva()) return;

      const firmaBase64 = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png");

      await crearResponsiva({
        Fecha: fecha,
        NombreReceptor: nombreReceptor,
        Puesto: puesto,
        Area: area,
        FirmaBase64: firmaBase64,
        equipos
      });

      toast.success("Responsiva guardada correctamente.");

      setFecha("");
      setNombreReceptor("");
      setPuesto("");
      setArea("");
      setEquipos([]);
      sigCanvas.current.clear();

      await cargarInventarioDisponible();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error al guardar responsiva"
      );
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = async () => {
    try {
      setLoading(true);

      if (!validarResponsiva()) return;

      const firma = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png");

      const blob = await generarPDFResponsiva({
        fecha,
        nombreReceptor,
        puesto,
        area,
        firma,
        equipos
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "responsiva.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Responsiva generada correctamente.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al generar el PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  const inventarioFiltrado = inventario.filter((item) => {
    const texto = `
      ${item.TIPO_EQUIPO || ""}
      ${item.NOMBRE_EQUIPO || ""}
      ${item.MARCA || ""}
      ${item.MODELO || ""}
      ${item.SERIAL || ""}
      ${item.ESTATUS || ""}
    `.toLowerCase();

    return texto.includes(busquedaEquipo.toLowerCase());
  });

  return (
    <div className="contenedor">
      <div className="header">
        <h2>Nueva responsiva</h2>

        <button
          type="button"
          onClick={() => navigate("/responsivas/historial")}
        >
          Ver historial
        </button>
      </div>

      <div className="responsiva-grid">
        <div className="card-responsiva">
          <div className="form-responsiva">
            <p>Fecha:</p>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />

            <p>Nombre de receptor:</p>
            <input
              type="text"
              placeholder="Nombre receptor"
              value={nombreReceptor}
              onChange={(e) => setNombreReceptor(e.target.value)}
            />

            <p>Puesto:</p>
            <input
              type="text"
              placeholder="Puesto"
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
            />

            <p>Área:</p>
            <input
              type="text"
              placeholder="Área"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>

          <p>Buscar equipo:</p>

          <div className="form-responsiva">
            <input
              type="text"
              placeholder="Buscar equipo por serie, nombre, marca, modelo o estatus"
              value={busquedaEquipo}
              onChange={(e) => setBusquedaEquipo(e.target.value)}
            />
          </div>
        </div>

        <div className="card">
          <h3>Equipos disponibles:</h3>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Serie</th>
                  <th>Estatus</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {inventarioFiltrado.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td>{item.TIPO_EQUIPO || item.NOMBRE_EQUIPO}</td>
                    <td>{item.MARCA}</td>
                    <td>{item.MODELO}</td>
                    <td>{item.SERIAL}</td>
                    <td>{item.ESTATUS}</td>
                    <td>
                      <button
                        className="btn-primary"
                        onClick={() => agregarEquipoDesdeInventario(item)}
                      >
                        Agregar
                      </button>
                    </td>
                  </tr>
                ))}

                {inventarioFiltrado.length === 0 && (
                  <tr>
                    <td colSpan="6">No hay equipos disponibles.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="responsiva-card">
          <div className="header">
            <div></div>

            <img src={logo} alt="Logo" className="logo" />
          </div>

          <h1 className="titulo">
            CARTA RESPONSIVA DE EQUIPO DE CÓMPUTO
          </h1>

          <p>
            Por este medio hago constar que el equipo que se detalla a
            continuación se encuentra en calidad de préstamo a partir del día{" "}
            <strong>{fecha || "FECHA"}</strong> y que está bajo resguardo de{" "}
            <strong>{nombreReceptor || "NOMBRE RECEPTOR"}</strong>, quien se
            desempeña en el puesto <strong>{puesto || "PUESTO"}</strong> en
            Grupo Andersons. Dicho(s) equipo(s) cumplirá(n) el uso para los
            fines que fueron acordados y se hace responsable de regresarlo en
            las mismas condiciones que se le fue entregado.
          </p>

          <p>
            La descripción del (los) equipo(s) se detalla a continuación:
          </p>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>No. Serie</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {equipos.length === 0 ? (
                  <tr>
                    <td colSpan="5">No hay equipos agregados</td>
                  </tr>
                ) : (
                  equipos.map((item, index) => (
                    <tr key={index}>
                      <td>{item.Descripcion}</td>
                      <td>{item.Marca}</td>
                      <td>{item.Modelo}</td>
                      <td>{item.NoSerie}</td>
                      <td>
                        <button
                          className="btn-secondary"
                          onClick={() => eliminarEquipo(index)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="firma-container">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "signature-canvas"
              }}
            />
          </div>

          <div className="firma-info">
            <div className="linea"></div>

            <h3>{nombreReceptor || "NOMBRE"}</h3>

            <span>{area || "AREA"}</span>
          </div>
        </div>

        <div className="acciones">
          <button
            className="btn-secondary"
            onClick={() => sigCanvas.current.clear()}
          >
            Limpiar firma
          </button>

          <button className="btn-primary" onClick={guardarResponsiva}>
            Guardar responsiva
          </button>

          <button className="btn-primary" onClick={generarPDF}>
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default Responsiva;