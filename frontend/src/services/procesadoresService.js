import axios from "axios";

const API_URL = "http://localhost:3001/api/procesadores";

export const obtenerProcesadores = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const crearProcesador = async (procesador) => {
  const response = await axios.post(API_URL, procesador);
  return response.data;
};

export const actualizarProcesador = async (id, procesador) => {
  const response = await axios.put(`${API_URL}/${id}`, procesador);
  return response.data;
};

export const eliminarProcesador = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};