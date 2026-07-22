import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerRoles = async () => {
  const { data } = await api.get(ENDPOINTS.ROLES);
  return data;
};

export const obtenerPermisos = async () => {
  const { data } = await api.get(
    `${ENDPOINTS.ROLES}/permisos`
  );

  return data;
};

export const obtenerPermisosRol = async (idRol) => {
  const { data } = await api.get(
    `${ENDPOINTS.ROLES}/${idRol}/permisos`
  );

  return data;
};

export const actualizarPermisosRol = async (
  idRol,
  permisos
) => {
  const { data } = await api.put(
    `${ENDPOINTS.ROLES}/${idRol}/permisos`,
    {
      permisos
    }
  );

  return data;
};