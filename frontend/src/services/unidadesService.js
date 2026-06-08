import axios from "axios";

const API_URL = "http://localhost:3001/api/unidades";

export const obtenerUnidades = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const crearUnidad = async (unidad) => {
  const response = await axios.post(API_URL, unidad);
  return response.data;
};

export const actualizarUnidad = async (id, unidad) => {
  const response = await axios.put(`${API_URL}/${id}`, unidad);
  return response.data;
};

export const eliminarUnidad = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};