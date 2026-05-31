import axios from "axios";

const API_URL = "http://localhost:3001/api/marcas";

export const obtenerMarcas = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const obtenerMarcaPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const crearMarca = async (marca) => {
  const response = await axios.post(API_URL, marca);
  return response.data;
};

export const actualizarMarca = async (id, marca) => {
  const response = await axios.put(`${API_URL}/${id}`, marca);
  return response.data;
};

export const eliminarMarca = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};