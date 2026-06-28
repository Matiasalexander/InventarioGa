import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerDepartamentos = async () => {
  const { data } = await api.get(ENDPOINTS.DEPARTAMENTOS);
  return data;
};

export const crearDepartamento = async (departamento) => {
  const { data } = await api.post(ENDPOINTS.DEPARTAMENTOS, departamento);
  return data;
};

export const actualizarDepartamento = async (id, departamento) => {
  const { data } = await api.put(`${ENDPOINTS.DEPARTAMENTOS}/${id}`, departamento);
  return data;
};

export const eliminarDepartamento = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.DEPARTAMENTOS}/${id}`);
  return data;
};
