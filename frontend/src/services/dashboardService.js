import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerDashboard = async () => {
  const { data } = await api.get(ENDPOINTS.DASHBOARD);
  return data;
};