import axios from "axios";

const API_URL = "http://localhost:3001/api/restaurantes";

export const obtenerRestaurantes = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const obtenerRestaurantePorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const crearRestaurante = async (restaurante) => {
  const response = await axios.post(API_URL, restaurante);
  return response.data;
};

export const actualizarRestaurante = async (id, restaurante) => {
  const response = await axios.put(`${API_URL}/${id}`, restaurante);
  return response.data;
};

export const eliminarRestaurante = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};