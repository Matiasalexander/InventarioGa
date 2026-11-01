
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

export const obtenerEquiposDeLicencia = async (idLicencia) => {
  const respuesta = await apiLicencias.get(
    `/api/licencias/${idLicencia}/equipos`
  );

  return respuesta.data;
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



export const liberarLicenciaDeEquipo = async (
  idLicencia,
  idEquipo = null
) => {
  const datos = idEquipo == null
    ? {}
    : { ID_EQUIPO: Number(idEquipo) };

  const respuesta = await apiLicencias.post(
    `/api/licencias/${idLicencia}/liberar`,
    datos
  );

  return respuesta.data;
};


//OBTENER DETALLES DE LA LICENCIA
export const obtenerDetalleLicencia = async (idLicencia) => {
  const response = await apiLicencias.get(
    `/api/licencias/${idLicencia}/detalle`
  );

  return response.data;
};

//EDITAR LICENCIA
export const actualizarLicencia = async (idLicencia, datos) => {
  const response = await apiLicencias.put(
    `/api/licencias/${idLicencia}`,
    datos
  );

  return response.data;
};
