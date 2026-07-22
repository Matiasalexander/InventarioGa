import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerInventarioPorId } from "../services/inventarioService";
import { obtenerCatalogos } from "../services/catalogosService";
import { obtenerHistorialResponsivasPorEquipo } from "../services/responsivaService";
import "../styles/InventarioDetallePage.css";

function InventarioDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equipo, setEquipo] = useState(null);
  const [responsivasEquipo, setResponsivasEquipo] = useState({
    activa: null,
    historial: []
  });
  const [error, setError] = useState("");
  const [departamentos, setDepartamentos] = useState([]);
  const [procesadores, setProcesadores] = useState([]);
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [estatus, setEstatus] = useState([]);
  const [memoriasRam, setMemoriasRam] = useState([]);
const [discosDuros, setDiscosDuros] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await obtenerInventarioPorId(id);
        setEquipo(data);

        const catalogos = await obtenerCatalogos();

        setProcesadores(catalogos.procesadores || []);
        setDepartamentos(catalogos.departamentos || []);
        setTiposEquipo(catalogos.tiposEquipo || []);
        setMarcas(catalogos.marcas || []);
        setEstatus(catalogos.estatus || []);
        setMemoriasRam(catalogos.memoriasRam || []);
        setDiscosDuros(catalogos.discoDuro || []);

        const dataResp = await obtenerHistorialResponsivasPorEquipo(id);

        setResponsivasEquipo({
          activa: dataResp.activa || null,
          historial: dataResp.historial || []
        });
      } catch (error) {
        console.error(error);
        setError("No se pudo cargar la información");
      }
    };

    cargarDatos();
  }, [id]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";

    return new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  const mostrar = (valor) => {
    return valor !== null && valor !== undefined && valor !== "" ? valor : "N/A";
  };

  if (error) {
    return (
      <div className="contenedor">
        <div className="card">
          <h2>{error}</h2>
          <button type="button" onClick={() => navigate("/inventario")}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="contenedor">
        <div className="card">
          <h2>Cargando...</h2>
        </div>
      </div>
    );
  }

  const procesador = procesadores.find(
    (item) => Number(item.id) === Number(equipo.ID_PROCESADOR)
  );

  const departamento = departamentos.find(
    (item) => Number(item.Id) === Number(equipo.ID_DEPARTAMENTO)
  );

  const tipoEquipo = tiposEquipo.find(
    (item) => Number(item.id) === Number(equipo.ID_TIPO_EQUIPO)
  );

  const marca = marcas.find(
    (item) => Number(item.id) === Number(equipo.ID_MARCA)
  );

  const estatusEquipo = estatus.find(
    (item) => Number(item.Id) === Number(equipo.ID_ESTATUS)
  );
const memoriaRam = memoriasRam.find(
  (item) => Number(item.id) === Number(equipo.ID_RAM)
);

