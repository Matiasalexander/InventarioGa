import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerMarcas = async () => {
  const { data } = await api.get(ENDPOINTS.MARCAS);
  return data;
};

export const obtenerMarcaPorId = async (id) => {
  const { data } = await api.get(`${ENDPOINTS.MARCAS}/${id}`);
  return data;
};

export const crearMarca = async (marca) => {
  const { data } = await api.post(ENDPOINTS.MARCAS, marca);
  return data;
};

export const actualizarMarca = async (id, marca) => {
  const { data } = await api.put(`${ENDPOINTS.MARCAS}/${id}`, marca);
  return data;
};

export const eliminarMarca = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.MARCAS}/${id}`);
  return data;
};
