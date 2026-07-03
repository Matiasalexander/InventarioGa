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
  const { data } = await api.get(`${ENDPOINTS.RESPONSIVA}/equipos/disponibles`);
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

export const actualizarResponsiva = async (id, responsiva) => {
  const { data } = await api.put(`${ENDPOINTS.RESPONSIVA}/${id}`, responsiva);
  return data;
};

export const reenviarResponsiva = async (id) => {
  const { data } = await api.post(`${ENDPOINTS.RESPONSIVA}/${id}/enviar`);
  return data;
};

export const generarPDFResponsiva = async (payload) => {
  const response = await api.post(`${ENDPOINTS.RESPONSIVA}/pdf`, payload, {
    responseType: "blob"
  });

  return response.data;
};

export const descargarResponsivaPDF = async (id, folio = null) => {
  const response = await api.get(`${ENDPOINTS.RESPONSIVA}/${id}/pdf`, {
    responseType: "blob"
  });

  const url = window.URL.createObjectURL(
    new Blob([response.data], { type: "application/pdf" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = `${folio || `RESP-${String(id).padStart(5, "0")}`}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

export const marcarEquipoDevuelto = async (idDetalle, ComentariosDevolucion) => {
  const { data } = await api.put(
    `${ENDPOINTS.RESPONSIVA}/detalle/${idDetalle}/devolver`,
    { ComentariosDevolucion }
  );

  return data;
};

export const eliminarResponsiva = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.RESPONSIVA}/${id}`);
  return data;
};