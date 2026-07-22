import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerRoles,
  obtenerPermisos,
  obtenerPermisosRol,
  actualizarPermisosRol
} from "../services/rolesService";

import "../styles/Roles.css";

function RolesPage({ setLoading }) {
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [idRolSeleccionado, setIdRolSeleccionado] =
    useState("");

  const [permisosSeleccionados, setPermisosSeleccionados] =
    useState([]);

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (idRolSeleccionado) {
      cargarPermisosDelRol(idRolSeleccionado);
    } else {
      setPermisosSeleccionados([]);
    }
  }, [idRolSeleccionado]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      const [rolesData, permisosData] = await Promise.all([
        obtenerRoles(),
        obtenerPermisos()
      ]);

      setRoles(rolesData || []);
      setPermisos(permisosData || []);

      if (rolesData?.length > 0) {
        setIdRolSeleccionado(
          String(rolesData[0].ID_ROL)
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error cargando roles y permisos."
      );
    } finally {
      setLoading(false);
    }
  };

  const cargarPermisosDelRol = async (idRol) => {
    try {
      setLoading(true);

      const data = await obtenerPermisosRol(idRol);

      setPermisosSeleccionados(
        (data || []).map((permiso) =>
          Number(permiso.ID_PERMISO)
        )
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error cargando permisos del rol."
      );
    } finally {
      setLoading(false);
    }
  };

  const permisosAgrupados = useMemo(() => {
    return permisos.reduce((grupos, permiso) => {
      const modulo = permiso.MODULO || "Otros";

      if (!grupos[modulo]) {
        grupos[modulo] = [];
      }

      grupos[modulo].push(permiso);

      return grupos;
    }, {});
  }, [permisos]);

  const permisoEstaSeleccionado = (idPermiso) => {
    return permisosSeleccionados.includes(
      Number(idPermiso)
    );
  };

  const cambiarPermiso = (idPermiso) => {
    const id = Number(idPermiso);

    setPermisosSeleccionados((anteriores) => {
      if (anteriores.includes(id)) {
        return anteriores.filter(
          (permisoId) => permisoId !== id
        );
      }

      return [...anteriores, id];
    });
  };

  const moduloCompleto = (permisosModulo) => {
    if (permisosModulo.length === 0) {
      return false;
    }

    return permisosModulo.every((permiso) =>
      permisosSeleccionados.includes(
        Number(permiso.ID_PERMISO)
      )
    );
  };

  const cambiarModuloCompleto = (permisosModulo) => {
    const idsModulo = permisosModulo.map((permiso) =>
      Number(permiso.ID_PERMISO)
    );

    const todosSeleccionados =
      idsModulo.every((id) =>
        permisosSeleccionados.includes(id)
      );

    setPermisosSeleccionados((anteriores) => {
      if (todosSeleccionados) {
        return anteriores.filter(
          (id) => !idsModulo.includes(id)
        );
      }

      return [
        ...new Set([
          ...anteriores,
          ...idsModulo
        ])
      ];
    });
  };

  const seleccionarTodos = () => {
    setPermisosSeleccionados(
      permisos.map((permiso) =>
        Number(permiso.ID_PERMISO)
      )
    );
  };

  const limpiarTodos = () => {
    setPermisosSeleccionados([]);
  };

  const guardarPermisos = async () => {
    if (!idRolSeleccionado) {
      toast.warning("Selecciona un rol.");
      return;
    }

    try {
      setGuardando(true);
      setLoading(true);

      const data = await actualizarPermisosRol(
        idRolSeleccionado,
        permisosSeleccionados
      );

      toast.success(
        data.message ||
          "Permisos actualizados correctamente."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error guardando permisos."
      );
    } finally {
      setGuardando(false);
      setLoading(false);
    }
  };

  const rolSeleccionado = roles.find(
    (rol) =>
      String(rol.ID_ROL) ===
      String(idRolSeleccionado)
  );

  return (
    <div className="roles-page">
      <div className="header">
        <div>
          <h1>Roles y permisos</h1>

          <p>
            Configura qué módulos y acciones puede utilizar
            cada rol.
          </p>
        </div>
      </div>

      <div className="roles-layout">
        <div className="card roles-panel">
          <h2>Roles</h2>

          <div className="campo">
            <p>Selecciona un rol</p>

            <select
              value={idRolSeleccionado}
              onChange={(e) =>
                setIdRolSeleccionado(
                  e.target.value
                )
              }
            >
              <option value="">
                Selecciona un rol
              </option>

              {roles.map((rol) => (
                <option
                  key={rol.ID_ROL}
                  value={rol.ID_ROL}
                >
                  {rol.NOMBRE}
                </option>
              ))}
            </select>
          </div>

          {rolSeleccionado && (
            <div className="rol-detalle">
              <strong>
                {rolSeleccionado.NOMBRE}
              </strong>

              <p>
                {rolSeleccionado.DESCRIPCION ||
                  "Sin descripción"}
              </p>

              <span>
                {rolSeleccionado.ACTIVO
                  ? "Activo"
                  : "Inactivo"}
              </span>
            </div>
          )}
        </div>

        <div className="card permisos-panel">
          <div className="permisos-header">
            <div>
              <h2>Permisos</h2>

              <p>
                {permisosSeleccionados.length} de{" "}
                {permisos.length} seleccionados
              </p>
            </div>

            <div className="permisos-acciones">
              <button
                type="button"
                onClick={seleccionarTodos}
              >
                Seleccionar todos
              </button>

              <button
                type="button"
                onClick={limpiarTodos}
              >
                Limpiar
              </button>
            </div>
          </div>

          {!idRolSeleccionado ? (
            <p>Selecciona un rol para continuar.</p>
          ) : (
            <div className="modulos-grid">
              {Object.entries(
                permisosAgrupados
              ).map(
                ([
                  modulo,
                  permisosModulo
                ]) => (
                  <div
                    className="modulo-card"
                    key={modulo}
                  >
                    <div className="modulo-header">
                      <h3>{modulo}</h3>

                      <label className="permiso-check permiso-todos">
                        <input
                          type="checkbox"
                          checked={moduloCompleto(
                            permisosModulo
                          )}
                          onChange={() =>
                            cambiarModuloCompleto(
                              permisosModulo
                            )
                          }
                        />

                        <span>Todos</span>
                      </label>
                    </div>

                    <div className="permisos-lista">
                      {permisosModulo.map(
                        (permiso) => (
                          <label
                            className="permiso-check"
                            key={
                              permiso.ID_PERMISO
                            }
                          >
                            <input
                              type="checkbox"
                              checked={permisoEstaSeleccionado(
                                permiso.ID_PERMISO
                              )}
                              onChange={() =>
                                cambiarPermiso(
                                  permiso.ID_PERMISO
                                )
                              }
                            />

                            <div>
                              <strong>
                                {permiso.NOMBRE}
                              </strong>

                              <small>
                                {permiso.CODIGO}
                              </small>
                            </div>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="guardar-permisos">
            <button
              type="button"
              className="btn-primary"
              onClick={guardarPermisos}
              disabled={
                !idRolSeleccionado ||
                guardando
              }
            >
              {guardando
                ? "Guardando..."
                : "Guardar permisos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RolesPage;