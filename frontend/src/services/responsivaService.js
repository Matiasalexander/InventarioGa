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

export const crearResponsiva = async (payload) => {
  const { data } = await api.post(
    ENDPOINTS.RESPONSIVA,
    payload
  );

  return data;
};

export const actualizarResponsiva = async (id, payload) => {
  const { data } = await api.put(
    `${ENDPOINTS.RESPONSIVA}/${id}`,
    payload
  );

  return data;
};

export const reenviarResponsiva = async (id) => {
  const { data } = await api.post(
    `${ENDPOINTS.RESPONSIVA}/${id}/enviar`
  );

  return data;
};

export const descargarResponsivaPDF = async (id, folio) => {

  const response = await api.get(
    `${ENDPOINTS.RESPONSIVA}/${id}/pdf`,
    {
      responseType: "blob"
    }
  );

  const url = window.URL.createObjectURL(response.data);

  const link = document.createElement("a");

  link.href = url;

  link.download = `${folio}.pdf`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);

};

export const obtenerEquiposDisponibles = async () => {
  const { data } = await api.get(
    `${ENDPOINTS.RESPONSIVA}/equipos/disponibles`
  );

  return data;
};

export const marcarEquipoDevuelto = async (
  idDetalle,
  ComentariosDevolucion
) => {

  const { data } = await api.put(
    `${ENDPOINTS.RESPONSIVA}/detalle/${idDetalle}/devolver`,
    {
      ComentariosDevolucion
    }
  );

  return data;

};