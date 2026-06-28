import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerModelosProcesador = async () => {
  const { data } = await api.get(ENDPOINTS.MODELOS_PROCESADOR);
  return data;
};

export const crearModeloProcesador = async (modelo) => {
  const { data } = await api.post(ENDPOINTS.MODELOS_PROCESADOR, modelo);
  return data;
};

export const actualizarModeloProcesador = async (id, modelo) => {
  const { data } = await api.put(`${ENDPOINTS.MODELOS_PROCESADOR}/${id}`, modelo);
  return data;
};

export const eliminarModeloProcesador = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.MODELOS_PROCESADOR}/${id}`);
  return data;
};
