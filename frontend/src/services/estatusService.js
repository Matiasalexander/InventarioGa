import axios from "axios";

const API_URL = "http://localhost:3001/api/estatus";

export const obtenerEstatus = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const crearEstatus = async (estatus) => {
  const response = await axios.post(API_URL, estatus);
  return response.data;
};

export const actualizarEstatus = async (id, estatus) => {
  const response = await axios.put(`${API_URL}/${id}`, estatus);
  return response.data;
};

export const eliminarEstatus = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};