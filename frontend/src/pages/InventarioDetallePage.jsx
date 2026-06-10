import { useEffect, useState } from "react";
import { data, useParams } from "react-router-dom";

export default function InventarioDetallePage() {
    const { id } = useParams();
    const [equipo, setEquipo] = useState(null);
    const [departamentos, setDepartamentos] = useState([]);
    const [procesadores, setProcesadores] = useState([]);

    useEffect(() => {
        //obtener catalogo de equipos
        fetch(`http://localhost:3001/api/inventario/${id}`)
            .then((res) => res.json())
            .then((data) => setEquipo(data))
            .catch((error) => console.error('Error al obtener el equipo:', error));

            //obtener catalogo de departamentos
           fetch("http://localhost:3001/api/catalogos")
            .then((res) => res.json())
            .then((data) => {
            setDepartamentos(data.departamentos);
            setProcesadores(data.procesadores);
            })
    .catch((error) =>
        console.error("Error al obtener catálogos:", error)
    );
    }, [id]);

    if (!equipo) {
        return <p>Cargando</p>
    }

        const departamento = departamentos.find(
        (item) => item.Id == equipo.ID_DEPARTAMENTO
        );
        const procesador = procesadores.find(
        (item)=> item.id == equipo.ID_PROCESADOR
        );

    return (
        <div>
            <p><strong>Nombre del equipo: </strong>{equipo.NOMBRE_EQUIPO}</p>
            <p><strong>Localidad: </strong>{equipo.LOCALIDAD}</p>
            <p><strong>Ubicacion: </strong>{equipo.UBICACION}</p>
            <p><strong>Departamento: </strong> {departamento?.Nombre_departamento}</p>
            <p><strong>Serial: </strong>{equipo.SERIAL}</p>
            <p><strong>Fecha de fabricación: </strong>{equipo.FECHA_FABRICACION}</p>
            <p><strong>Fecha de garantía: </strong>{equipo.FECHA_GARANTIA}</p>
            <p><strong>Disco duro: </strong>{equipo.DISCO_DURO}</p>
            <p><strong>Memoria RAM: </strong>{equipo.RAM}</p>
            <p><strong>Procesador: </strong>{procesador?.Nombre}</p>
            <p><strong>Modelo de procesador: </strong>{equipo.MODELO_PROCESADOR}</p>
            <p><strong>Sistema operativo: </strong>{equipo.SISTEMA_OPERATIVO}</p>

        </div>);
}