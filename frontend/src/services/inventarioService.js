import axios from "axios";

const API_URL = "http://localhost:3001/api/inventario";

export const obtenerInventario = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};
export const obtenerInventarioPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const crearInventario = async (equipo) => {
  const response = await axios.post(API_URL, equipo);
  return response.data;
};

export const actualizarInventario = async (id, equipo) => {
  const response = await axios.put(`${API_URL}/${id}`, equipo);
  return response.data;
};

export const eliminarInventario = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};