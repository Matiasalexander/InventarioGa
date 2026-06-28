import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerProcesadores = async () => {
  const { data } = await api.get(ENDPOINTS.PROCESADORES);
  return data;
};

export const crearProcesador = async (procesador) => {
  const { data } = await api.post(ENDPOINTS.PROCESADORES, procesador);
  return data;
};

export const actualizarProcesador = async (id, procesador) => {
  const { data } = await api.put(`${ENDPOINTS.PROCESADORES}/${id}`, procesador);
  return data;
};

export const eliminarProcesador = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.PROCESADORES}/${id}`);
  return data;
};
