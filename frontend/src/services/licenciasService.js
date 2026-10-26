
import axios from "axios";

const apiLicencias = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

apiLicencias.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const obtenerLicencias = async (estado = "") => {
  const response = await apiLicencias.get("/api/licencias", {
    params: estado ? { estado } : {}
  });

  return response.data;
};

export const obtenerTiposLicencia = async () => {
  const response = await apiLicencias.get("/api/licencias/tipos");
  return response.data;
};

export const obtenerOpcionesLicencias = async () => {
  const response = await apiLicencias.get("/api/licencias/opciones");
  return response.data;
};
