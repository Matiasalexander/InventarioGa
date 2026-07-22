import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerRam = async () => {
  const { data } = await api.get(ENDPOINTS.MEMORIA_RAM);
  return data;
};

export const crearRAM = async (ram) => {
  const { data } = await api.post(ENDPOINTS.MEMORIA_RAM, ram);
  return data;
};

export const actualizarRAM = async (id, ram) => {
  const { data } = await api.put(`${ENDPOINTS.MEMORIA_RAM}/${id}`, ram);
  return data;
};

export const eliminarRAM = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.MEMORIA_RAM}/${id}`);
  return data;
};
