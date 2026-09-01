import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerSistemasOperativos = async () => {
  const response = await api.get(ENDPOINTS.SISTEMAS_OPERATIVOS);
  return response.data;
};

export const crearSistemaOperativo = async (datos) => {
  const response = await api.post(
    ENDPOINTS.SISTEMAS_OPERATIVOS,
    datos
  );

  return response.data;
};

export const actualizarSistemaOperativo = async (id, datos) => {
  const response = await api.put(
    `${ENDPOINTS.SISTEMAS_OPERATIVOS}/${id}`,
    datos
  );

  return response.data;
};

export const eliminarSistemaOperativo = async (id) => {
  const response = await api.delete(
    `${ENDPOINTS.SISTEMAS_OPERATIVOS}/${id}`
  );

  return response.data;
};