const discoDuro = discosDuros.find(
  (item) => Number(item.id) === Number(equipo.ID_DISCO)
);

  {/*Telefono*/}
  const esTelefono = Number(equipo.ID_TIPO_EQUIPO) === 15;
  {/*Equipos con SO*/}
  const esLaptop = Number(equipo.ID_TIPO_EQUIPO) === 1;
  const esDesktop = Number(equipo.ID_TIPO_EQUIPO) === 2;
  const esTablet = Number(equipo.ID_TIPO_EQUIPO) === 14;  

  {/*Equipos POS*/}
  const esPantallaPOS = Number(equipo.ID_TIPO_EQUIPO) === 4;
  const esWorkstationpos = Number(equipo.ID_TIPO_EQUIPO) === 7;
  const esTabletPOS = Number(equipo.ID_TIPO_EQUIPO) === 13;

  {/*Equipos que llevan IP*/}
  const  esSwitch = Number(equipo.ID_TIPO_EQUIPO) === 17;
  const esAPS = Number(equipo.ID_TIPO_EQUIPO) === 19;
  const esCCTV = Number(equipo.ID_TIPO_EQUIPO) === 20;

    {/*IMPRESORAS*/}
  const esImpresora = Number(equipo.ID_TIPO_EQUIPO) === 3;

  {/*CONST PARA ANEXAR EQUIPOS CON IP*/}
    const mostrarIP =
  esSwitch ||
  esAPS ||
  esCCTV ||
  esTabletPOS ||
  esWorkstationpos ||
  (esImpresora && equipo.CONEXION === "wifi");
  {/*Herramientas en general*/}

  return (
    <div className="contenedor">
      <div className="header">
        <div>
          {
            equipo.NOMBRE_EQUIPO == "NA" ? (
              <h1>{equipo.UBICACION}</h1>
            ):(
              <h1>{equipo.NOMBRE_EQUIPO}</h1>
            )
          }
          <p>Detalle del equipo</p>
        </div>

        <button type="button" onClick={() => navigate("/inventario")}>
          Volver
        </button>
      </div>

      <div className="detalle-grid">
        <div className="card">
          <h2>Responsiva activa</h2>

          {responsivasEquipo.activa ? (
            <>
              <div className="detalle-item">
                <span>No. Responsiva</span>
                <strong>
                  RESP-
                  {String(responsivasEquipo.activa.IdResponsiva).padStart(5, "0")}
                </strong>
              </div>

              <div className="detalle-item">
                <span>Asignado a</span>
                <strong>{responsivasEquipo.activa.NombreReceptor}</strong>
              </div>

              <div className="detalle-item">
                <span>Puesto</span>
                <strong>{responsivasEquipo.activa.Puesto}</strong>
              </div>

              <div className="detalle-item">
                <span>Área</span>
                <strong>{responsivasEquipo.activa.Area || "N/A"}</strong>
              </div>

              <div className="detalle-item">
                <span>Fecha préstamo</span>
                <strong>{formatearFecha(responsivasEquipo.activa.Fecha)}</strong>
              </div>

              <button
                type="button"
                onClick={() => navigate("/responsivas/historial")}
              >
                Ver historial
              </button>
            </>
          ) : (
            <>
              <div className="detalle-item">
                <span>Estado</span>
                <strong>Disponible</strong>
              </div>

              <div className="detalle-item">
                <span>Responsiva digital</span>
                <strong>No</strong>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2>Información general</h2>

          <div className="detalle-item">
            <span>Tipo de equipo</span>
            <strong>{tipoEquipo?.tequipo || "N/A"}</strong>
          </div>

          <div className="detalle-item">
            <span>Localidad</span>
            <strong>{mostrar(equipo.LOCALIDAD)}</strong>
          </div>

          <div className="detalle-item">
            <span>Ubicación</span>
            <strong>{mostrar(equipo.UBICACION)}</strong>
          </div>

          <div className="detalle-item">
            <span>Departamento</span>
            <strong>{departamento?.Nombre_departamento || "N/A"}</strong>
          </div>

          <div className="detalle-item">
            <span>Puesto</span>
            <strong>{mostrar(equipo.PUESTO)}</strong>
          </div>

          <div className="detalle-item">
            <span>Correo: </span>
            <strong>{mostrar(equipo.CORREO)}</strong>
          </div>
        </div>

        <div className="card">
          <h2>Identificación</h2>

          <div className="detalle-item">
            <span>Serial</span>
            <strong>{mostrar(equipo.SERIAL)}</strong>
          </div>

          <div className="detalle-item">
            <span>Marca</span>
            <strong>{marca?.Marca || "N/A"}</strong>
          </div>

          <div className="detalle-item">
            <span>Modelo</span>
            <strong>{mostrar(equipo.MODELO)}</strong>
          </div>

          <div className="detalle-item">
            <span>Sistema operativo</span>
            <strong>{mostrar(equipo.SISTEMA_OPERATIVO)}</strong>
          </div>
        </div>

        <div className="card">
          <h2>Fechas y garantía</h2>

          <div className="detalle-item">
            <span>Fecha fabricación</span>
            <strong>{formatearFecha(equipo.FECHA_FABRICACION)}</strong>
          </div>

          <div className="detalle-item">
            <span>Fecha inicio garantía</span>
            <strong>{formatearFecha(equipo.FECHA_GARANTIA)}</strong>
          </div>

          <div className="detalle-item">
            <span>Fecha inicio uso</span>
            <strong>{formatearFecha(equipo.FECHA_INICIO)}</strong>
          </div>

          <div className="detalle-item">
            <span>Fecha registro</span>
            <strong>{formatearFecha(equipo.FECHA_REGISTRO)}</strong>
          </div>

          <div className="detalle-item">
            <span>Tiempo de uso</span>
            <strong>
              {equipo.Auso !== null && equipo.Auso !== undefined
                ? `${equipo.Auso} días`
                : "N/A"}
            </strong>
          </div>

          <div className="detalle-item">
            <span>Garantía restante</span>
            <strong>
              {equipo.Grestante !== null && equipo.Grestante !== undefined
                ? `${equipo.Grestante} días`
                : "N/A"}
            </strong>
          </div>
        </div>

        {(esLaptop || esDesktop) && (
          <div className="card">
            <h2>Hardware</h2>

            <div className="detalle-item">
              <span>Procesador</span>
              <strong>{procesador?.Nombre || "N/A"}</strong>
            </div>

            <div className="detalle-item">
              <span>Modelo procesador</span>
              <strong>{mostrar(equipo.MODELO_PROCESADOR)}</strong>
            </div>

<div className="detalle-item">
  <span>RAM</span>
  <strong>{memoriaRam?.capacidad || "N/A"}</strong>
</div>

<div className="detalle-item">
  <span>Disco duro</span>
  <strong>
    {discoDuro
      ? `${discoDuro.modelo_disco} ${discoDuro.capacidad}`
      : "N/A"}
  </strong>
</div>

            <div className="detalle-item">
              <span>Lector de huella</span>
              <strong>{mostrar(equipo.LECTOR_DE_HUELLA)}</strong>
            </div>
          </div>
        )}

        {mostrarIP && (
          <div className="card">

            {
             equipo.tipoEquipo === "Impresora" ?(
              <h2>Impresora</h2>
             ) : (
              <h2>Red</h2>
             )
            }
            <div className="detalle-item">
              <span>Tipo impresora</span>
              <strong>{mostrar(equipo.TIPO_IMPRESORA)}</strong>
            </div>

            <div className="detalle-item">
              <span>Conexión</span>
              <strong>{mostrar(equipo.CONEXION)}</strong>
            </div>

            <div className="detalle-item">
              <span>IP</span>
              <strong>{mostrar(equipo.IP)}</strong>
            </div>

            <div className="detalle-item">
              <span>Puerto</span>
              <strong>{mostrar(equipo.PUERTO)}</strong>
            </div>
          </div>
        )}

        {(esPantallaPOS || esWorkstationpos || esTabletPOS)  && (
          <div className="card">
            <h2>Accesos remotos</h2>

            <div className="detalle-item">
              <span>Acceso TeamViewer</span>
              <strong>{mostrar(equipo.ACCESO_TEAM_VIEWER)}</strong>
            </div>

            <div className="detalle-item">
              <span>Contraseña TeamViewer</span>
              <strong>{mostrar(equipo.CONTRASEÑA_TEAM_VIEWER)}</strong>
            </div>

            <div className="detalle-item">
              <span>Acceso AnyDesk</span>
              <strong>{mostrar(equipo.ACCESO_ANYDESK)}</strong>
            </div>

            <div className="detalle-item">
              <span>Contraseña AnyDesk</span>
              <strong>{mostrar(equipo.CONTRASEÑA_ANYDESK)}</strong>
            </div>
          </div>
        )}

        <div className="card">
          <h2>Estado</h2>

          <div className="detalle-item">
            <span>Estatus</span>
            <strong>{estatusEquipo?.Estatus_equipo || "N/A"}</strong>
          </div>

          <div className="detalle-item">
            <span>Estado físico</span>
            <strong>{mostrar(equipo.ESTADO_FISICO)}</strong>
          </div>

          <div className="detalle-item">
            <span>Responsiva digital</span>
            <strong>{equipo.RESPONSIVA_DIGITAL ? "Sí" : "No"}</strong>
          </div>

          <div className="detalle-item">
            <span>Número responsiva</span>
            <strong>
              {equipo.NUM_RESPONSIVA
                ? `RESP-${String(equipo.NUM_RESPONSIVA).padStart(5, "0")}`
                : "N/A"}
            </strong>
          </div>
        </div>

        <div className="card">
          <h2>Historial de responsivas</h2>

          {responsivasEquipo.historial.length === 0 ? (
            <p className="comentario">Sin historial de responsivas.</p>
          ) : (
            responsivasEquipo.historial.map((item) => (
              <div className="detalle-item" key={item.IdDetalle}>
                <span>
                  RESP-{String(item.IdResponsiva).padStart(5, "0")}
                </span>
                <strong>
                  {item.NombreReceptor} /{" "}
                  {item.Devuelto ? "Devuelto" : "Activo"}
                </strong>
              </div>
            ))
          )}
        </div>

        <div className="card card-foto">
          <h2>Foto del equipo</h2>
                    {equipo.FOTO && (
        <div className="contenedor-foto-detalle">
            <img
        src={`data:image/png;base64,${equipo.FOTO}`}
        alt="Equipo"
        width={250}
        height={250}
        className="foto-equipo"
            />
            </div>
          )}
        </div>
        <div className="card">

          <h2>Comentarios</h2>

          <p className="comentario">
            {equipo.COMENTARIO || "Sin comentarios registrados."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default InventarioDetallePage;