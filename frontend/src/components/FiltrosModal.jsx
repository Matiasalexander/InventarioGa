import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "../styles/FiltrosModal.css";

const FiltrosModal = ({
  abierto,
  onCerrar,
  onMostrarTodos,

  arbolUnidades,
  restauranteSeleccionado,
  handleRestauranteChange,

  localidadesDisponibles,
  unidadSeleccionada,
  handleLocalidadChange,

  filtros,
  setFiltros,

  tiposEquipo,
  marcas,
  estatusDisponibles,
  estadosFisicos,

  onLimpiarFiltros,
  onLimpiarFiltrosSecundarios
}) => {
  if (!abierto) return null;

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleMostrarTodos = async () => {
    await onMostrarTodos();
    onCerrar();
  };

  return createPortal(
    <div
      className="filtros-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCerrar();
        }
      }}
    >
      <div
        className="filtros-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filtros-modal-title"
      >
        <div className="filtros-modal-header">
          <div>
            <h2 id="filtros-modal-title">
              Filtros de inventario
            </h2>

            <p>
              Selecciona una unidad y refina los equipos mostrados.
            </p>
          </div>

          <button
            type="button"
            className="filtros-modal-close"
            onClick={onCerrar}
            aria-label="Cerrar filtros"
          >
            <X size={20} />
          </button>
        </div>

        <div className="filtros-modal-body">
          <div className="filtros-modal-grid">

            {/* Restaurante */}
            <div className="filtros-modal-field">
              <label>Restaurante</label>

              <select
                value={restauranteSeleccionado}
                onChange={handleRestauranteChange}
              >
                <option value="">
                  Todos los restaurantes
                </option>

                {arbolUnidades.map((restaurante) => (
                  <option
                    key={restaurante.id}
                    value={restaurante.id}
                  >
                    {restaurante.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Localidad */}
            <div className="filtros-modal-field">
              <label>Localidad</label>

              <select
                value={unidadSeleccionada || ""}
                onChange={handleLocalidadChange}
                disabled={!restauranteSeleccionado}
              >
                <option value="">
                  Todas las localidades
                </option>

                {localidadesDisponibles.map((localidad) => (
                  <option
                    key={localidad.id}
                    value={localidad.id}
                  >
                    {localidad.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div className="filtros-modal-field">
              <label>Tipo de equipo</label>

              <select
                value={filtros.tipoEquipo}
                onChange={(e) =>
                  cambiarFiltro(
                    "tipoEquipo",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todos los tipos
                </option>

                {tiposEquipo.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Marca */}
            <div className="filtros-modal-field">
              <label>Marca</label>

              <select
                value={filtros.marca}
                onChange={(e) =>
                  cambiarFiltro(
                    "marca",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todas las marcas
                </option>

                {marcas.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            {/* Estatus */}
            <div className="filtros-modal-field">
              <label>Estatus</label>

              <select
                value={filtros.estatus}
                onChange={(e) =>
                  cambiarFiltro(
                    "estatus",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todos los estatus
                </option>

                {estatusDisponibles.map((estatus) => (
                  <option key={estatus} value={estatus}>
                    {estatus}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado físico */}
            <div className="filtros-modal-field">
              <label>Estado físico</label>

              <select
                value={filtros.estadoFisico}
                onChange={(e) =>
                  cambiarFiltro(
                    "estadoFisico",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todos los estados
                </option>

                {estadosFisicos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsiva */}
            <div className="filtros-modal-field">
              <label>Responsiva</label>

              <select
                value={filtros.responsiva}
                onChange={(e) =>
                  cambiarFiltro(
                    "responsiva",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todos
                </option>

                <option value="asignado">
                  Con responsiva
                </option>

                <option value="disponible">
                  Sin responsiva
                </option>
              </select>
            </div>

          </div>
        </div>

        <div className="filtros-modal-actions">
          <button
            type="button"
            className="filtros-modal-btn-secondary"
            onClick={onLimpiarFiltrosSecundarios}
          >
            Limpiar filtros secundarios
          </button>

          <button
            type="button"
            className="filtros-modal-btn-danger"
            onClick={handleMostrarTodos}
          >
            Limpiar todo
          </button>

          <button
            type="button"
            className="filtros-modal-btn-primary"
            onClick={onCerrar}
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FiltrosModal;