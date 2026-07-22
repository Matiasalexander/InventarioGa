import api from "../api/axios";

export const obtenerRoles = async () => {
  const { data } = await api.get("/roles");
  return data;
};

export const obtenerPermisos = async () => {
  const { data } = await api.get("/roles/permisos");
  return data;
};

export const obtenerPermisosRol = async (idRol) => {
  const { data } = await api.get(
    `/roles/${idRol}/permisos`
  );

  return data;
};

export const actualizarPermisosRol = async (
  idRol,
  permisos
) => {
  const { data } = await api.put(
    `/roles/${idRol}/permisos`,
    {
      permisos
    }
  );

  return data;
};