import { useEffect, useState } from "react";
import {
  obtenerModelos,
  crearModelo,
  actualizarModelo,
  eliminarModelo
} from "../services/modelosService";
import { obtenerCatalogos } from "../services/catalogosService";
import "./InventarioPage.css";

function ModelosPage() {
  const [modelos, setModelos] = useState([]);

  const [catalogos, setCatalogos] = useState({
    tiposEquipo: [],
    marcas: [],
    modelosEspeciales: []
  });

  const [formulario, setFormulario] = useState({
    id_tequipo: "",
    id_marca: "",
    id_modelos: ""
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [modelosEspecialesFiltrados, setModelosEspecialesFiltrados] = useState([]);
  const [idEditando, setIdEditando] = useState(null);

  const cargarDatos = async () => {
    const modelosData = await obtenerModelos();
    const catalogosData = await obtenerCatalogos();

    setModelos(modelosData);
    setCatalogos(catalogosData);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

const manejarCambio = (e) => {
  const { name, value } = e.target;

  const nuevoFormulario = {
    ...formulario,
    [name]: value
  };

  if (name === "id_tequipo" || name === "id_marca") {
    nuevoFormulario.id_modelos = "";

    const modelosFiltrados = modelos.filter(
      (item) =>
        String(item.id_tequipo) === String(nuevoFormulario.id_tequipo) &&
        String(item.id_marca) === String(nuevoFormulario.id_marca)
    );

    setModelosEspecialesFiltrados(modelosFiltrados);
  }

  setFormulario(nuevoFormulario);
};
  const limpiarFormulario = () => {
    setFormulario({
      id_tequipo: "",
      id_marca: "",
      id_modelos: ""
    });

    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarModelo = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        id_tequipo: formulario.id_tequipo,
        id_marca: formulario.id_marca,
        id_modelos: formulario.id_modelos
      };

      if (modoEdicion) {
        await actualizarModelo(idEditando, payload);
        alert("Modelo actualizado correctamente");
      } else {
        await crearModelo(payload);
        alert("Modelo creado correctamente");
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      console.error("Error guardando modelo:", error.response?.data || error);
      alert(error.response?.data?.error || "Error guardando modelo");
    }
  };

const editarModelo = (item) => {
  const modelosFiltrados = modelos.filter(
    (x) =>
      String(x.id_tequipo) === String(item.id_tequipo) &&
      String(x.id_marca) === String(item.id_marca)
  );

  setModelosEspecialesFiltrados(modelosFiltrados);

  setFormulario({
    id_tequipo: item.id_tequipo || "",
    id_marca: item.id_marca || "",
    id_modelos: item.id_modelos || ""
  });

  setModoEdicion(true);
  setIdEditando(item.id);
};

  const borrarModelo = async (id) => {
    if (!window.confirm("¿Deseas eliminar este modelo?")) return;

    try {
      await eliminarModelo(id);
      await cargarDatos();
      alert("Modelo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando modelo:", error.response?.data || error);
      alert(error.response?.data?.error || "Error eliminando modelo");
    }
  };

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Modelos</h1>
          <p>Relaciona tipo de equipo, marca y modelo específico.</p>
        </div>
      </div>

      <div className="card">
        <h2>{modoEdicion ? "Editar modelo" : "Agregar modelo"}</h2>

        <form onSubmit={guardarModelo} className="form-grid">
          <select
            name="id_tequipo"
            value={formulario.id_tequipo}
            onChange={manejarCambio}
          >
            <option value="">Selecciona tipo de equipo</option>

            {catalogos.tiposEquipo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.tequipo}
              </option>
            ))}
          </select>

          <select
            name="id_marca"
            value={formulario.id_marca}
            onChange={manejarCambio}
          >
            <option value="">Selecciona marca</option>

            {catalogos.marcas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.Marca}
              </option>
            ))}
          </select>

     <select
  name="id_modelos"
  value={formulario.id_modelos}
  onChange={manejarCambio}
  disabled={!formulario.id_tequipo || !formulario.id_marca}
>
  <option value="">Selecciona modelo</option>

  {modelosEspecialesFiltrados.map((item) => (
    <option key={item.id_modelos} value={item.id_modelos}>
      {item.Modelo}
    </option>
  ))}
</select>

          <button type="submit">
            {modoEdicion ? "Actualizar modelo" : "Guardar modelo"}
          </button>

          {modoEdicion && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Listado de modelos</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo equipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {modelos.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.tequipo}</td>
                  <td>{item.Marca}</td>
                  <td>{item.Modelo}</td>
                  <td>
                    <button type="button" onClick={() => editarModelo(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => borrarModelo(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {modelos.length === 0 && (
                <tr>
                  <td colSpan="5">No hay modelos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ModelosPage;