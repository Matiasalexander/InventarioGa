
import { useEffect, useState } from "react";

import {
  obtenerSistemasOperativos,
  crearSistemaOperativo,
  actualizarSistemaOperativo,
  eliminarSistemaOperativo
} from "../services/sistemasOperativos";

const SistemasOperativosPage = () => {
  const [sistemasOperativos, setSistemasOperativos] = useState([]);

  const [formulario, setFormulario] = useState({
    Nombre: "",
    N_Version: ""
  });

  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarSistemasOperativos = async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerSistemasOperativos();

      setSistemasOperativos(datos);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Error obteniendo sistemas operativos"
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSistemasOperativos();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormulario({
      Nombre: "",
      N_Version: ""
    });

    setEditando(null);
    setError("");
  };

  const manejarGuardar = async (e) => {
    e.preventDefault();

    if (!formulario.Nombre.trim()) {
      setError("El nombre del sistema operativo es obligatorio");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      if (editando) {
        await actualizarSistemaOperativo(editando, formulario);

        setMensaje("Sistema operativo actualizado correctamente");
      } else {
        await crearSistemaOperativo(formulario);

        setMensaje("Sistema operativo creado exitosamente");
      }

      limpiarFormulario();
      await cargarSistemasOperativos();

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Error guardando sistema operativo"
      );
    } finally {
      setGuardando(false);
    }
  };

  const manejarEditar = (sistemaOperativo) => {
    setEditando(sistemaOperativo.id);

    setFormulario({
      Nombre: sistemaOperativo.Nombre || "",
      N_Version: sistemaOperativo.N_Version || ""
    });

    setMensaje("");
    setError("");
  };

  const manejarEliminar = async (id) => {
    const confirmar = window.confirm(
      "¿Estás seguro de eliminar este sistema operativo?"
    );

    if (!confirmar) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      await eliminarSistemaOperativo(id);

      setMensaje("Sistema operativo eliminado correctamente");

      await cargarSistemasOperativos();

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Error eliminando sistema operativo"
      );
    }
  };

  return (
    <div className="catalogo-page">

      <div className="catalogo-header">
        <h1>Sistemas Operativos</h1>

        <p>
          Administración de sistemas operativos y sus versiones.
        </p>
      </div>

      <div className="catalogo-content">

        <div className="catalogo-form">

          <h2>
            {editando
              ? "Editar sistema operativo"
              : "Nuevo sistema operativo"}
          </h2>

          <form onSubmit={manejarGuardar}>

            <div className="form-group">
              <label htmlFor="Nombre">
                Nombre
              </label>

              <input
                id="Nombre"
                name="Nombre"
                type="text"
                value={formulario.Nombre}
                onChange={manejarCambio}
                placeholder="Ej. Windows"
                maxLength={150}
              />
            </div>

            <div className="form-group">
              <label htmlFor="N_Version">
                Versión
              </label>

              <input
                id="N_Version"
                name="N_Version"
                type="text"
                value={formulario.N_Version}
                onChange={manejarCambio}
                placeholder="Ej. 11"
                maxLength={150}
              />
            </div>

            <div className="form-actions">

              <button
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Actualizar"
                    : "Guardar"}
              </button>

              {editando && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                >
                  Cancelar
                </button>
              )}

            </div>

          </form>

          {mensaje && (
            <div className="mensaje-exito">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="mensaje-error">
              {error}
            </div>
          )}

        </div>

        <div className="catalogo-lista">

          <h2>Listado de sistemas operativos</h2>

          {cargando ? (
            <p>Cargando sistemas operativos...</p>
          ) : sistemasOperativos.length === 0 ? (
            <p>
              No hay sistemas operativos registrados.
            </p>
          ) : (
            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Versión</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>

                {sistemasOperativos.map((sistema) => (
                  <tr key={sistema.id}>

                    <td>
                      {sistema.id}
                    </td>

                    <td>
                      {sistema.Nombre}
                    </td>

                    <td>
                      {sistema.N_Version || "—"}
                    </td>

                    <td>

                      <button
                        type="button"
                        onClick={() => manejarEditar(sistema)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => manejarEliminar(sistema.id)}
                      >
                        Eliminar
                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          )}

        </div>

      </div>

    </div>
  );
};

export default SistemasOperativosPage;

