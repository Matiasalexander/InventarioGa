import axios from "axios";

const API_URL = "http://localhost:3001/api/puestos";

export const obtenerPuestos = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const crearPuesto = async (puesto) => {
  const response = await axios.post(API_URL, puesto);
  return response.data;
};

export const actualizarPuesto = async (id, puesto) => {
  const response = await axios.put(`${API_URL}/${id}`, puesto);
  return response.data;
};

export const eliminarPuesto = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};