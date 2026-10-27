
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

export const crearLicencia = async(datos)=> {
    const response = await apiLicencias.post("/api/licencias", datos);
    return response.data;
};

//SERIVICIO PARA LA ALTA DE EQUIPOS

export const obtenerLicenciasDisponibles = async () => {
  const response = await apiLicencias.get(
    "/api/licencias/disponibles"
  );

  return response.data.licencias;
};

export const asignarLicenciaAEquipo = async (
  idLicencia,
  idEquipo
) => {
  const response = await apiLicencias.post(
    `/api/licencias/${idLicencia}/asignar`,
    {
      ID_EQUIPO: idEquipo
    }
  );

  return response.data;
};


export const obtenerLicenciasPorEquipo = async (idEquipo) => {
  const response = await apiLicencias.get(
    `/api/licencias/equipo/${idEquipo}`
  );

  return response.data;
};

