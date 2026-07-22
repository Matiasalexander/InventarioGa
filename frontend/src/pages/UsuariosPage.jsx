import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import "../styles/Usuarios.css";

import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarPasswordUsuario,
  eliminarUsuario
} from "../services/usuariosService";

import { obtenerCatalogos } from "../services/catalogosService";

import UsuariosActions from "../components/UsuariosAction";

function UsuariosPage({ setLoading }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const formularioInicial = {
    Nombre: "",
    Correo: "",
    Telefono: "",
    Password: "",
    IdRol: "",
    Activo: true
  };

  const [form, setForm] = useState(formularioInicial);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [usuariosData, catalogosData] = await Promise.all([
        obtenerUsuarios(),
        obtenerCatalogos()
      ]);

      setUsuarios(usuariosData || []);
      setRoles(catalogosData.roles || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error cargando la información."
      );
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const data = await obtenerUsuarios();
      setUsuarios(data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error cargando usuarios."
      );
    }
  };

  const limpiarForm = () => {
    setEditandoId(null);
    setForm(formularioInicial);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();

    if (!form.Nombre.trim()) {
      toast.warning("El nombre es obligatorio.");
      return;
    }

    if (!form.Correo.trim()) {
      toast.warning("El correo es obligatorio.");
      return;
    }

    if (!form.IdRol) {
      toast.warning("Selecciona un rol.");
      return;
    }

    if (!editandoId && !form.Password) {
      toast.warning("La contraseña es obligatoria.");
      return;
    }

    try {
      setLoading(true);

      const body = {
        ...form,
        Nombre: form.Nombre.trim(),
        Correo: form.Correo.trim().toLowerCase(),
        Telefono: form.Telefono.trim() || null,
        IdRol: Number(form.IdRol)
      };

      let data;

      if (editandoId) {
        delete body.Password;

        data = await actualizarUsuario(
          editandoId,
          body
        );
      } else {
        data = await crearUsuario(body);
      }

      toast.success(
        data.message || "Usuario guardado correctamente."
      );

      limpiarForm();
      await cargarUsuarios();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error guardando usuario."
      );
    } finally {
      setLoading(false);
    }
  };

  const editarUsuario = (usuario) => {
    setEditandoId(usuario.IdUsuario);

    /*
      Preferimos IdRol. El respaldo por nombre permite editar
      usuarios mientras terminamos de actualizar el backend.
    */
    const rolEncontrado = roles.find(
      (rol) => rol.Rol === usuario.Rol
    );

    setForm({
      Nombre: usuario.Nombre || "",
      Correo: usuario.Correo || "",
      Telefono: usuario.Telefono || "",
      Password: "",
      IdRol:
        usuario.IdRol ||
        rolEncontrado?.IdRol ||
        "",
      Activo: Boolean(usuario.Activo)
    });
  };

  const cambiarPassword = async (idUsuario) => {
    const nuevaPassword = window.prompt(
      "Nueva contraseña:"
    );

    if (!nuevaPassword) return;

    try {
      setLoading(true);

      const data = await cambiarPasswordUsuario(
        idUsuario,
        nuevaPassword
      );

      toast.success(
        data.message || "Contraseña actualizada."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error cambiando contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuarioClick = async (idUsuario) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este usuario?"
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      const data = await eliminarUsuario(idUsuario);

      toast.success(
        data.message || "Usuario eliminado correctamente."
      );

      if (editandoId === idUsuario) {
        limpiarForm();
      }

      await cargarUsuarios();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error eliminando usuario."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="detail-user">
      <div className="header">
        <div>
          <h1>Usuarios</h1>
          <p>Administración de usuarios en el sistema.</p>
        </div>
      </div>

      <div className="page-grid">
        <div className="card">
          <h2>
            {editandoId
              ? "Editar usuario"
              : "Registrar usuario"}
          </h2>

          <form
            onSubmit={guardarUsuario}
            className="form-grid"
          >
            <div className="campo">
              <p>Nombre</p>

              <input
                type="text"
                placeholder="Nombre"
                value={form.Nombre}
                onChange={(e) =>
                  setForm({
                    ...form,
                    Nombre: e.target.value
                  })
                }
                required
              />
            </div>

            <div className="campo">
              <p>Correo electrónico</p>

              <input
                type="email"
                placeholder="Correo"
                value={form.Correo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    Correo: e.target.value
                  })
                }
                required
              />
            </div>

            <div className="campo">
              <p>Teléfono</p>

              <input
                type="text"
                placeholder="Teléfono"
                value={form.Telefono}
                onChange={(e) =>
                  setForm({
                    ...form,
                    Telefono: e.target.value
                  })
                }
              />
            </div>

            {!editandoId && (
              <div className="campo">
                <p>Contraseña</p>

                <input
                  type="password"
                  placeholder="Contraseña"
                  value={form.Password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      Password: e.target.value
                    })
                  }
                  required
                />
              </div>
            )}

            <div className="campo">
              <p>Rol de usuario</p>

              <select
                value={form.IdRol}
                onChange={(e) =>
                  setForm({
                    ...form,
                    IdRol: e.target.value
                  })
                }
                required
              >
                <option value="">
                  Selecciona un rol
                </option>

                {roles.map((rol) => (
                  <option
                    key={rol.IdRol}
                    value={rol.IdRol}
                  >
                    {rol.Rol}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <p>Estado</p>

              <select
                value={form.Activo ? "1" : "0"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    Activo: e.target.value === "1"
                  })
                }
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>

            <div className="botones">
              <button
                className="btn-primary"
                type="submit"
              >
                {editandoId
                  ? "Actualizar"
                  : "Crear usuario"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={limpiarForm}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <div
            className="table-responsive"
            style={{ marginTop: "24px" }}
          >
            <h2>Usuarios</h2>

            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.IdUsuario}>
                      <td>{usuario.Nombre}</td>
                      <td>{usuario.Correo}</td>
                      <td>{usuario.Telefono || "—"}</td>
                      <td>{usuario.Rol || "Sin rol"}</td>
                      <td>
                        {usuario.Activo ? "Sí" : "No"}
                      </td>
                      <td>
                        <UsuariosActions
                          usuario={usuario}
                          onEditar={editarUsuario}
                          onEliminar={
                            eliminarUsuarioClick
                          }
                          onPassword={
                            cambiarPassword
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsuariosPage;