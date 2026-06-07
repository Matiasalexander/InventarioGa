import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "react-toastify";
import logo from '../img/gandersons-logo.png'
import '../styles/ResponsivaPage.css'

function Responsiva({ setLoading }) {

    const sigCanvas = useRef();

    const [nombre, setNombre] = useState("");

    const generarPDF = async () => {


        try {
            debugger
            setLoading(true);
            if (sigCanvas.current.isEmpty()) {
                alert("Firma requerida");
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
                        nombre,
                        firma
                    })
                }
            );

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = "responsiva.pdf";

            document.body.appendChild(link);

            link.click();

            link.remove();
            toast.success("Responsiva generada correctamente.");

        } catch (error) {
            toast.error("Ocurrió un error al generar el PDF.");
        } finally {
            setLoading(false);
        }


    };

    return (
        <div className="responsiva-container">

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

                    Por este medio hago contar que el equipo que se detalla a continuación se encuentra en calidad de
                    préstamo a partir del día <strong>FECHA</strong> y que está bajo resguardo de <strong>NOMBRE RECEPTOR</strong>,
                    quien se desempeña en el puesto <strong>PUESTO</strong> en Grupo Andersons. Dicho (s) equipo (s) cumplirá (n) el uso para los fines que fueron acordados y se
                    hace responsable de regresarlo en las mismas condiciones que se le fue entregado.

                </p>

                <p>

                    La descripción del (los) equipo(s) se detalla a
                    continuación:

                </p>

                <div className="table-responsive">

                    <table>

                        <thead>

                            <tr>

                                <th>Descripción</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>No. Serie</th>

                            </tr>

                        </thead>

                        <tbody>

                            <tr>

                                <td>Laptop Dell</td>
                                <td>Dell</td>
                                <td>5420</td>
                                <td>ABC123456</td>

                            </tr>

                            <tr>

                                <td>Mouse</td>
                                <td>Logitech</td>
                                <td>M280</td>
                                <td>XYZ987654</td>

                            </tr>

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

                    {/* <h3>{nombre}</h3>

            <span>{area}</span> */}
                    <h3>NOMBRE</h3>

                    <span>AREA</span>

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