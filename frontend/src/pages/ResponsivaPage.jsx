import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

function Responsiva() {

    const sigCanvas = useRef();

    const [nombre, setNombre] = useState("");

    const generarPDF = async () => {
debugger
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
    };

    return (
        <div style={{ padding: "20px" }}>

            <h2>Responsiva</h2>

            <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) =>
                    setNombre(e.target.value)
                }
            />

            <br />
            <br />

            <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                    width: 500,
                    height: 200,
                    className: "firma-canvas"
                }}
            />

            <br />

            <button
                onClick={() =>
                    sigCanvas.current.clear()
                }
            >
                Limpiar Firma
            </button>

            <button
                onClick={generarPDF}
                style={{
                    marginLeft: "10px"
                }}
            >
                Generar PDF
            </button>

        </div>
    );
}

export default Responsiva;