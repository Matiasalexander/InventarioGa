import axios from "axios";

const API_URL = "http://localhost:3001/api/modesp";

export const obtenerModesp = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const crearModesp = async (modelo) => {
  const response = await axios.post(API_URL, modelo);
  return response.data;
};

export const actualizarModesp = async (id, modelo) => {
  const response = await axios.put(`${API_URL}/${id}`, modelo);
  return response.data;
};

export const eliminarModesp = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};