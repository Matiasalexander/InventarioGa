import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerUsuarios = async () => {
  const { data } = await api.get(ENDPOINTS.USUARIOS);
  return data;
};

export const crearUsuario = async (usuario) => {
  const { data } = await api.post(
    ENDPOINTS.USUARIOS,
    usuario
  );

  return data;
};

export const actualizarUsuario = async (
  idUsuario,
  usuario
) => {
  const { data } = await api.put(
    `${ENDPOINTS.USUARIOS}/${idUsuario}`,
    usuario
  );

  return data;
};

export const cambiarPasswordUsuario = async (
  idUsuario,
  Password
) => {
  const { data } = await api.put(
    `${ENDPOINTS.USUARIOS}/${idUsuario}/password`,
    {
      Password
    }
  );

  return data;
};

export const eliminarUsuario = async (idUsuario) => {
  const { data } = await api.delete(
    `${ENDPOINTS.USUARIOS}/${idUsuario}`
  );

  return data;
};

/*
  Obtiene:
  - Datos básicos del usuario
  - VerTodasUnidades
  - Unidades asignadas
*/
export const obtenerUnidadesUsuario = async (
  idUsuario
) => {
  const { data } = await api.get(
    `${ENDPOINTS.USUARIOS}/${idUsuario}/unidades`
  );

  return data;
};

/*
  Reemplaza completamente las unidades asignadas.
*/
export const actualizarUnidadesUsuario = async (
  idUsuario,
  configuracion
) => {
  const { data } = await api.put(
    `${ENDPOINTS.USUARIOS}/${idUsuario}/unidades`,
    configuracion
  );

  return data;
};