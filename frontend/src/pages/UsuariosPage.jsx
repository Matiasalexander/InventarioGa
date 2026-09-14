import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

import UsuarioModal from "../components/UsuarioModal";
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

function UsuariosPage({ setLoading }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [unidades, setUnidades] = useState([]);

  const [mostrarModalUsuario, setMostrarModalUsuario] =
    useState(false);

  const [usuarioEditar, setUsuarioEditar] =
    useState(null);

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("usuarios.ver");
  const puedeCrear = tienePermiso("usuarios.crear");
  const puedeEditar = tienePermiso("usuarios.editar");

  // =========================================================
  // CARGA INICIAL
  // =========================================================

  useEffect(() => {
    if (puedeVer) {
      cargarDatos();
    }
  }, [puedeVer]);

  // =========================================================
  // MENSAJES DE ERROR
  // =========================================================

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

  // =========================================================
  // CARGAR USUARIOS Y CATÁLOGOS
  // =========================================================

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

  // =========================================================
  // RECARGAR SOLO USUARIOS
  // =========================================================

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

  // =========================================================
  // ABRIR MODAL - NUEVO USUARIO
  // =========================================================

  const abrirNuevoUsuario = () => {
    setUsuarioEditar(null);
    setMostrarModalUsuario(true);
  };

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const cerrarModalUsuario = () => {
    setMostrarModalUsuario(false);
    setUsuarioEditar(null);
  };

  // =========================================================
  // GUARDAR / ACTUALIZAR USUARIO
  // =========================================================

  const guardarUsuario = async (
    form,
    usuarioEditar
  ) => {
    // -------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------

    if (!form.Nombre.trim()) {
      toast.warning("El nombre es obligatorio.");
      return false;
    }

    if (!form.Correo.trim()) {
      toast.warning("El correo es obligatorio.");
      return false;
    }

    if (!form.IdRol) {
      toast.warning("Selecciona un rol.");
      return false;
    }

    // La contraseña solo es obligatoria al crear
    if (!usuarioEditar && !form.Password) {
      toast.warning(
        "La contraseña es obligatoria."
      );
      return false;
    }

    if (
      !form.VerTodasUnidades &&
      form.Unidades.length === 0
    ) {
      toast.warning(
        "Selecciona por lo menos una unidad o activa la opción de ver todas las unidades."
      );
      return false;
    }

    try {
      setLoading(true);

      // -----------------------------------------------------
      // DATOS DEL USUARIO
      // -----------------------------------------------------

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

      // Si existe usuarioEditar estamos editando
      const editandoId =
        usuarioEditar?.IdUsuario || null;

      let idUsuarioGuardado;
      let dataUsuario;

      // -----------------------------------------------------
      // CREAR
      // -----------------------------------------------------

      if (!editandoId) {
        dataUsuario =
          await crearUsuario({
            ...bodyUsuario,
            Password: form.Password
          });

        idUsuarioGuardado =
          dataUsuario.usuario?.IdUsuario;
      }

      // -----------------------------------------------------
      // ACTUALIZAR
      // -----------------------------------------------------

      else {
        dataUsuario =
          await actualizarUsuario(
            editandoId,
            bodyUsuario
          );

        idUsuarioGuardado = editandoId;
      }

      // -----------------------------------------------------
      // VALIDAR ID
      // -----------------------------------------------------

      if (!idUsuarioGuardado) {
        throw new Error(
          "No se pudo identificar el usuario guardado."
        );
      }

      // -----------------------------------------------------
      // ACTUALIZAR UNIDADES
      // -----------------------------------------------------

      await actualizarUnidadesUsuario(
        idUsuarioGuardado,
        {
          VerTodasUnidades:
            Boolean(
              form.VerTodasUnidades
            ),

          Unidades:
            form.VerTodasUnidades
              ? []
              : form.Unidades
        }
      );

      // -----------------------------------------------------
      // MENSAJE
      // -----------------------------------------------------

      toast.success(
        dataUsuario.message ||
          "Usuario guardado correctamente."
      );

      // -----------------------------------------------------
      // CERRAR MODAL
      // -----------------------------------------------------

      cerrarModalUsuario();

      // -----------------------------------------------------
      // ACTUALIZAR TABLA
      // -----------------------------------------------------

      await cargarUsuarios();

      return true;
    } catch (error) {
      toast.error(
        obtenerMensajeError(
          error,
          "Error guardando usuario."
        )
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EDITAR USUARIO
  // =========================================================

  const editarUsuario = async (usuario) => {
    try {
      setLoading(true);

      // -----------------------------------------------------
      // OBTENER UNIDADES DEL USUARIO
      // -----------------------------------------------------

      const resultadoUnidades =
        await obtenerUnidadesUsuario(
          usuario.IdUsuario
        );

      // -----------------------------------------------------
      // BUSCAR ROL
      // -----------------------------------------------------

      const rolEncontrado = roles.find(
        (rol) => rol.Rol === usuario.Rol
      );

      // -----------------------------------------------------
      // PREPARAR USUARIO PARA EL MODAL
      // -----------------------------------------------------

      const usuarioParaEditar = {
        ...usuario,

        IdRol:
          usuario.IdRol ||
          rolEncontrado?.IdRol ||
          "",

        VerTodasUnidades: Boolean(
          resultadoUnidades.usuario
            ?.VerTodasUnidades
        ),

        Unidades:
          resultadoUnidades.unidades?.map(
            (unidad) => Number(unidad.id)
          ) || []
      };

      // -----------------------------------------------------
      // ABRIR MODAL
      // -----------------------------------------------------

      setUsuarioEditar(
        usuarioParaEditar
      );

      setMostrarModalUsuario(true);
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

  // =========================================================
  // CAMBIAR CONTRASEÑA
  // =========================================================

  const cambiarPassword = async (
    idUsuario
  ) => {
    const nuevaPassword =
      window.prompt(
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

  // =========================================================
  // ELIMINAR USUARIO
  // =========================================================

  const eliminarUsuarioClick = async (
    idUsuario
  ) => {
    const confirmar =
      window.confirm(
        "¿Seguro que deseas eliminar este usuario?"
      );

    if (!confirmar) {
      return;
    }

    try {
      setLoading(true);

      const data =
        await eliminarUsuario(
          idUsuario
        );

      toast.success(
        data.message ||
          "Usuario eliminado correctamente."
      );

      // Si el usuario eliminado estaba abierto
      // en el modal, cerrarlo.
      if (
        usuarioEditar?.IdUsuario ===
        idUsuario
      ) {
        cerrarModalUsuario();
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

  // =========================================================
  // SIN PERMISO PARA VER
  // =========================================================

  if (!puedeVer) {
    return (
      <div className="detail-user">
        <div className="card">
          <h2>Acceso denegado</h2>

          <p>
            No tienes permisos para
            visualizar usuarios.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="detail-user">

      {/* ===================================================
          HEADER
      =================================================== */}
  <div className="card-user">
      <div className="header-user">

        <div>
          <h1>Usuarios</h1>

          <p>
            Administración de usuarios en
            el sistema.
          </p>
        </div>

        {puedeCrear && (
          <button
            type="button"
            onClick={abrirNuevoUsuario}
          >
            + Nuevo usuario
          </button>
        )}

      </div>
      </div><br></br>

      {/* ===================================================
          CONTENIDO
      =================================================== */}

      <div className="page-grid">

        {/* =================================================
            MODAL USUARIO
        ================================================= */}

        <UsuarioModal
          abierto={
            mostrarModalUsuario
          }

          onCerrar={
            cerrarModalUsuario
          }

          onGuardar={
            guardarUsuario
          }

          roles={roles}

          unidades={unidades}

          usuarioEditar={
            usuarioEditar
          }

          puedeCrear={
            puedeCrear
          }

          puedeEditar={
            puedeEditar
          }
        />

        {/* =================================================
            TABLA DE USUARIOS
        ================================================= */}

        <div className="card">

          <div
            className="table-responsive"
            style={{
              marginTop: "24px"
            }}
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
                      No hay usuarios
                      registrados.
                    </td>

                  </tr>

                ) : (

                  usuarios.map(
                    (usuario) => (

                      <tr
                        key={
                          usuario.IdUsuario
                        }
                      >

                        <td>
                          {usuario.Nombre}
                        </td>

                        <td>
                          {usuario.Correo}
                        </td>

                        <td>
                          {usuario.Telefono ||
                            "—"}
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
                            usuario={
                              usuario
                            }

                            onEditar={
                              editarUsuario
                            }

                            onEliminar={
                              eliminarUsuarioClick
                            }

                            onPassword={
                              cambiarPassword
                            }
                          />

                        </td>

                      </tr>

                    )
                  )

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