import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function InventarioDetallePage() {
    const { id } = useParams();
    const [equipo, setEquipo] = useState(null);
    useEffect(() => {
        fetch(`http://localhost:3001/api/inventario/${id}`)
            .then((res) => res.json())
            .then((data) => setEquipo(data))
            .catch((error) => console.error('Error al obtener el equipo:', error));
    }, [id]);

    if (!equipo) {
        return <p>Cargando</p>
    }

    return (
        <div>
            <p><strong>Nombre del equipo: </strong>{equipo.NOMBRE_EQUIPO}</p>
            <p><strong>Localidad: </strong>{equipo.LOCALIDAD}</p>
            <p><strong>Ubicacion: </strong>{equipo.UBICACION}</p>
            <p><strong>Departamento: </strong>{equipo.ID_DEPARTAMENTO}</p>
            <p><strong>Serial: </strong>{equipo.SERIAL}</p>
            <p><strong>Fecha de fabricación: </strong>{equipo.FECHA_FABRICACION}</p>
            <p><strong>Fecha de garantía: </strong>{equipo.FECHA_GARANTIA}</p>
            <p><strong>Disco duro: </strong>{equipo.DISCO_DURO}</p>
            <p><strong>Memoria RAM: </strong>{equipo.RAM}</p>
            <p><strong>Procesador: </strong>{equipo.ID_PROCESADOR}</p>
            <p><strong>Modelo de procesador: </strong>{equipo.MODELO_PROCESADOR}</p>
            <p><strong>Sistema operativo: </strong>{equipo.SISTEMA_OPERATIVO}</p>
            
        </div>);
}