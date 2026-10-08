import { useEffect, useMemo, useState, useRef } from "react";

import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import { createPortal } from "react-dom";

import SignatureCanvas from "react-signature-canvas";

import { useAuth } from "../context/AuthContext";

import { CircleArrowLeft, CircleArrowRight, X } from "lucide-react";

import {
  obtenerResponsivas,
  obtenerResponsivaPorId,
  actualizarResponsiva,
  autorizarEdicionFirma,
  actualizarFirmaResponsiva,
  marcarEquipoDevuelto,
  descargarResponsivaPDF,
  reenviarResponsiva,
  obtenerEquiposDisponibles,
  crearResponsiva
} from "../services/responsivaService";

import "../styles/historialResponsivas.css";

import ResponsivasAcciones from "../components/ResponsivasAcciones";

function HistorialResponsivasPage({ setLoading }) {

  const navigate = useNavigate();

const { tienePermiso, usuario } = useAuth();

  const puedeCrear = tienePermiso("responsivas.crear");
  const puedePDF = tienePermiso("responsivas.pdf");
  const puedeEditar = tienePermiso("responsivas.editar");
  const puedeDevolver = tienePermiso("responsivas.devolver");
  const puedeEditarFirma = tienePermiso("responsivas.firma");

const esAdministrador =
  Number(usuario?.IdRol) === 1;

const esSistemas =
  Number(usuario?.IdRol) === 2;

  const [responsivas, setResponsivas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [responsivaSeleccionada, setResponsivaSeleccionada] =
    useState(null);

  const [editando, setEditando] = useState(null);

  // Modo modal
  const [modoModal, setModoModal] = useState(null); // "ver" | "editar"
  const [mostrarModal, setMostrarModal] = useState(false);

  const [busqueda, setBusqueda] = useState("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(20);

  //-----------------------------
  // MODAL NUEVA RESPONSIVA
  //-----------------------------

  const [mostrarNuevaResponsiva, setMostrarNuevaResponsiva] = useState(false);
  const [pasoResponsiva, setPasoResponsiva] = useState(1);

  const [responsivaGuardada, setResponsivaGuardada] = useState(false);
  const [responsivaCreada, setResponsivaCreada] = useState(null);

  const [mensajeModal, setMensajeModal] = useState({
    mostrar: false,
    tipo: "info",
    titulo: "",
    mensaje: ""
  });

  const mostrarMensajeModal = (tipo, titulo, mensaje) => {
    setMensajeModal({
      mostrar: true,
      tipo,
      titulo,
      mensaje
    });
  };

  const cerrarMensajeModal = () => {
    setMensajeModal({
      mostrar: false,
      tipo: "info",
      titulo: "",
      mensaje: ""
    });
  };

  const [fecha, setFecha] = useState("");
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [puesto, setPuesto] = useState("");
  const [area, setArea] = useState("");
  const [correo, setCorreo] = useState("");

  const [equipos, setEquipos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [busquedaEquipo, setBusquedaEquipo] = useState("");

  const sigCanvas = useRef();

  //----------------------------------
  // EDICIÓN DE RESPONSIVA
  //----------------------------------

  const [formEditar, setFormEditar] = useState({
    Fecha: "",
    NombreReceptor: "",
    Puesto: "",
    Area: "",
    Correo: ""
  });

  // Estado del checkbox del administrador
  const [permitirEditarFirma, setPermitirEditarFirma] = useState(false);

  // Firma existente
  const [firmaBase64, setFirmaBase64] = useState(null);

  // Indica si se está editando actualmente la firma
  const [editandoFirma, setEditandoFirma] = useState(false);

  const firmaEdicionCanvas = useRef(null);

  //----------------------------------
  // LIMPIAR NUEVA RESPONSIVA
  //----------------------------------

  const limpiarNuevaResponsiva = () => {

    setFecha("");
    setNombreReceptor("");
    setPuesto("");
    setArea("");
    setCorreo("");
    setEquipos([]);
    setInventario([]);
    setBusquedaEquipo("");
    setResponsivaGuardada(false);
    setResponsivaCreada(null);

    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }

    setPasoResponsiva(1);
  };

  //----------------------------------
  // ABRIR NUEVA RESPONSIVA
  //----------------------------------

  const abrirNuevaResponsiva = async () => {

    if (!puedeCrear) {
      toast.warning("No tienes permiso para crear responsivas.");
      return;
    }

    try {

      const data = await obtenerEquiposDisponibles();

      setInventario(Array.isArray(data) ? data : []);

      setPasoResponsiva(1);
      setMostrarNuevaResponsiva(true);

    } catch (error) {

      console.error("Error cargando equipos:", error);

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error cargando equipos disponibles."
      );

    } finally {
      setLoading(false);
    }
  };

  //----------------------------------
  // CERRAR NUEVA RESPONSIVA
  //----------------------------------

  const cerrarNuevaResponsiva = () => {

    setMostrarNuevaResponsiva(false);

    limpiarNuevaResponsiva();
  };

  //----------------------------------
  // PASO 1
  //----------------------------------

  const irPasoEquipos = () => {

    if (!fecha) {

      mostrarMensajeModal(
        "warning",
        "Datos incompletos",
        "La fecha es obligatoria."
      );

      return;
    }

    if (!nombreReceptor.trim()) {

      mostrarMensajeModal(
        "warning",
        "Datos incompletos",
        "El nombre del receptor es obligatorio."
      );

      return;
    }

    if (!puesto.trim()) {

      mostrarMensajeModal(
        "warning",
        "Datos incompletos",
        "El puesto es obligatorio."
      );

      return;
    }

    if (
      correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {

      mostrarMensajeModal(
        "warning",
        "Correo inválido",
        "Ingresa un correo válido."
      );

      return;
    }

    setPasoResponsiva(2);
  };

  //----------------------------------
  // PASO 2
  //----------------------------------

  const irPasoRevision = () => {

    if (equipos.length === 0) {

      mostrarMensajeModal(
        "warning",
        "Sin equipos",
        "Debes agregar al menos un equipo."
      );

      return;
    }

    setPasoResponsiva(3);
  };

  //----------------------------------
  // AGREGAR EQUIPO
  //----------------------------------

  const agregarEquipoDesdeInventario = (item) => {

    const yaExiste = equipos.some(
      (equipo) => equipo.IdInventario === item.id
    );

    if (yaExiste) {

      mostrarMensajeModal(
        "warning",
        "Equipo duplicado",
        "Este equipo ya fue agregado a la responsiva."
      );

      return;
    }

    setEquipos((prev) => [
      ...prev,
      {
        IdInventario: item.id,
        Descripcion:
          item.TIPO_EQUIPO ||
          item.NOMBRE_EQUIPO ||
          "",
        Marca: item.MARCA || "",
        Modelo: item.MODELO || "",
        NoSerie: item.SERIAL || ""
      }
    ]);
  };

  //----------------------------------
  // ELIMINAR EQUIPO
  //----------------------------------

  const eliminarEquipo = (index) => {

    setEquipos((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  //----------------------------------
  // FILTRO INVENTARIO
  //----------------------------------

  const inventarioFiltrado = useMemo(() => {

    const texto = busquedaEquipo.trim().toLowerCase();

    return inventario.filter((item) => {

      const estatus = item.ESTATUS?.toLowerCase();


     if (estatus !== "en uso" && estatus !== "disponible") {

  return false;
}


      if (!texto) {
        return true;
      }

      return [
        item.TIPO_EQUIPO,
        item.NOMBRE_EQUIPO,
        item.MARCA,
        item.MODELO,
        item.SERIAL,
        item.ESTATUS
      ]
        .filter(Boolean)
        .some((valor) =>
          String(valor)
            .toLowerCase()
            .includes(texto)
        );
   } );
  },[inventario, busquedaEquipo]);
  

  //----------------------------------
  // GUARDAR NUEVA RESPONSIVA
  //----------------------------------

  const guardarNuevaResponsiva = async () => {

    if (
      !fecha ||
      !nombreReceptor.trim() ||
      !puesto.trim()
    ) {

      mostrarMensajeModal(
        "warning",
        "Datos incompletos",
        "Completa los datos obligatorios."
      );

      setPasoResponsiva(1);

      return;
    }

    if (equipos.length === 0) {

      mostrarMensajeModal(
        "warning",
        "Sin equipos",
        "Agrega al menos un equipo."
      );

      setPasoResponsiva(2);

      return;
    }

    if (
      !sigCanvas.current ||
      sigCanvas.current.isEmpty()
    ) {

      mostrarMensajeModal(
        "warning",
        "Firma requerida",
        "La firma es obligatoria."
      );

      return;
    }

    try {

      setLoading(true);

      const firmaBase64 = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png");

      const respuesta = await crearResponsiva({

        Fecha: fecha,
        NombreReceptor: nombreReceptor,
        Puesto: puesto,
        Area: area,
        Correo: correo,
        FirmaBase64: firmaBase64,
        equipos

      });

      setResponsivaCreada(respuesta);

      setResponsivaGuardada(true);

      if (respuesta?.correoEnviado) {

        mostrarMensajeModal(
          "success",
          "Responsiva creada",
          "La responsiva fue creada y el correo fue enviado correctamente."
        );

      } else {

        mostrarMensajeModal(
          "success",
          "Responsiva creada",
          "La responsiva fue creada correctamente."
        );
      }

      await cargarResponsivas();

    } catch (error) {

      mostrarMensajeModal(
        "error",
        "Error al crear la responsiva",
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Ocurrió un error al crear la responsiva."
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al crear la responsiva."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // GENERAR PDF NUEVA RESPONSIVA
  //----------------------------------

  const generarPDFNuevaResponsiva = async () => {

    if (!responsivaGuardada) {

      mostrarMensajeModal(
        "warning",
        "Responsiva no guardada",
        "Primero debes guardar la responsiva antes de descargar el PDF."
      );

      return;
    }

    try {

      setLoading(true);

      const idResponsiva =
        responsivaCreada?.IdResponsiva ||
        responsivaCreada?.idResponsiva;

      if (!idResponsiva) {

        mostrarMensajeModal(
          "error",
          "Identificador no encontrado",
          "No se encontró el ID de la responsiva guardada."
        );

        return;
      }

      await descargarResponsivaPDF(idResponsiva);

      mostrarMensajeModal(
        "success",
        "PDF generado correctamente",
        "El PDF se descargó correctamente."
      );

    } catch (error) {

      console.error(
        "Error generando PDF:",
        error
      );

      mostrarMensajeModal(
        "error",
        "Error generando PDF",
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Ocurrió un error al generar el PDF."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // CARGAR RESPONSIVAS
  //----------------------------------

  useEffect(() => {
    cargarResponsivas();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, registrosPorPagina]);

  const cargarResponsivas = async () => {

    try {

      setLoading(true);

      const data = await obtenerResponsivas();

      setResponsivas(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Error cargando responsivas:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error cargando responsivas."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // FILTRO RESPONSIVAS --NUEVO
  //----------------------------------

const responsivasFiltradas = useMemo(() => {

  const texto = busqueda
    .trim()
    .toLowerCase();

  if (!texto) {
    return responsivas;
  }

  return responsivas.filter((item) => {

    const folio =
      item.Folio ||
      `RESP-${String(
        item.IdResponsiva
      ).padStart(5, "0")}`;

const valores = [
  item.IdResponsiva,
  item.Folio,
  item.Fecha,
  item.Correo,
  item.NombreReceptor,
  item.Puesto,
  item.Area,
  item.Estado,
  item.CorreoCreador,

  // Equipos
  item.Equipos,
  item.Marcas,
  item.Modelos,
  item.Series
];

    return valores
      .filter(
        (valor) =>
          valor !== null &&
          valor !== undefined
      )
      .some((valor) =>
        String(valor)
          .toLowerCase()
          .includes(texto)
      );

  });

}, [busqueda, responsivas]);

  const totalRegistros =
    responsivasFiltradas.length;

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        totalRegistros /
        registrosPorPagina
      )
    );

  const indiceInicial =
    (paginaActual - 1) *
    registrosPorPagina;

  const indiceFinal =
    indiceInicial +
    registrosPorPagina;

  const responsivasPaginadas =
    responsivasFiltradas.slice(
      indiceInicial,
      indiceFinal
    );

  //----------------------------------
  // FECHAS
  //----------------------------------

  const formatearFecha = (fecha) => {

    if (!fecha) return "";

    const fechaTexto =
      String(fecha).split("T")[0];

    const [anio, mes, dia] =
      fechaTexto.split("-");

    if (!anio || !mes || !dia) {
      return fechaTexto;
    }

    return `${dia}/${mes}/${anio}`;
  };

  const formatearFechaInput = (fecha) => {

    if (!fecha) return "";

    return String(fecha).split("T")[0];
  };

  //----------------------------------
  // VER DETALLE
  //----------------------------------

  const verDetalle = async (idResponsiva) => {

    try {

      setLoading(true);

      const data =
        await obtenerResponsivaPorId(
          idResponsiva
        );

      setResponsivaSeleccionada(
        data.responsiva
      );

      setDetalle(
        data.equipos || []
      );

      setModoModal("ver");
      setMostrarModal(true);

    } catch (error) {

      console.error(
        "Error obteniendo detalle:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error obteniendo detalle."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // ABRIR EDITAR
  //----------------------------------

  const abrirEditar = async (item) => {
    const puedeEntrarAEditar =
      puedeEditar || puedeEditarFirma;

    if (!puedeEntrarAEditar) {
      toast.warning(
        "No tienes permiso para editar responsivas."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await obtenerResponsivaPorId(
        item.IdResponsiva
      );

      const responsiva = data.responsiva;

      const autorizada =
        Number(responsiva?.PermitirEditarFirma) === 1;

      // Sistemas solo puede entrar si existe autorización
      if (!puedeEditar && !autorizada) {
        toast.warning(
          "La edición de firma no está autorizada para esta responsiva."
        );
        return;
      }

      setEditando(responsiva);

      setFormEditar({
        Fecha: formatearFechaInput(
          responsiva.Fecha
        ),
        NombreReceptor:
          responsiva.NombreReceptor || "",
        Puesto:
          responsiva.Puesto || "",
        Area:
          responsiva.Area || "",
        Correo:
          responsiva.Correo || ""
      });

      // MUY IMPORTANTE
      setPermitirEditarFirma(autorizada);

      setFirmaBase64(
        responsiva.FirmaBase64 || null
      );

      setModoModal("editar");
      setMostrarModal(true);

    } catch (error) {
      console.error(
        "Error obteniendo responsiva:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Error obteniendo la responsiva."
      );

    } finally {
      setLoading(false);
    }
  };

  //----------------------------------
  // CERRAR EDITAR
  //----------------------------------

  const cerrarEditar = () => {

    setMostrarModal(false);

    setModoModal(null);

    setEditando(null);

    setResponsivaSeleccionada(null);

    setDetalle([]);

    setFormEditar({

      Fecha: "",
      NombreReceptor: "",
      Puesto: "",
      Area: "",
      Correo: ""

    });

    setPermitirEditarFirma(false);

    setFirmaBase64(null);

    setEditandoFirma(false);

    if (firmaEdicionCanvas.current) {
      firmaEdicionCanvas.current.clear();
    }
  };

  //----------------------------------
  // GUARDAR EDICIÓN RESPONSIVA
  //----------------------------------

  const guardarEdicion = async () => {

    /*
     * Solamente el usuario con
     * responsivas.editar puede guardar
     * los datos generales y el checkbox.
     */

    if (!puedeEditar) {

      toast.warning(
        "No tienes permiso para editar los datos de la responsiva."
      );

      return;
    }

    if (!editando?.IdResponsiva) {

      toast.error(
        "No se encontró la responsiva a editar."
      );

      return;
    }

    if (
      !formEditar.Fecha ||
      !formEditar.NombreReceptor.trim() ||
      !formEditar.Puesto.trim()
    ) {

      toast.warning(
        "Fecha, receptor y puesto son obligatorios."
      );

      return;
    }

    if (
      formEditar.Correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formEditar.Correo
      )
    ) {

      toast.warning(
        "Ingresa un correo válido."
      );

      return;
    }

    const idResponsiva =
      editando.IdResponsiva;

    try {

      setLoading(true);

      /*
       * Primero actualizamos los datos generales.
       */

      await actualizarResponsiva(
        idResponsiva,
        formEditar
      );

      /*
       * Después guardamos la autorización
       * de edición de firma.
       */

      await autorizarEdicionFirma(
        idResponsiva,
        permitirEditarFirma
      );

      /*
       * Volvemos a consultar la responsiva
       * para obtener el estado real guardado.
       */

      const data =
        await obtenerResponsivaPorId(
          idResponsiva
        );

      const responsivaActualizada =
        data?.responsiva;

      setEditando(
        responsivaActualizada
      );

      setResponsivaSeleccionada(
        responsivaActualizada
      );

      setDetalle(
        data.equipos || []
      );

      setFirmaBase64(
        responsivaActualizada?.FirmaBase64 ||
        null
      );

      const autorizacionGuardada =
        Number(
          responsivaActualizada?.PermitirEditarFirma
        ) === 1;

      setPermitirEditarFirma(
        autorizacionGuardada
      );

      setEditandoFirma(false);

      toast.success(
        autorizacionGuardada
          ? "Responsiva actualizada. La edición de firma quedó autorizada."
          : "Responsiva actualizada correctamente."
      );

      await cargarResponsivas();

    } catch (error) {

      console.error(
        "Error actualizando responsiva:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error actualizando responsiva."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // INICIAR EDICIÓN DE FIRMA
  //----------------------------------

  const iniciarEdicionFirma = () => {

    if (!puedeEditarFirma) {

      toast.warning(
        "No tienes permiso para editar firmas."
      );

      return;
    }

    const autorizada =
      Number(
        editando?.PermitirEditarFirma
      ) === 1;

    if (!autorizada) {

      toast.warning(
        "La edición de firma no está autorizada."
      );

      return;
    }

    setEditandoFirma(true);

    setTimeout(() => {

      if (firmaEdicionCanvas.current) {
        firmaEdicionCanvas.current.clear();
      }

    }, 0);
  };

  //----------------------------------
  // CANCELAR EDICIÓN DE FIRMA
  //----------------------------------

  const cancelarEdicionFirma = () => {

    setEditandoFirma(false);

    if (firmaEdicionCanvas.current) {
      firmaEdicionCanvas.current.clear();
    }
  };

  //----------------------------------
  // GUARDAR FIRMA
  //----------------------------------

  const guardarFirmaEditada = async () => {

    if (!puedeEditarFirma) {

      toast.warning(
        "No tienes permiso para editar firmas."
      );

      return;
    }

    if (!editando?.IdResponsiva) {

      toast.error(
        "No se encontró la responsiva."
      );

      return;
    }

    if (
      Number(
        editando.PermitirEditarFirma
      ) !== 1
    ) {

      toast.warning(
        "La edición de firma no está autorizada."
      );

      return;
    }

    if (
      !firmaEdicionCanvas.current ||
      firmaEdicionCanvas.current.isEmpty()
    ) {

      toast.warning(
        "Debes ingresar una firma."
      );

      return;
    }

    try {

      setLoading(true);

      const nuevaFirma =
        firmaEdicionCanvas.current
          .getCanvas()
          .toDataURL("image/png");


      await actualizarFirmaResponsiva(
        editando.IdResponsiva,
        nuevaFirma
      );


      const data =
        await obtenerResponsivaPorId(
          editando.IdResponsiva
        );

      const responsivaActualizada =
        data?.responsiva;

      setEditando(
        responsivaActualizada
      );

      setResponsivaSeleccionada(
        responsivaActualizada
      );

      setDetalle(
        data.equipos || []
      );

      setFirmaBase64(
        responsivaActualizada?.FirmaBase64 ||
        nuevaFirma
      );

      /*
       * La autorización se consume.
       */

      setPermitirEditarFirma(false);

      setEditandoFirma(false);

      if (firmaEdicionCanvas.current) {
        firmaEdicionCanvas.current.clear();
      }

      await cargarResponsivas();

      toast.success(
        "Firma actualizada correctamente. La autorización de edición fue consumida."
      );

    } catch (error) {

      console.error(
        "Error actualizando firma:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error actualizando la firma."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // DESCARGAR PDF
  //----------------------------------

  const descargarPDF = async (
    idResponsiva,
    folio
  ) => {

    try {

      setLoading(true);

      await descargarResponsivaPDF(
        idResponsiva,
        folio
      );

      toast.success(
        "Responsiva descargada correctamente."
      );

    } catch (error) {

      console.error(
        "Error descargando responsiva:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error descargando responsiva."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // REENVIAR CORREO
  //----------------------------------

  const reenviarCorreo = async (
    idResponsiva
  ) => {

    try {

      setLoading(true);

      await reenviarResponsiva(
        idResponsiva
      );

      toast.success(
        "Responsiva reenviada por correo."
      );

    } catch (error) {

      console.error(
        "Error reenviando correo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error reenviando correo."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // DEVOLVER EQUIPO
  //----------------------------------

  const devolverEquipo = async (
    idDetalle
  ) => {

    if (!puedeDevolver) {

      toast.warning(
        "No tienes permiso para devolver equipos."
      );

      return;
    }

    const confirmar =
      window.confirm(
        "¿Deseas marcar este equipo como devuelto?"
      );

    if (!confirmar) return;

    try {

      setLoading(true);

      await marcarEquipoDevuelto(
        idDetalle,
        "Equipo devuelto correctamente"
      );

      toast.success(
        "Equipo marcado como devuelto."
      );

      if (responsivaSeleccionada) {

        await verDetalle(
          responsivaSeleccionada.IdResponsiva
        );
      }

      await cargarResponsivas();

    } catch (error) {

      console.error(
        "Error devolviendo equipo:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error devolviendo equipo."
      );

    } finally {

      setLoading(false);
    }
  };

  //----------------------------------
  // ESTADOS
  //----------------------------------

  const estados = {
    ACTIVA: "badge badge-activa",
    INACTIVA: "badge badge-inactiva"
  };

  //----------------------------------
  // RENDER
  //----------------------------------

  return (

    <div className="card">

      <div className="header">

        <div className="header-user">

          <div>

            <h1>
              Historial de Responsivas
            </h1>

            <p>
              Consulta, edita y administra las
              responsivas registradas.
            </p>

          </div>

          {puedeCrear && (

            <button
              className="btn-responsiva"
              type="button"
              onClick={abrirNuevaResponsiva}
            >
              Crear Responsiva
            </button>

          )}

        </div>

      </div>

      <div
        style={{
          marginBottom: "16px"
        }}
      >

        <input
          className="search-input"
          placeholder="Buscar por folio, receptor, puesto, área, correo, marca, modelo, serial..."
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
        />

      </div>

      <div className="table-responsive">

        <table>

          <thead>

            <tr>

              <th>Folio</th>
              <th>Fecha</th>
              <th>Correo del receptor</th>
              <th>Receptor</th>
              <th>Puesto</th>
              <th>Área</th>
              <th>Estado</th>
              <th>Acciones</th>

            </tr>

          </thead>

          <tbody>

            {responsivasFiltradas.length === 0 ? (

              <tr>

                <td colSpan="8">

                  {responsivas.length === 0
                    ? "No hay responsivas registradas."
                    : "No se encontraron responsivas con esa búsqueda."}

                </td>

              </tr>

            ) : (

              responsivasPaginadas.map((item) => {

                const folio =
                  item.Folio ||
                  `RESP-${String(
                    item.IdResponsiva
                  ).padStart(5, "0")}`;

                return (

                  <tr
                    key={item.IdResponsiva}
                  >

                    <td>
                      {folio}
                    </td>

                    <td>
                      {formatearFecha(
                        item.Fecha
                      )}
                    </td>

                    <td>
                      {item.Correo}
                    </td>

                    <td>
                      {item.NombreReceptor || ""}
                    </td>

                    <td>
                      {item.Puesto || ""}
                    </td>

                    <td>
                      {item.Area || ""}
                    </td>

                    <td>

                      <span
                        className={
                          estados[item.Estado] ||
                          "badge badge-default"
                        }
                      >
                        {item.Estado ||
                          "Sin estatus"}
                      </span>

                    </td>

                    <td>

                      <ResponsivasAcciones
                        item={item}
                        onDetalle={verDetalle}
                        onEditar={abrirEditar}
                        onPDF={(id) =>
                          descargarPDF(
                            id,
                            folio
                          )
                        }
                        onCorreo={
                          reenviarCorreo
                        }
                        puedeEditar={puedeEditar}
                        puedeEditarFirma={
                          puedeEditarFirma
                        }
                      />

                    </td>

                  </tr>

                );
              })

            )}

          </tbody>

        </table>

      </div>

      {/* PAGINACIÓN */}

      <div className="inventario-paginacion">

        <div className="inventario-paginacion-info">

          {totalRegistros === 0
            ? "0 registros"
            : `${indiceInicial + 1}-${Math.min(
              indiceFinal,
              totalRegistros
            )} de ${totalRegistros}`}

        </div>

        <div className="inventario-paginacion-controles">

          <label>
            Registros por página:
          </label>

          <select
            value={registrosPorPagina}
            onChange={(e) =>
              setRegistrosPorPagina(
                Number(e.target.value)
              )
            }
          >

            <option value={15}>
              15
            </option>

            <option value={20}>
              20
            </option>

            <option value={50}>
              50
            </option>

            <option value={100}>
              100
            </option>

          </select>

          <button
            type="button"
            onClick={() =>
              setPaginaActual((prev) =>
                Math.max(
                  1,
                  prev - 1
                )
              )
            }
            disabled={
              paginaActual === 1
            }
          >
            ‹
          </button>

          <span>
            Página {paginaActual} de {totalPaginas}
          </span>

          <button
            type="button"
            onClick={() =>
              setPaginaActual((prev) =>
                Math.min(
                  totalPaginas,
                  prev + 1
                )
              )
            }
            disabled={
              paginaActual === totalPaginas
            }
          >
            ›
          </button>

        </div>

      </div>

      {/* =========================================
          MODAL VER / EDITAR RESPONSIVA
          ========================================= */}

      {mostrarModal &&
        createPortal(

          <div className="modal-overlay">

            <div className="modal modal-responsiva-editar">

            {modoModal === "editar" ? (
  <>
    <div className="modal-header">
      <h3>
        Editar Responsiva{" "}
        {editando?.Folio ||
          `RESP-${String(
            editando?.IdResponsiva
          ).padStart(5, "0")}`}
      </h3>

      <button
        className="btn-close"
        onClick={cerrarEditar}
      >
        <X color="red" />
      </button>
    </div>

    <div className="responsiva-modal-body">

      {/* =====================================
          FORMULARIO PRINCIPAL
          ===================================== */}

      <div className="responsiva-form-grid">

        <div className="form-group">
          <p>Fecha</p>

          <input
            type="date"
            value={formEditar.Fecha}
            disabled={esSistemas}
            onChange={(e) =>
              setFormEditar({
                ...formEditar,
                Fecha: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <p>Nombre receptor</p>

          <input
            type="text"
            value={formEditar.NombreReceptor}
            disabled={esSistemas}
            onChange={(e) =>
              setFormEditar({
                ...formEditar,
                NombreReceptor: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <p>Puesto</p>

          <input
            type="text"
            value={formEditar.Puesto}
            disabled={esSistemas}
            onChange={(e) =>
              setFormEditar({
                ...formEditar,
                Puesto: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <p>Área</p>

          <input
            type="text"
            value={formEditar.Area}
            disabled={esSistemas}
            onChange={(e) =>
              setFormEditar({
                ...formEditar,
                Area: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <p>Correo</p>

          <input
            type="email"
            value={formEditar.Correo}
            disabled={esSistemas}
            onChange={(e) =>
              setFormEditar({
                ...formEditar,
                Correo: e.target.value
              })
            }
          />
        </div>

      </div>


      {/* =====================================
          AUTORIZACIÓN DE FIRMA
          SOLO responsivas.editar
          ===================================== */}

 {esAdministrador && (
  <div className="firma-autorizacion">
    <label className="firma-autorizacion-checkbox">
      <input
        type="checkbox"
        checked={permitirEditarFirma}
        onChange={(e) =>
          setPermitirEditarFirma(e.target.checked)
        }
      />

      <span>
        Permitir edición de firma
      </span>
    </label>
  </div>
)}

{puedeEditarFirma &&
  Number(editando?.PermitirEditarFirma) === 1 && (
    <div className="firma-edicion-seccion">

      <div className="firma-edicion-header">
        <div>
          <h4>Firma del receptor</h4>

          <span>
            Edición de firma autorizada
          </span>
        </div>
      </div>

      {firmaBase64 && (
        <div className="firma-actual">
          <p>Firma actual:</p>

          <img
            src={firmaBase64}
            alt="Firma actual"
          />
        </div>
      )}

      <div className="firma-canvas-container">
        <SignatureCanvas
          ref={firmaEdicionCanvas}
          penColor="black"
          canvasProps={{
            className: "firma-canvas"
          }}
        />
      </div>

      <div className="firma-edicion-acciones">

        <button
          type="button"
          className="btn-limpiar-firma"
          onClick={() =>
            firmaEdicionCanvas.current?.clear()
          }
        >
          Limpiar firma
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={guardarFirmaEditada}
        >
          Guardar firma
        </button>

      </div>

    </div>
  )}

      {/* =====================================
          INFORMACIÓN PARA ADMIN
          ===================================== */}

      {puedeEditar &&
        permitirEditarFirma && (
<></>

        )}

    </div>


    {/* =====================================
        FOOTER
        ===================================== */}

    <div className="responsiva-modal-footer">

   {esAdministrador && (
  <button
    type="button"
    className="btn-primary"
    onClick={guardarEdicion}
  >
    Guardar cambios
  </button>
)}

      <div className="footer-right">

        <button
          type="button"
          className="btn-cancelar"
          onClick={cerrarEditar}
        >
          Cancelar
        </button>

      </div>

    </div>
  </>
) :(

                /* =====================================
                   MODAL DETALLE
                   ===================================== */

                <>

                  <div className="responsiva-modal-body">

                    <div className="modal-header">

                      <h3>

                        {responsivaSeleccionada?.Folio ||
                          `RESP-${String(
                            responsivaSeleccionada?.IdResponsiva
                          ).padStart(5, "0")}`}

                      </h3>

                      <button
                        className="btn-close"
                        onClick={
                          cerrarEditar
                        }
                      >
                        x
                      </button>

                    </div>

                    <div className="equipos-cards">

                      {detalle.length === 0 ? (

                        <div className="sin-equipos">

                          Sin equipos registrados.

                        </div>

                      ) : (

                        detalle.map((item) => (

                          <div
                            className="equipo-card"
                            key={item.IdDetalle}
                          >

                            <div className="equipo-card-header">

                              <span
                                className={`estado-equipo ${item.Devuelto
                                    ? "devuelto"
                                    : "pendiente"
                                  }`}
                              >
                              </span>

                            </div>

                            <div className="card">

                              <div className="responsiva-modal-body">

                                <div className="responsiva-equipos-grid">

                                  <div className="detalle-item">

                                    <span>
                                      Tipo de equipo:
                                    </span>

                                    <strong>
                                      {item.Descripcion}
                                    </strong>

                                  </div>

                                  <div className="detalle-item">

                                    <span>
                                      Marca:
                                    </span>

                                    <strong>
                                      {item.Marca ||
                                        "N/A"}
                                    </strong>

                                  </div>

                                  <div className="detalle-item">

                                    <span>
                                      Modelo:
                                    </span>

                                    <strong>
                                      {item.Modelo ||
                                        "N/A"}
                                    </strong>

                                  </div>

                                  <div className="detalle-item">

                                    <span>
                                      Serie:
                                    </span>

                                    <strong>
                                      {item.NoSerie ||
                                        "N/A"}
                                    </strong>

                                  </div>

                                  <div className="detalle-item">

                                    <span>
                                      Fecha devolución:
                                    </span>

                                    <strong>

                                      {item.FechaDevolucion
                                        ? new Date(
                                          item.FechaDevolucion
                                        ).toLocaleString(
                                          "es-MX"
                                        )
                                        : "Pendiente"}

                                    </strong>

                                  </div>

                                  <div className="detalle-item">

                                    <span>
                                      Comentarios:
                                    </span>

                                    <strong>

                                      {item.ComentariosDevolucion ||
                                        "Sin comentarios"}

                                    </strong>

                                  </div>

                                </div>

                              </div>

                              {item.Devuelto ? (

                                <span className="equipo-accion-completada">
                                  Equipo devuelto
                                </span>

                              ) : puedeDevolver ? (

                                <div className="section-devolver">

                                  <button
                                    className="btn-devolver"
                                    type="button"
                                    onClick={() =>
                                      devolverEquipo(
                                        item.IdDetalle
                                      )
                                    }
                                  >
                                    Devolver
                                  </button>

                                </div>

                              ) : (

                                <span className="equipo-accion-pendiente">
                                  Pendiente de devolución
                                </span>

                              )}

                            </div>

                          </div>

                        ))

                      )}

                    </div>

                  </div>

                </>

              )}

            </div>

          </div>,

          document.body
        )}

      {/* =========================================
          NUEVA RESPONSIVA
          ========================================= */}

      {mostrarNuevaResponsiva &&
        createPortal(

          <div className="modal-overlay">

            <div className="modal modal-responsiva">

              <div className="modal-header">

                <div>

                  <h3>
                    Nueva responsiva
                  </h3>

                  <p>
                    Paso {pasoResponsiva} de 3
                  </p>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={
                    cerrarNuevaResponsiva
                  }
                >
                  ✕
                </button>

              </div>

              {mensajeModal.mostrar && (

                <div className="responsiva-alert-overlay">

                  <div
                    className={`responsiva-alert ${mensajeModal.tipo}`}
                  >

                    <div className="responsiva-alert-icon">

                      {mensajeModal.tipo === "success" &&
                        "✓"}

                      {mensajeModal.tipo === "warning" &&
                        "!"}

                      {mensajeModal.tipo === "error" &&
                        "×"}

                      {mensajeModal.tipo === "info" &&
                        "i"}

                    </div>

                    <h4>
                      {mensajeModal.titulo}
                    </h4>

                    <p>
                      {mensajeModal.mensaje}
                    </p>

                    <button
                      type="button"
                      className="btn-primario"
                      onClick={
                        cerrarMensajeModal
                      }
                    >
                      Aceptar
                    </button>

                  </div>

                </div>

              )}

              {/* INDICADOR DE PASOS */}

              <div className="responsiva-steps">

                <div
                  className={`responsiva-step ${pasoResponsiva >= 1
                      ? "activo"
                      : ""
                    }`}
                >

                  <span>
                    1
                  </span>

                  <div>

                    <strong>
                      Datos
                    </strong>

                    <small>
                      Receptor
                    </small>

                  </div>

                </div>

                <div
                  className={`responsiva-step-line ${pasoResponsiva >= 2
                      ? "completada"
                      : ""
                    }`}
                />

                <div
                  className={`responsiva-step ${pasoResponsiva >= 2
                      ? "activo"
                      : ""
                    }`}
                >

                  <span>
                    2
                  </span>

                  <div>

                    <strong>
                      Equipos
                    </strong>

                    <small>
                      Asignación
                    </small>

                  </div>

                </div>

                <div
                  className={`responsiva-step-line ${pasoResponsiva >= 3
                      ? "completada"
                      : ""
                    }`}
                />

                <div
                  className={`responsiva-step ${pasoResponsiva >= 3
                      ? "activo"
                      : ""
                    }`}
                >

                  <span>
                    3
                  </span>

                  <div>

                    <strong>
                      Revisión
                    </strong>

                    <small>
                      Firma
                    </small>

                  </div>

                </div>

              </div>

              {/* PASO 1 */}

              {pasoResponsiva === 1 && (

                <div className="responsiva-modal-body">

                  <div className="responsiva-form-grid">

                    <div className="form-group">

                      <label>
                        Fecha *
                      </label>

                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) =>
                          setFecha(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Nombre del receptor *
                      </label>

                      <input
                        type="text"
                        value={
                          nombreReceptor
                        }
                        onChange={(e) =>
                          setNombreReceptor(
                            e.target.value
                          )
                        }
                        placeholder="Nombre completo"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Puesto *
                      </label>

                      <input
                        type="text"
                        value={puesto}
                        onChange={(e) =>
                          setPuesto(
                            e.target.value
                          )
                        }
                        placeholder="Puesto"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Área
                      </label>

                      <input
                        type="text"
                        value={area}
                        onChange={(e) =>
                          setArea(
                            e.target.value
                          )
                        }
                        placeholder="Área"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Correo
                      </label>

                      <input
                        type="email"
                        value={correo}
                        onChange={(e) =>
                          setCorreo(
                            e.target.value
                          )
                        }
                        placeholder="correo@empresa.com"
                      />

                    </div>

                  </div>

                </div>

              )}

              {/* PASO 2 */}

              {pasoResponsiva === 2 && (

                <div className="responsiva-modal-body">

                  <div className="responsiva-equipos-grid">

                    <div className="responsiva-panel">
                  
                      <div className="responsiva-panel-header">

                        <div>

                          <h4>
                            Equipos disponibles
                          </h4>

                          <span>
                            Selecciona los equipos que deseas asignar
                          </span>

                        </div>

                      </div>

                      <input
                        type="text"
                        className="responsiva-search"
                        placeholder="Buscar equipo, marca, modelo o serie..."
                        value={
                          busquedaEquipo
                        }
                        onChange={(e) =>
                          setBusquedaEquipo(
                            e.target.value
                          )
                        }
                      />

                      <div className="equipos-disponibles-list">

                        {inventarioFiltrado.length === 0 ? (

                          <p className="sin-resultados">
                            No hay equipos disponibles.
                          </p>

                        ) : (

                          inventarioFiltrado.map(
                            (item) => (

                              <div
                                key={item.id}
                                className="equipo-disponible"
                              >

                                <div>

                                  <strong>

                                    {item.TIPO_EQUIPO ||
                                      item.NOMBRE_EQUIPO ||
                                      "Equipo"}

                                  </strong>

                                  <span>

                                    {item.MARCA ||
                                      "Sin marca"}{" "}

                                    {item.MODELO ||
                                      ""}

                                  </span>

                                  <small>

                                    Serie:{" "}
                                    {item.SERIAL ||
                                      "N/A"}

                                  </small>
                                                                      
                                <div className="badge-free">
                                <small>
                                 {item.ESTATUS}
                                </small>
                                </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    agregarEquipoDesdeInventario(
                                      item
                                    )
                                  }
                                >
                                  Agregar
                                </button>



                              </div>

                            )
                          )

                        )}

                      </div>

                    </div>

                    <div className="responsiva-panel">

                      <div className="responsiva-panel-header">

                        <div>

                          <h4>
                            Equipos de la responsiva
                          </h4>

                          <span>

                            {equipos.length} equipo
                            {equipos.length !== 1
                              ? "s"
                              : ""}{" "}
                            seleccionado
                            {equipos.length !== 1
                              ? "s"
                              : ""}

                          </span>

                        </div>

                      </div>

                      {equipos.length === 0 ? (

                        <div className="sin-equipos">

                          <p>
                            No has agregado equipos.
                          </p>

                        </div>

                      ) : (

                        <div className="equipos-seleccionados">

                          {equipos.map(
                            (equipo, index) => (

                              <div
                                key={
                                  equipo.IdInventario
                                }
                                className="equipo-seleccionado"
                              >

                                <div>

                                  <strong>
                                    {equipo.Descripcion}
                                  </strong>

                                  <span>

                                    {equipo.Marca}{" "}
                                    {equipo.Modelo}

                                  </span>

                                  <small>

                                    Serie:{" "}
                                    {equipo.NoSerie ||
                                      "N/A"}

                                  </small>

                                </div>

                                <button
                                  type="button"
                                  className="btn-eliminar-equipo"
                                  onClick={() =>
                                    eliminarEquipo(
                                      index
                                    )
                                  }
                                >
                                  Eliminar
                                </button>

                              </div>

                            )
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              )}

              {/* PASO 3 */}

              {pasoResponsiva === 3 && (

                <div className="responsiva-modal-body">

                  <div className="responsiva-revision">

                    <div className="documento-preview">

                      <h4>
                        Vista previa
                      </h4>

                      <div className="documento-card">

                        <h2>
                          RESPONSIVA DE EQUIPO
                        </h2>

                        <p>

                          <strong>
                            Fecha:
                          </strong>{" "}

                          {fecha}

                        </p>

                        <p>

                          <strong>
                            Receptor:
                          </strong>{" "}

                          {nombreReceptor}

                        </p>

                        <p>

                          <strong>
                            Puesto:
                          </strong>{" "}

                          {puesto}

                        </p>

                        <p>

                          <strong>
                            Área:
                          </strong>{" "}

                          {area || "N/A"}

                        </p>

                        <p>

                          <strong>
                            Correo:
                          </strong>{" "}

                          {correo || "N/A"}

                        </p>

                        <hr />

                        <h4>
                          Equipos asignados
                        </h4>

                        <table>

                          <thead>

                            <tr>

                              <th>
                                Equipo
                              </th>

                              <th>
                                Marca
                              </th>

                              <th>
                                Modelo
                              </th>

                              <th>
                                Serie
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {equipos.map(
                              (equipo) => (

                                <tr
                                  key={
                                    equipo.IdInventario
                                  }
                                >

                                  <td>
                                    {equipo.Descripcion}
                                  </td>

                                  <td>
                                    {equipo.Marca}
                                  </td>

                                  <td>
                                    {equipo.Modelo}
                                  </td>

                                  <td>
                                    {equipo.NoSerie}
                                  </td>

                                </tr>

                              )
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>

                    <div className="firma-panel">

                      <h4>
                        Firma del receptor
                      </h4>

                      <div className="firma-canvas-container">

                        <SignatureCanvas
                          ref={sigCanvas}
                          penColor="black"
                          canvasProps={{
                            className:
                              "firma-canvas"
                          }}
                        />

                      </div>

                      <button
                        type="button"
                        className="btn-limpiar-firma"
                        onClick={() =>
                          sigCanvas.current?.clear()
                        }
                      >
                        Limpiar firma
                      </button>

                    </div>

                  </div>

                </div>

              )}

              {/* FOOTER NUEVA RESPONSIVA */}

              <div className="responsiva-modal-footer">

                {pasoResponsiva > 1 && (

                  <button
                    type="button"
                    className="btn-secundario"
                    onClick={() =>
                      setPasoResponsiva(
                        pasoResponsiva - 1
                      )
                    }
                  >
                    ← Anterior
                  </button>

                )}

                <div className="footer-right">

                  <button
                    type="button"
                    className="btn-cancelar"
                    onClick={
                      cerrarNuevaResponsiva
                    }
                  >
                    Cancelar
                  </button>

                  {pasoResponsiva === 1 && (

                    <button
                      type="button"
                      className="btn-primario"
                      onClick={
                        irPasoEquipos
                      }
                    >
                      Siguiente
                    </button>

                  )}

                  {pasoResponsiva === 2 && (

                    <button
                      type="button"
                      className="btn-primario"
                      onClick={
                        irPasoRevision
                      }
                    >
                      Revisar
                    </button>

                  )}

                  {pasoResponsiva === 3 && (

                    <>

                      {puedePDF && (

                        <button
                          type="button"
                          className="btn-secundario"
                          onClick={
                            generarPDFNuevaResponsiva
                          }
                        >
                          Descargar PDF
                        </button>

                      )}

                      <button
                        type="button"
                        className="btn-primario"
                        onClick={
                          guardarNuevaResponsiva
                        }
                        disabled={
                          responsivaGuardada
                        }
                      >
                        {responsivaGuardada
                          ? "Responsiva guardada"
                          : "Guardar"}
                      </button>

                    </>

                  )}

                </div>

              </div>

            </div>

          </div>,

          document.body
        )}

    </div>
  );
}

export default HistorialResponsivasPage;