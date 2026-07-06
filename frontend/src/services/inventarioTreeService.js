import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const obtenerArbolUnidades = async () => {
  const { data } = await axios.get(`${API}/inventario/arbol-unidades`);
  return data;
};