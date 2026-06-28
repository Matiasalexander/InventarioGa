import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerModelos = async () => {
  const { data } = await api.get(ENDPOINTS.MODELOS);
  return data;
};

export const crearModelo = async (modelo) => {
  const { data } = await api.post(ENDPOINTS.MODELOS, modelo);
  return data;
};

export const actualizarModelo = async (id, modelo) => {
  const { data } = await api.put(`${ENDPOINTS.MODELOS}/${id}`, modelo);
  return data;
};

export const eliminarModelo = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.MODELOS}/${id}`);
  return data;
};
