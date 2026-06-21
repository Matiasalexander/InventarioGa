import axios from "axios";

const API_URL = "http://localhost:3001/api/modelos-procesador";

export const obtenerModelosProcesador = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const crearModeloProcesador = async (modelo) => {
  const response = await axios.post(API_URL, modelo);
  return response.data;
};

export const actualizarModeloProcesador = async (id, modelo) => {
  const response = await axios.put(`${API_URL}/${id}`, modelo);
  return response.data;
};

export const eliminarModeloProcesador = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};