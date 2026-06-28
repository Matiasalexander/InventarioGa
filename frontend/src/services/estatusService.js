import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerEstatus = async () => {
  const { data } = await api.get(ENDPOINTS.ESTATUS);
  return data;
};

export const crearEstatus = async (estatus) => {
  const { data } = await api.post(ENDPOINTS.ESTATUS, estatus);
  return data;
};

export const actualizarEstatus = async (id, estatus) => {
  const { data } = await api.put(`${ENDPOINTS.ESTATUS}/${id}`, estatus);
  return data;
};

export const eliminarEstatus = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.ESTATUS}/${id}`);
  return data;
};
