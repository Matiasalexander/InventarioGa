import api from "../api/axios";
import ENDPOINTS from "../config/endpoints";

export const obtenerInventario = async (unidad = null) => {
  const params = {};

  if (unidad) {
    params.unidad = unidad;
  }

  const { data } = await api.get(ENDPOINTS.INVENTARIO, { params });
  return data;
};

export const obtenerInventarioPorId = async (id) => {
  const { data } = await api.get(`${ENDPOINTS.INVENTARIO}/${id}`);
  return data;
};

export const crearInventario = async (equipo) => {
  const { data } = await api.post(ENDPOINTS.INVENTARIO, equipo);
  return data;
};

export const actualizarInventario = async (id, equipo) => {
  const { data } = await api.put(`${ENDPOINTS.INVENTARIO}/${id}`, equipo);
  return data;
};

export const eliminarInventario = async (id) => {
  const { data } = await api.delete(`${ENDPOINTS.INVENTARIO}/${id}`);
  return data;
};
export const exportarInventarioExcel = async (unidad = null) => {
  const params = {};

  if (unidad) {
    params.unidad = unidad;
  }

  const response = await api.get(`${ENDPOINTS.INVENTARIO}/exportar-excel`, {
    params,
    responseType: "blob",
  });

  return response.data;
};