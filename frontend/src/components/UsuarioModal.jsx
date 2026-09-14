import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X } from "lucide-react";

import "../styles/UsuarioModal.css";

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

const UsuarioModal = ({
  abierto,
  onCerrar,
  onGuardar,

  roles,
  unidades,

  usuarioEditar = null
}) => {
  const [form, setForm] = useState(formularioInicial);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarModalUnidades, setMostrarModalUnidades] =
    useState(false);

  const editando = Boolean(usuarioEditar);

  useEffect(() => {
    if (!abierto) return;

    if (usuarioEditar) {
      setForm({
        Nombre: usuarioEditar.Nombre || "",
        Correo: usuarioEditar.Correo || "",
        Telefono: usuarioEditar.Telefono || "",
        Password: "",
        IdRol: usuarioEditar.IdRol || "",
        Activo: Boolean(usuarioEditar.Activo),
        VerTodasUnidades: Boolean(
          usuarioEditar.VerTodasUnidades
        ),
        Unidades: usuarioEditar.Unidades || []
      });
    } else {
      setForm(formularioInicial);
    }

    setMostrarPassword(false);
    setMostrarModalUnidades(false);
  }, [abierto, usuarioEditar]);

  if (!abierto) return null;

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

  const enviarFormulario = async (e) => {
    e.preventDefault();

    await onGuardar(form, usuarioEditar);
  };

  const cerrar = () => {
    setMostrarModalUnidades(false);
    onCerrar();
  };

  return createPortal(
    <div
      className="usuario-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          cerrar();
        }
      }}
    >
      <div
        className="usuario-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="usuario-modal-header">
          <div>
            <h2>
              {editando
                ? "Editar usuario"
                : "Nuevo usuario"}
            </h2>

            <p>
              {editando
                ? "Actualiza la información del usuario."
                : "Registra un nuevo usuario en el sistema."}
            </p>
          </div>

          <button
            type="button"
            className="usuario-modal-close"
            onClick={cerrar}
            aria-label="Cerrar"
          >
            
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={enviarFormulario}
          className="usuario-modal-form"
        >
          <div className="usuario-form-grid">

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

            {!editando && (
              <div className="campo">
                <p>Contraseña</p>

                <div className="password-input">
                  <input
                    type={
                      mostrarPassword
                        ? "text"
                        : "password"
                    }
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
                    onClick={() =>
                      setMostrarPassword(
                        (prev) => !prev
                      )
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    <Eye size={18} />
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
              <p>Acceso al inventario</p>

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
                  Todas las unidades
                </span>
              </label>
            </div>

            <div className="campo campo-unidades">
              <p>Unidades permitidas</p>

              <button
                type="button"
                className="btn-unidades"
                onClick={() =>
                  setMostrarModalUnidades(true)
                }
              >
                Unidades

                {!form.VerTodasUnidades &&
                  ` (${form.Unidades.length}) seleccionadas`}
              </button>

           
            </div>

          </div>
   {form.VerTodasUnidades && (
                <div className="mensaje-unidades">
                  Este usuario puede ver todas las
                  unidades.
                </div>
              )}
          <div className="usuario-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={cerrar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              {editando
                ? "Actualizar"
                : "Crear usuario"}
            </button>
          </div>
        </form>

        {/* MODAL DE UNIDADES */}
        {mostrarModalUnidades &&
          createPortal(
            <div
              className="modal-overlay"
              onClick={() =>
                setMostrarModalUnidades(false)
              }
            >
              <div
                className="modal-unidades"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <div className="modal-header">
                  <h3>
                    Seleccionar unidades
                  </h3>

                  <button
                    type="button"
                    className="x-button"
                    onClick={() =>
                      setMostrarModalUnidades(
                        false
                      )
                    }
                  >
                  
                  </button>
                </div>

                {form.VerTodasUnidades ? (
                  <div className="mensaje-unidades">
                    Este usuario podrá ver todas
                    las unidades.
                  </div>
                ) : (
                  <div className="lista-unidades">
                    {unidades.length === 0 ? (
                      <p>
                        No hay unidades disponibles.
                      </p>
                    ) : (
                      unidades.map((unidad) => {
                        const idUnidad =
                          Number(unidad.id);

                        return (
                          <label
                            key={idUnidad}
                            className="unidad-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={form.Unidades.includes(
                                idUnidad
                              )}
                              onChange={() =>
                                cambiarUnidadSeleccionada(
                                  idUnidad
                                )
                              }
                            />

                            <span>
                              {unidad.unidad} -{" "}
                              {unidad.localidad}
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
                    onClick={() =>
                      setMostrarModalUnidades(
                        false
                      )
                    }
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>,
    document.body
  );
};

export default UsuarioModal;