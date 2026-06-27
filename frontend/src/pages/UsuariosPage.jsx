import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/Usuarios.css";
function UsuariosPage({ setLoading }) {
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const [form, setForm] = useState({
    Nombre: "",
    Correo: "",
    Telefono: "",
    Password: "",
    Rol: "Usuario",
    Activo: true
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/api/usuarios");
      const data = await response.json();

      setUsuarios(data);
    } catch (error) {
      toast.error("Error cargando usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const limpiarForm = () => {
    setEditandoId(null);
    setForm({
      Nombre: "",
      Correo: "",
      Telefono: "",
      Password: "",
      Rol: "Usuario",
      Activo: true
    });
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const url = editandoId
        ? `http://localhost:3001/api/usuarios/${editandoId}`
        : "http://localhost:3001/api/usuarios";

      const method = editandoId ? "PUT" : "POST";

      const body = { ...form };

      if (editandoId) {
        delete body.Password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error guardando usuario");
      }

      toast.success(data.message);
      limpiarForm();
      cargarUsuarios();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const editarUsuario = (usuario) => {
    setEditandoId(usuario.IdUsuario);

    setForm({
      Nombre: usuario.Nombre || "",
      Correo: usuario.Correo || "",
      Telefono: usuario.Telefono || "",
      Password: "",
      Rol: usuario.Rol || "Usuario",
      Activo: usuario.Activo
    });
  };

  const cambiarPassword = async (idUsuario) => {
    const nuevaPassword = window.prompt("Nueva contraseña:");

    if (!nuevaPassword) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/usuarios/${idUsuario}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            Password: nuevaPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error cambiando contraseña");
      }

      toast.success("Contraseña actualizada.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const eliminarUsuario = async (idUsuario) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este usuario?"
    );

    if (!confirmar) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/usuarios/${idUsuario}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error eliminando usuario");
      }

      toast.success(data.message);
      cargarUsuarios();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="detail-user">

      <div className="page-grid">

        <div className="card">
          <h2>Registrar usuario</h2>

          <form onSubmit={guardarUsuario} className="form-grid">

            <div className="campo">
              <p>Nombre</p>
              <input
                type="text"
                placeholder="Nombre"
                value={form.Nombre}
                onChange={(e) =>
                  setForm({ ...form, Nombre: e.target.value })
                }
              />
            </div>

            <div className="campo">
              <p>Email</p>
              <input
                type="email"
                placeholder="Correo"
                value={form.Correo}
                onChange={(e) =>
                  setForm({ ...form, Correo: e.target.value })
                }
              />
            </div>

            <div className="campo">
              <p>Télefono</p>
              <input
                type="text"
                placeholder="Teléfono"
                value={form.Telefono}
                onChange={(e) =>
                  setForm({ ...form, Telefono: e.target.value })
                }
              />
            </div>

            <div className="campo">
              <p>Contraseña</p>
              {!editandoId && (
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={form.Password}
                  onChange={(e) =>
                    setForm({ ...form, Password: e.target.value })
                  }
                />
              )}
            </div>

            <div className="campo">
              <p>Rol de usuario</p>
              <select
                value={form.Rol}
                onChange={(e) =>
                  setForm({ ...form, Rol: e.target.value })
                }
              >
                <option value="Administrador">Administrador</option>
                <option value="Sistemas">Sistemas</option>
                <option value="RH">RH</option>
                <option value="Consulta">Consulta</option>
                <option value="Usuario">Usuario</option>
              </select>
            </div>

            <div className="campo">
              <p>Estado</p>
              <select
                value={form.Activo ? "1" : "0"}
                onChange={(e) =>
                  setForm({ ...form, Activo: e.target.value === "1" })
                }
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>

            <div className="botones">
              <button className="btn-primary" type="submit">
                {editandoId ? "Actualizar" : "Crear usuario"}
              </button>
            </div>

            {editandoId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={limpiarForm}
              >
                Cancelar
              </button>
            )}
          </form>

        </div>

        <div className="card">
          <div className="table-responsive" style={{ marginTop: "24px" }}>
            <h2>Usuarios</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
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
                    <td colSpan="7">No hay usuarios registrados.</td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.IdUsuario}>
                      <td>{usuario.IdUsuario}</td>
                      <td>{usuario.Nombre}</td>
                      <td>{usuario.Correo}</td>
                      <td>{usuario.Telefono}</td>
                      <td>{usuario.Rol}</td>
                      <td>{usuario.Activo ? "Sí" : "No"}</td>
                      <td>
                        <button
                          className="btn-primary"
                          onClick={() => editarUsuario(usuario)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn-secondary"
                          onClick={() => cambiarPassword(usuario.IdUsuario)}
                        >
                          Password
                        </button>

                        <button
                          className="btn-secondary"
                          onClick={() => eliminarUsuario(usuario.IdUsuario)}
                        >
                          Eliminar
                        </button>
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