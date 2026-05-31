import axios from "axios";

const API_URL = "http://localhost:3001/api/tipo-equipo";

export const obtenerTiposEquipo = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const obtenerTipoEquipoPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const crearTipoEquipo = async (tipoEquipo) => {
  const response = await axios.post(API_URL, tipoEquipo);
  return response.data;
};

export const actualizarTipoEquipo = async (id, tipoEquipo) => {
  const response = await axios.put(`${API_URL}/${id}`, tipoEquipo);
  return response.data;
};

export const eliminarTipoEquipo = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};