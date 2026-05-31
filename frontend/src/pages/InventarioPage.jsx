import { useEffect, useState } from "react";
import { obtenerInventario, crearInventario } from "../services/inventarioService";
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
    departamentos: [],
    procesadores: [],
    modelosProcesador: []
  });
  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState([]);

  const [formulario, setFormulario] = useState({
    ID_UNIDAD: "",
    LOCALIDAD: "",
    UBICACION: "",
    ID_TIPO_EQUIPO: "",
    NOMBRE_EQUIPO: "",
    ID_DEPARTAMENTO: "",
    SERIAL: "",
    ID_PROCESADOR: "",
    ID_MARCA: "",
    MODELO: "",
    IP: "",
    ID_ESTATUS: "",
    ESTADO_FISICO: "",
    CORREO: ""
  });

  const cargarInventario = async () => {
    const data = await obtenerInventario();
    setInventario(data);
  };

  const cargarCatalogos = async () => {
    const data = await obtenerCatalogos();
    setCatalogos(data);
  };

  useEffect(() => {
    cargarInventario();
    cargarCatalogos();
  }, []);

const manejarCambio = (e) => {
  const { name, value } = e.target;

  if (name === "ID_UNIDAD") {

  const localidades = catalogos.unidades.filter(
    (item) =>
      String(item.id_marca) === String(value)
  );

  setLocalidadesFiltradas(localidades);

  setFormulario((prev) => ({
    ...prev,
    ID_UNIDAD: value,
    LOCALIDAD: ""
  }));

  return;
}

  // Marca -> Modelo
  if (name === "ID_MARCA") {
    const modelos = catalogos.modelos.filter(
      (item) => String(item.id_marca) === String(value)
    );

    setModelosFiltrados(modelos);

    setFormulario((prev) => ({
      ...prev,
      ID_MARCA: value,
      MODELO: ""
    }));

    return;
  }

  setFormulario((prev) => ({
    ...prev,
    [name]: value
  }));
};

  const guardarEquipo = async (e) => {
    e.preventDefault();

    try {
      await crearInventario(formulario);

      setFormulario({
        ID_UNIDAD: "",
        LOCALIDAD: "",
        UBICACION: "",
        ID_TIPO_EQUIPO: "",
        NOMBRE_EQUIPO: "",
        ID_DEPARTAMENTO: "",
        SERIAL: "",
        ID_PROCESADOR: "",
        ID_MARCA: "",
        MODELO: "",
        IP: "",
        ID_ESTATUS: "",
        ESTADO_FISICO: "",
        CORREO: ""
      });

      await cargarInventario();
      alert("Equipo agregado correctamente");
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
          <select name="ID_UNIDAD" value={formulario.ID_UNIDAD} onChange={manejarCambio}>
            <option value="">Selecciona unidad</option>
            {catalogos.unidades.map((item) => (
              <option key={item.id} value={item.id}>
                {item.unidad}
              </option>
            ))}
          </select>

<select name="LOCALIDAD"  value={formulario.LOCALIDAD}  onChange={manejarCambio}
> <option value="">
    Selecciona localidad
  </option>
{localidadesFiltradas.map((item) => (
    <option
      key={item.id}
      value={item.localidad}
    >
      {item.localidad}
    </option>
  ))}
</select>

          <input name="UBICACION" placeholder="Ubicación" value={formulario.UBICACION} onChange={manejarCambio} />

          <select name="ID_TIPO_EQUIPO" value={formulario.ID_TIPO_EQUIPO} onChange={manejarCambio}>
            <option value="">Selecciona tipo de equipo</option>
            {catalogos.tiposEquipo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.tequipo}
              </option>
            ))}
          </select>

          <input name="NOMBRE_EQUIPO" placeholder="Nombre equipo" value={formulario.NOMBRE_EQUIPO} onChange={manejarCambio} />

          <select name="ID_DEPARTAMENTO" value={formulario.ID_DEPARTAMENTO} onChange={manejarCambio}>
            <option value="">Selecciona departamento</option>
            {catalogos.departamentos.map((item) => (
              <option key={item.Id} value={item.Id}>
                {item.Nombre_departamento}
              </option>
            ))}
          </select>

          <input name="SERIAL" placeholder="Serial" value={formulario.SERIAL} onChange={manejarCambio} />

          <select name="ID_PROCESADOR" value={formulario.ID_PROCESADOR} onChange={manejarCambio}>
            <option value="">Selecciona procesador</option>
            {catalogos.procesadores.map((item) => (
              <option key={item.id} value={item.id}>
                {item.Nombre}
              </option>
            ))}
          </select>

          <select name="ID_MARCA" value={formulario.ID_MARCA} onChange={manejarCambio}>
            <option value="">Selecciona marca</option>
            {catalogos.marcas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.Marca}
              </option>
            ))}
          </select>

   <select name="MODELO" value={formulario.MODELO} onChange={manejarCambio}>
  <option value="">Selecciona modelo</option>

  {modelosFiltrados.map((item) => (
    <option key={item.id} value={item.Modelo}>
      {item.Modelo}
    </option>
  ))}
</select>

          <input name="IP" placeholder="IP" value={formulario.IP} onChange={manejarCambio} />

          <select name="ID_ESTATUS" value={formulario.ID_ESTATUS} onChange={manejarCambio}>
            <option value="">Selecciona estatus</option>
            {catalogos.estatus.map((item) => (
              <option key={item.Id} value={item.Id}>
                {item.Estatus_equipo}
              </option>
            ))}
          </select>

          <input name="ESTADO_FISICO" placeholder="Estado físico" value={formulario.ESTADO_FISICO} onChange={manejarCambio} />

          <input name="CORREO" placeholder="Correo" value={formulario.CORREO} onChange={manejarCambio} />

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