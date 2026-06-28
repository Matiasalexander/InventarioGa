import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerCatalogos = async () => {
  const { data } = await api.get(ENDPOINTS.CATALOGOS);
  return data;
};
