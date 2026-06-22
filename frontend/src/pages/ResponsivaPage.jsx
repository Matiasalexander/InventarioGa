import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "react-toastify";
import logo from "../img/gandersons-logo.png";
import "../styles/Responsiva.css";

function Responsiva({ setLoading }) {
  const sigCanvas = useRef();

  const [fecha, setFecha] = useState("");
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [puesto, setPuesto] = useState("");
  const [area, setArea] = useState("");

  const [equipo, setEquipo] = useState({
    Descripcion: "",
    Marca: "",
    Modelo: "",
    NoSerie: ""
  });

  const [equipos, setEquipos] = useState([]);

  const agregarEquipo = () => {
    if (
      !equipo.Descripcion ||
      !equipo.Marca ||
      !equipo.Modelo ||
      !equipo.NoSerie
    ) {
      toast.warning("Completa todos los datos del equipo.");
      return;
    }

    setEquipos([...equipos, equipo]);

    setEquipo({
      Descripcion: "",
      Marca: "",
      Modelo: "",
      NoSerie: ""
    });
  };

  const eliminarEquipo = (index) => {
    setEquipos(equipos.filter((_, i) => i !== index));
  };

  const guardarResponsiva = async () => {
    try {
      setLoading(true);

      if (!fecha || !nombreReceptor || !puesto) {
        toast.warning("Fecha, nombre receptor y puesto son obligatorios.");
        return;
      }

      if (equipos.length === 0) {
        toast.warning("Agrega al menos un equipo.");
        return;
      }

      if (sigCanvas.current.isEmpty()) {
        toast.warning("Firma requerida.");
        return;
      }

      const firmaBase64 = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png");

      const response = await fetch("http://localhost:3001/api/responsiva", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          Fecha: fecha,
          NombreReceptor: nombreReceptor,
          Puesto: puesto,
          Area: area,
          FirmaBase64: firmaBase64,
          equipos
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar responsiva");
      }

      toast.success("Responsiva guardada correctamente.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = async () => {
    try {
      setLoading(true);

      if (!fecha || !nombreReceptor || !puesto) {
        toast.warning("Fecha, nombre receptor y puesto son obligatorios.");
        return;
      }

      if (equipos.length === 0) {
        toast.warning("Agrega al menos un equipo.");
        return;
      }

      if (sigCanvas.current.isEmpty()) {
        toast.warning("Firma requerida.");
        return;
      }

      const firma = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png");

      const response = await fetch(
        "http://localhost:3001/api/responsiva/pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fecha,
            nombreReceptor,
            puesto,
            area,
            firma,
            equipos
          })
        }
      );

      if (!response.ok) {
        throw new Error("Error al generar el PDF.");
      }

      const blob = await response.blob();
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
      toast.error(error.message || "Ocurrió un error al generar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="responsiva-grid">
      <div className="card">
        <div className="form-responsiva">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />

          <input
            type="text"
            placeholder="Nombre receptor"
            value={nombreReceptor}
            onChange={(e) => setNombreReceptor(e.target.value)}
          />

          <input
            type="text"
            placeholder="Puesto"
            value={puesto}
            onChange={(e) => setPuesto(e.target.value)}
          />

          <input
            type="text"
            placeholder="Área"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        <div className="form-responsiva">
          <input
            type="text"
            placeholder="Descripción"
            value={equipo.Descripcion}
            onChange={(e) =>
              setEquipo({
                ...equipo,
                Descripcion: e.target.value
              })
            }
          />

          <input
            type="text"
            placeholder="Marca"
            value={equipo.Marca}
            onChange={(e) =>
              setEquipo({
                ...equipo,
                Marca: e.target.value
              })
            }
          />

          <input
            type="text"
            placeholder="Modelo"
            value={equipo.Modelo}
            onChange={(e) =>
              setEquipo({
                ...equipo,
                Modelo: e.target.value
              })
            }
          />

          <input
            type="text"
            placeholder="No. Serie"
            value={equipo.NoSerie}
            onChange={(e) =>
              setEquipo({
                ...equipo,
                NoSerie: e.target.value
              })
            }
          />

          <button className="btn-primary" onClick={agregarEquipo}>
            Agregar equipo
          </button>
        </div>

        <div className="responsiva-card">
          <div className="header">
            <div></div>

            <img
              src={logo}
              alt="Logo"
              className="logo"
            />
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

          <button
            className="btn-primary"
            onClick={guardarResponsiva}
          >
            Guardar responsiva
          </button>

          <button
            className="btn-primary"
            onClick={generarPDF}
          >
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default Responsiva;