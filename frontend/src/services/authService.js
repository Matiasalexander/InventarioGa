import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const login = async (correo, password) => {
  const { data } = await api.post(`${ENDPOINTS.AUTH}/login`, {
    correo,
    password
  });

  return data;
};

export const olvidePassword = async (correo) => {
  const { data } = await api.post(`${ENDPOINTS.AUTH}/olvide-password`, {
    correo
  });

  return data;
};

export const resetPassword = async (correo, codigo, nuevaPassword) => {
  const { data } = await api.post(`${ENDPOINTS.AUTH}/reset-password`, {
    correo,
    codigo,
    nuevaPassword
  });

  return data;
};