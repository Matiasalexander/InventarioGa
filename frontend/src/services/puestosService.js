import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerPuestos = async () => {
  const { data } = await api.get(ENDPOINTS.PUESTOS);
  return data;
};

export const crearPuesto = async (puesto) => {
  const { data } = await api.post(ENDPOINTS.PUESTOS, puesto);
  return data;
};

export const actualizarPuesto = async (id, puesto) => {
  const { data } = await api.put(`${ENDPOINTS.PUESTOS}/${id}`, puesto);
  return data;
};

export const eliminarPuesto = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.PUESTOS}/${id}`);
  return data;
};
