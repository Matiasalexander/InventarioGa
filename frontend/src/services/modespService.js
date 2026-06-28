import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerModesp = async () => {
  const { data } = await api.get(ENDPOINTS.MODESP);
  return data;
};

export const crearModesp = async (modelo) => {
  const { data } = await api.post(ENDPOINTS.MODESP, modelo);
  return data;
};

export const actualizarModesp = async (id, modelo) => {
  const { data } = await api.put(`${ENDPOINTS.MODESP}/${id}`, modelo);
  return data;
};

export const eliminarModesp = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.MODESP}/${id}`);
  return data;
};
