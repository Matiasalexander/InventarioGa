import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerUnidades = async () => {
  const { data } = await api.get(ENDPOINTS.UNIDADES);
  return data;
};

export const crearUnidad = async (unidad) => {
  const { data } = await api.post(ENDPOINTS.UNIDADES, unidad);
  return data;
};

export const actualizarUnidad = async (id, unidad) => {
  const { data } = await api.put(`${ENDPOINTS.UNIDADES}/${id}`, unidad);
  return data;
};

export const eliminarUnidad = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.UNIDADES}/${id}`);
  return data;
};
