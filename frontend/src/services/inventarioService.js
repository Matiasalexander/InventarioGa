import axios from "axios";

const API_URL = "http://localhost:3001/api/inventario";

export const obtenerInventario = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};
export const crearInventario = async (equipo) => {
  const response = await axios.post(API_URL, equipo);
  return response.data;
};