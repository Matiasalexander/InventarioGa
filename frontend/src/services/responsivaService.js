import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerResponsivas = async () => {
  const { data } = await api.get(ENDPOINTS.RESPONSIVA);
  return data;
};

export const obtenerResponsivaPorId = async (id) => {
  const { data } = await api.get(`${ENDPOINTS.RESPONSIVA}/${id}`);
  return data;
};

export const obtenerEquiposDisponibles = async () => {
  const { data } = await api.get(
    `${ENDPOINTS.RESPONSIVA}/equipos/disponibles`
  );

  return data;
};

export const obtenerHistorialResponsivasPorEquipo = async (idInventario) => {
  const { data } = await api.get(
    `${ENDPOINTS.RESPONSIVA}/equipo/${idInventario}/historial`
  );

  return data;
};

export const crearResponsiva = async (responsiva) => {
  const { data } = await api.post(ENDPOINTS.RESPONSIVA, responsiva);
  return data;
};

export const generarPDFResponsiva = async (payload) => {
  const response = await api.post(`${ENDPOINTS.RESPONSIVA}/pdf`, payload, {
    responseType: "blob"
  });

  return response.data;
};

export const marcarEquipoDevuelto = async (idDetalle, ComentariosDevolucion) => {
  const { data } = await api.put(
    `${ENDPOINTS.RESPONSIVA}/detalle/${idDetalle}/devolver`,
    {
      ComentariosDevolucion
    }
  );

  return data;
};

export const eliminarResponsiva = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.RESPONSIVA}/${id}`);
  return data;
};