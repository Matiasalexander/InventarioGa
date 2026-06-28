import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerRestaurantes = async () => {
  const { data } = await api.get(ENDPOINTS.RESTAURANTES);
  return data;
};

export const obtenerRestaurantePorId = async (id) => {
  const { data } = await api.get(`${ENDPOINTS.RESTAURANTES}/${id}`);
  return data;
};

export const crearRestaurante = async (restaurante) => {
  const { data } = await api.post(ENDPOINTS.RESTAURANTES, restaurante);
  return data;
};

export const actualizarRestaurante = async (id, restaurante) => {
  const { data } = await api.put(`${ENDPOINTS.RESTAURANTES}/${id}`, restaurante);
  return data;
};

export const eliminarRestaurante = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.RESTAURANTES}/${id}`);
  return data;
};
