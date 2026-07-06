import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerArbolUnidades = async () => {
  const { data } = await api.get(`${ENDPOINTS.INVENTARIO}/arbol-unidades`);
  return data;
};