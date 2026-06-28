import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerTiposEquipo = async () => {
  const { data } = await api.get(ENDPOINTS.TIPO_EQUIPO);
  return data;
};

export const obtenerTipoEquipoPorId = async (id) => {
  const { data } = await api.get(`${ENDPOINTS.TIPO_EQUIPO}/${id}`);
  return data;
};

export const crearTipoEquipo = async (tipoEquipo) => {
  const { data } = await api.post(ENDPOINTS.TIPO_EQUIPO, tipoEquipo);
  return data;
};

export const actualizarTipoEquipo = async (id, tipoEquipo) => {
  const { data } = await api.put(`${ENDPOINTS.TIPO_EQUIPO}/${id}`, tipoEquipo);
  return data;
};

export const eliminarTipoEquipo = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.TIPO_EQUIPO}/${id}`);
  return data;
};
