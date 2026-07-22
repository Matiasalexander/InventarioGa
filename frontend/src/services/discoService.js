import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerDisco= async () => {
  const { data } = await api.get(ENDPOINTS.DISCO_DURO);
  return data;
};

export const crearDisco = async (disco) => {
  const { data } = await api.post(ENDPOINTS.DISCO_DURO, disco);
  return data;
};

export const actualizarDisco = async (id, disco) => {
  const { data } = await api.put(`${ENDPOINTS.DISCO_DURO}/${id}`, disco);
  return data;
};

export const eliminarDisco = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.DISCO_DURO}/${id}`);
  return data;
};
