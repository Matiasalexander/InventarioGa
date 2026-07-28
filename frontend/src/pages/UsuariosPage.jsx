import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { createPortal } from "react-dom";
import { Eye } from "lucide-react";

import "../styles/Usuarios.css";

import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarPasswordUsuario,
  eliminarUsuario,
  obtenerUnidadesUsuario,
  actualizarUnidadesUsuario
} from "../services/usuariosService";

import { obtenerCatalogos } from "../services/catalogosService";

import UsuariosActions from "../components/UsuariosAction";

const formularioInicial = {
  Nombre: "",
  Correo: "",
  Telefono: "",
  Password: "",
  IdRol: "",
  Activo: true,
  VerTodasUnidades: false,
  Unidades: []
};

function UsuariosPage({ setLoading }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formularioInicial);
  const [MostrarModalUnidades, setMostrarModalUnidades] = useState(false);
  const { tienePermiso } = useAuth();
  const [mostrar, setMostrar] = useState(false);


  const puedeVer = tienePermiso("usuarios.ver");
  const puedeCrear = tienePermiso("usuarios.crear");
  const puedeEditar = tienePermiso("usuarios.editar");

  useEffect(() => {
    if (puedeVer) {
      cargarDatos();
    }
  }, [puedeVer]);

  const obtenerMensajeError = (
    error,
    mensajePredeterminado
  ) => {
    return (
      error.response?.data?.message ||
      error.message ||
      mensajePredeterminado
    );
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [usuariosData, catalogosData] =
        await Promise.all([
          obtenerUsuarios(),
          obtenerCatalogos()
        ]);

      setUsuarios(usuariosData || []);
      setRoles(catalogosData.roles || []);
      setUnidades(catalogosData.unidades || []);
    } catch (error) {
      toast.error(
        obtenerMensajeError(
          error,
          "Error cargando la información."
        )
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
        obtenerMensajeError(
          error,
          "Error cargando usuarios."
        )
      );
    }
  };

  const limpiarForm = () => {
    setEditandoId(null);
    setForm(formularioInicial);
  };

  const cambiarCampo = (campo, valor) => {
    setForm((formActual) => ({
      ...formActual,
      [campo]: valor
    }));
  };

  const cambiarUnidadSeleccionada = (idUnidad) => {
    const idNumerico = Number(idUnidad);

    setForm((formActual) => {
      const yaSeleccionada =
        formActual.Unidades.includes(idNumerico);

      return {
        ...formActual,
        Unidades: yaSeleccionada
          ? formActual.Unidades.filter(
              (id) => id !== idNumerico
            )
          : [...formActual.Unidades, idNumerico]
      };
    });
  };

  const cambiarVerTodasUnidades = (valor) => {
    setForm((formActual) => ({
      ...formActual,
      VerTodasUnidades: valor,
      Unidades: valor
        ? []
        : formActual.Unidades
    }));
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

    if (
      !form.VerTodasUnidades &&
      form.Unidades.length === 0
    ) {
      toast.warning(
        "Selecciona por lo menos una unidad o activa la opción de ver todas las unidades."
      );
      return;
    }

    try {
      setLoading(true);

      const bodyUsuario = {
        Nombre: form.Nombre.trim(),
        Correo: form.Correo
          .trim()
          .toLowerCase(),
        Telefono:
          form.Telefono.trim() || null,
        IdRol: Number(form.IdRol),
        Activo: Boolean(form.Activo)
      };

      let idUsuarioGuardado;
      let dataUsuario;

      if (editandoId) {
        dataUsuario = await actualizarUsuario(
          editandoId,
          bodyUsuario
        );

        idUsuarioGuardado = editandoId;
      } else {
        dataUsuario = await crearUsuario({
          ...bodyUsuario,
          Password: form.Password
        });

        idUsuarioGuardado =
          dataUsuario.usuario?.IdUsuario;
      }

      if (!idUsuarioGuardado) {
        throw new Error(
          "No se pudo identificar el usuario guardado."
        );
      }

      await actualizarUnidadesUsuario(
        idUsuarioGuardado,
        {
          VerTodasUnidades: Boolean(
            form.VerTodasUnidades
          ),
          Unidades: form.VerTodasUnidades
            ? []
            : form.Unidades
        }
      );

      toast.success(
        dataUsuario.message ||
          "Usuario guardado correctamente."
      );

      limpiarForm();
      await cargarUsuarios();
    } catch (error) {
      toast.error(
        obtenerMensajeError(
          error,
          "Error guardando usuario."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const editarUsuario = async (usuario) => {
    try {
      setLoading(true);

      const resultadoUnidades =
        await obtenerUnidadesUsuario(
          usuario.IdUsuario
        );

      const rolEncontrado = roles.find(
        (rol) => rol.Rol === usuario.Rol
      );

      setEditandoId(usuario.IdUsuario);

      setForm({
        Nombre: usuario.Nombre || "",
        Correo: usuario.Correo || "",
        Telefono: usuario.Telefono || "",
        Password: "",
        IdRol:
          usuario.IdRol ||
          rolEncontrado?.IdRol ||
          "",
        Activo: Boolean(usuario.Activo),
        VerTodasUnidades: Boolean(
          resultadoUnidades.usuario
            ?.VerTodasUnidades
        ),
        Unidades:
          resultadoUnidades.unidades?.map(
            (unidad) => Number(unidad.id)
          ) || []
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      toast.error(
        obtenerMensajeError(
          error,
          "Error cargando las unidades del usuario."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const cambiarPassword = async (idUsuario) => {
    const nuevaPassword = window.prompt(
      "Nueva contraseña:"
    );

    if (!nuevaPassword) {
      return;
    }

    try {
      setLoading(true);

      const data =
        await cambiarPasswordUsuario(
          idUsuario,
          nuevaPassword
        );

      toast.success(
        data.message ||
          "Contraseña actualizada."
      );
    } catch (error) {
      toast.error(
        obtenerMensajeError(
          error,
          "Error cambiando contraseña."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuarioClick = async (
    idUsuario
  ) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este usuario?"
    );

    if (!confirmar) {
      return;
    }

    try {
      setLoading(true);

      const data =
        await eliminarUsuario(idUsuario);

      toast.success(
        data.message ||
          "Usuario eliminado correctamente."
      );

      if (editandoId === idUsuario) {
        limpiarForm();
      }

      await cargarUsuarios();
    } catch (error) {
      toast.error(
        obtenerMensajeError(
          error,
          "Error eliminando usuario."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (!puedeVer) {
    return (
      <div className="detail-user">
        <div className="card">
          <h2>Acceso denegado</h2>

          <p>
            No tienes permisos para visualizar
            usuarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-user">
      <div className="header">
        <div>
          <h1>Usuarios</h1>

          <p>
            Administración de usuarios en el
            sistema.
          </p>
        </div>
      </div>

      <div className="page-grid">
        {(puedeCrear ||
          (editandoId && puedeEditar)) && (
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
                    cambiarCampo(
                      "Nombre",
                      e.target.value
                    )
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
                    cambiarCampo(
                      "Correo",
                      e.target.value
                    )
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
                    cambiarCampo(
                      "Telefono",
                      e.target.value
                    )
                  }
                />
              </div>

              {!editandoId && (
                <div className="campo">
                  <p>Contraseña</p>
<div className="password-input">
                  <input
            type={mostrar? "text" : "password"}
                    placeholder="Contraseña"
                    value={form.Password}
                    onChange={(e) =>
                      cambiarCampo(
                        "Password",
                        e.target.value
                      )
                    }
                    required
                  />
                   <button
              type="button"
              className="mostrar-password"
              onClick={() => setMostrar(!mostrar)}
            >
              <Eye className="eye-icon"/>
              {mostrar}
            </button>
                </div>
                </div>
              )}

              <div className="campo">
                <p>Rol de usuario</p>

                <select
                  value={form.IdRol}
                  onChange={(e) =>
                    cambiarCampo(
                      "IdRol",
                      e.target.value
                    )
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
                  value={
                    form.Activo ? "1" : "0"
                  }
                  onChange={(e) =>
                    cambiarCampo(
                      "Activo",
                      e.target.value === "1"
                    )
                  }
                >
                  <option value="1">
                    Activo
                  </option>

                  <option value="0">
                    Inactivo
                  </option>
                </select>
              </div>

              <div className="campo campo-checkbox">
                <p>Acceso al inventario</p><br></br>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      form.VerTodasUnidades
                    }
                    onChange={(e) =>
                      cambiarVerTodasUnidades(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Ver todas las unidades
                  </span>
                </label>
              </div>

          <div className="campo campo-unidades">
            <p>Unidades permitidas</p><br></br>
            <button
            type="button"
            className="btn-unidades"
            onClick={()=>setMostrarModalUnidades(true)}
            >
              Unidades
              {!form.VerTodasUnidades && ` (${form.Unidades.length}) seleccionadas`}
            </button>

            {
              form.VerTodasUnidades && (
                <div className="mensaje-unidades">
                  Este usuario podrá ver todas las unidades
                  </div>
              )}
          </div>

  {MostrarModalUnidades && createPortal (
  <div
    className="modal-overlay"
    onClick={() => setMostrarModalUnidades(false)}
  >
    <div
      className="modal-unidades"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <h3>Seleccionar unidades</h3>

        <button
          type="button"
          className="x-button"
          onClick={() => setMostrarModalUnidades(false)}
        >
          ✕
        </button>
      </div>

      {form.VerTodasUnidades ? (
        <div className="mensaje-unidades">
          Este usuario podrá ver todas las unidades.
        </div>
      ) : (
        <div className="lista-unidades">
          {unidades.length === 0 ? (
            <p>No hay unidades disponibles.</p>
          ) : (
            unidades.map((unidad) => {
              const idUnidad = Number(unidad.id);

              return (
                <label
                  key={idUnidad}
                  className="unidad-checkbox"
                >
                  <input
                    type="checkbox"
                    checked={form.Unidades.includes(idUnidad)}
                    onChange={() =>
                      cambiarUnidadSeleccionada(idUnidad)
                    }
                  />

                  <span>
                    {unidad.unidad} - {unidad.localidad}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}

      <div className="modal-footer">
        <button
          type="button"
          className="btn-primary"
          onClick={() => setMostrarModalUnidades(false)}
        >
          Aceptar
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
              <div className="botones">
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={
                    editandoId
                      ? !puedeEditar
                      : !puedeCrear
                  }
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
        )}

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
                  <th>Acceso unidades</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr
                      key={usuario.IdUsuario}
                    >
                      <td>{usuario.Nombre}</td>

                      <td>{usuario.Correo}</td>

                      <td>
                        {usuario.Telefono || "—"}
                      </td>

                      <td>
                        {usuario.Rol ||
                          "Sin rol"}
                      </td>

                      <td>
                        {usuario.VerTodasUnidades
                          ? "Todas"
                          : "Asignadas"}
                      </td>

                      <td>
                        {usuario.Activo
                          ? "Sí"
                          : "No"}
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