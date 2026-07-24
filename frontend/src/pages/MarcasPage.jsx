import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  obtenerMarcas,
  crearMarca,
  actualizarMarca,
  eliminarMarca
} from "../services/marcasService";

import { useAuth } from "../context/AuthContext";

import "../styles/InventarioPage.css";
import CatalogoActions from "../components/CatalogoActions";

function MarcasPage({ setLoading }) {
  const [marcas, setMarcas] = useState([]);
  const [marca, setMarca] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const { tienePermiso } = useAuth();

  const puedeVer = tienePermiso("catalogos.ver");
  const puedeCrear = tienePermiso("catalogos.crear");
  const puedeEditar = tienePermiso("catalogos.editar");
  const puedeEliminar = tienePermiso("catalogos.eliminar");

  const cargarMarcas = async () => {
    try {
      setLoading(true);

      const data = await obtenerMarcas();

      setMarcas(data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al cargar listado de marcas"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeVer) {
      cargarMarcas();
    }
  }, [puedeVer]);

  const marcasFiltradas = useMemo(() => {
    const texto = busqueda.toLocaleLowerCase().trim();

    if (!texto) {
      return marcas;
    }

    return marcas.filter((item) =>
      item.Marca
        ?.toLocaleLowerCase()
        .includes(texto)
    );
  }, [busqueda, marcas]);

  const limpiarFormulario = () => {
    setMarca("");
    setModoEdicion(false);
    setIdEditando(null);
  };

  const guardarMarca = async (e) => {
    e.preventDefault();

    if (modoEdicion && !puedeEditar) {
      toast.warning(
        "No tienes permiso para editar marcas."
      );
      return;
    }

    if (!modoEdicion && !puedeCrear) {
      toast.warning(
        "No tienes permiso para crear marcas."
      );
      return;
    }

    if (!marca.trim()) {
      toast.warning("Escribe una marca.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        Marca: marca.trim()
      };

      if (modoEdicion) {
        await actualizarMarca(
          idEditando,
          payload
        );

        toast.success(
          "Marca actualizada correctamente."
        );
      } else {
        await crearMarca(payload);

        toast.success(
          "Marca creada correctamente."
        );
      }

      limpiarFormulario();
      await cargarMarcas();
    } catch (error) {
      console.error(
        "Error guardando marca:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error guardando marca."
      );
    } finally {
      setLoading(false);
    }
  };

  const editarMarca = (item) => {
    if (!puedeEditar) {
      toast.warning(
        "No tienes permiso para editar marcas."
      );
      return;
    }

    setMarca(item.Marca);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  const borrarMarca = async (id) => {
    if (!puedeEliminar) {
      toast.warning(
        "No tienes permiso para eliminar marcas."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas eliminar esta marca?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      await eliminarMarca(id);
      await cargarMarcas();

      toast.success(
        "Marca eliminada correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando marca:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error eliminando marca."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!puedeVer) {
    return null;
  }

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          <h1>Marcas</h1>
          <p>Catálogo de marcas de equipos.</p>
        </div>
      </div>

      {(puedeCrear || (modoEdicion && puedeEditar)) && (
        <div className="card">
          <h2>
            {modoEdicion
              ? "Editar marca"
              : "Agregar marca"}
          </h2>

          <form
            onSubmit={guardarMarca}
            className="form-grid"
          >
            <input
              placeholder="Nombre de la marca"
              value={marca}
              onChange={(e) =>
                setMarca(e.target.value)
              }
            />

            <button type="submit">
              {modoEdicion
                ? "Actualizar marca"
                : "Guardar marca"}
            </button>

            {modoEdicion && (
              <button
                type="button"
                onClick={limpiarFormulario}
              >
                Cancelar
              </button>
            )}
          </form>
        </div>
      )}

      <div className="card">
        <input
          className="search-input-f"
          placeholder="Buscar marca, Ej. Dell"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
        />

        <br />

        <h2>Listado de marcas</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Marca</th>

                {(puedeEditar || puedeEliminar) && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {marcasFiltradas.map((item) => (
                <tr key={item.id}>
                  <td>{item.Marca}</td>

                  {(puedeEditar ||
                    puedeEliminar) && (
                    <td>
                      <CatalogoActions
                        item={item}
                        onEditar={
                          puedeEditar
                            ? editarMarca
                            : null
                        }
                        onEliminar={
                          puedeEliminar
                            ? borrarMarca
                            : null
                        }
                      />
                    </td>
                  )}
                </tr>
              ))}

              {marcasFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      puedeEditar || puedeEliminar
                        ? 2
                        : 1
                    }
                  >
                    No hay marcas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MarcasPage;