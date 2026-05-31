import { useEffect, useState } from "react";
import {
  obtenerInventario,
  crearInventario
} from "../services/inventarioService";
import { obtenerCatalogos } from "../services/catalogosService";
import "./InventarioPage.css";

function InventarioPage() {
  const [inventario, setInventario] = useState([]);

  const [catalogos, setCatalogos] = useState({
    unidades: [],
    tiposEquipo: [],
    marcas: [],
    modelos: [],
    estatus: [],
    departamentos: []
  });

  const [formulario, setFormulario] = useState({
    UNIDAD: "",
    LOCALIDAD: "",
    UBICACION: "",
    TIPO_EQUIPO: "",
    NOMBRE_EQUIPO: "",
    SERIAL: "",
    MARCA: "",
    MODELO: "",
    IP: "",
    ESTATUS: "",
    ESTADO_FISICO: "",
    CORREO: ""
  });

  const cargarInventario = async () => {
    try {
      const data = await obtenerInventario();
      setInventario(data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const data = await obtenerCatalogos();
      setCatalogos(data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  useEffect(() => {
    cargarInventario();
    cargarCatalogos();
  }, []);

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const guardarEquipo = async (e) => {
    e.preventDefault();

    try {
      await crearInventario(formulario);

      setFormulario({
        UNIDAD: "",
        LOCALIDAD: "",
        UBICACION: "",
        TIPO_EQUIPO: "",
        NOMBRE_EQUIPO: "",
        SERIAL: "",
        MARCA: "",
        MODELO: "",
        IP: "",
        ESTATUS: "",
        ESTADO_FISICO: "",
        CORREO: ""
      });

      await cargarInventario();
      alert("Equipo agregado correctamente");
    //} catch (error) {
     // console.error("Error guardando equipo:", error);
     // alert("Error guardando equipo");
   // }
   } catch (error) {
  console.error("Error guardando equipo:", error.response?.data || error);
  alert(error.response?.data?.error || "Error guardando equipo");
}
  };

  return (
    <div className="contenedor">
      <div className="header">
        <h1>Inventario GA2</h1>
        <p>Administración de equipos, unidades, marcas y estatus.</p>
      </div>

      <div className="card">
        <h2>Agregar equipo</h2>

        <form onSubmit={guardarEquipo} className="form-grid">
          <select name="UNIDAD" value={formulario.UNIDAD} onChange={manejarCambio}>
            <option value="">Selecciona unidad</option>
            {catalogos.unidades.map((item) => (
              <option key={item.id} value={item.Ubicacion}>
                {item.Ubicacion}
              </option>
            ))}
          </select>

          <input
            name="LOCALIDAD"
            placeholder="Localidad"
            value={formulario.LOCALIDAD}
            onChange={manejarCambio}
          />

          <input
            name="UBICACION"
            placeholder="Ubicación"
            value={formulario.UBICACION}
            onChange={manejarCambio}
          />

          <select
            name="TIPO_EQUIPO"
            value={formulario.TIPO_EQUIPO}
            onChange={manejarCambio}
          >
            <option value="">Selecciona tipo de equipo</option>
            {catalogos.tiposEquipo.map((item) => (
              <option key={item.id} value={item.tequipo}>
                {item.tequipo}
              </option>
            ))}
          </select>

          <input
            name="NOMBRE_EQUIPO"
            placeholder="Nombre equipo"
            value={formulario.NOMBRE_EQUIPO}
            onChange={manejarCambio}
          />

          <input
            name="SERIAL"
            placeholder="Serial"
            value={formulario.SERIAL}
            onChange={manejarCambio}
          />

          <select name="MARCA" value={formulario.MARCA} onChange={manejarCambio}>
            <option value="">Selecciona marca</option>
            {catalogos.marcas.map((item) => (
              <option key={item.id} value={item.Marca}>
                {item.Marca}
              </option>
            ))}
          </select>

          <select name="MODELO" value={formulario.MODELO} onChange={manejarCambio}>
            <option value="">Selecciona modelo</option>
            {catalogos.modelos.map((item) => (
              <option key={item.id} value={item.Modelos}>
                {item.Modelos}
              </option>
            ))}
          </select>

          <input
            name="IP"
            placeholder="IP"
            value={formulario.IP}
            onChange={manejarCambio}
          />

          <select name="ESTATUS" value={formulario.ESTATUS} onChange={manejarCambio}>
            <option value="">Selecciona estatus</option>
            {catalogos.estatus.map((item) => (
              <option key={item.Id} value={item.Estatus_equipo}>
                {item.Estatus_equipo}
              </option>
            ))}
          </select>

          <input
            name="ESTADO_FISICO"
            placeholder="Estado físico"
            value={formulario.ESTADO_FISICO}
            onChange={manejarCambio}
          />

          <input
            name="CORREO"
            placeholder="Correo"
            value={formulario.CORREO}
            onChange={manejarCambio}
          />

          <button type="submit">Guardar equipo</button>
        </form>
      </div>

      <div className="card">
        <h2>Listado de equipos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Unidad</th>
                <th>Tipo equipo</th>
                <th>Nombre equipo</th>
                <th>Serial</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>IP</th>
                <th>Estatus</th>
              </tr>
            </thead>

            <tbody>
              {inventario.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.UNIDAD}</td>
                  <td>{item.TIPO_EQUIPO}</td>
                  <td>{item.NOMBRE_EQUIPO}</td>
                  <td>{item.SERIAL}</td>
                  <td>{item.MARCA}</td>
                  <td>{item.MODELO}</td>
                  <td>{item.IP}</td>
                  <td>{item.ESTATUS}</td>
                </tr>
              ))}

              {inventario.length === 0 && (
                <tr>
                  <td colSpan="9">No hay equipos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventarioPage;