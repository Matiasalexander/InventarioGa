const { poolPromise } = require("../config/db");
const generarPdfResponsiva = require("../helpers/generarPdfResponsiva");
const {
  crearResponsivaService,
  actualizarResponsivaService
} = require("../services/responsiva.service");

const crearResponsiva = async (req, res) => {
  try {
    const { Fecha, NombreReceptor, Puesto, equipos } = req.body;

    if (!Fecha || !NombreReceptor || !Puesto) {
      return res.status(400).json({
        message: "Fecha, nombre del receptor y puesto son obligatorios"
      });
    }

    if (!equipos || equipos.length === 0) {
      return res.status(400).json({
        message: "Debes agregar al menos un equipo a la responsiva"
      });
    }

    const data = await crearResponsivaService(req.body);

    res.status(201).json({
      message: data.correoEnviado
        ? "Responsiva creada correctamente y enviada por correo"
        : "Responsiva creada correctamente",
      ...data
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Error creando responsiva",
      error: error.message
    });
  }
};

const actualizarResponsiva = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await actualizarResponsivaService(id, req.body);

    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Error actualizando responsiva",
      error: error.message
    });
  }
};

const obtenerResponsivas = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        IdResponsiva,
        CONCAT('RESP-', RIGHT('00000' + CAST(IdResponsiva AS VARCHAR(10)), 5)) AS Folio,
        Fecha,
        NombreReceptor,
        Puesto,
        Area,
        Correo,
        Estado,
        FechaCreacion
      FROM Responsivas
      ORDER BY IdResponsiva DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo responsivas",
      error: error.message
    });
  }
};

const obtenerResponsivaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const responsiva = await pool.request()
      .input("IdResponsiva", id)
      .query(`
        SELECT *,
          CONCAT('RESP-', RIGHT('00000' + CAST(IdResponsiva AS VARCHAR(10)), 5)) AS Folio
        FROM Responsivas
        WHERE IdResponsiva = @IdResponsiva
      `);

    if (responsiva.recordset.length === 0) {
      return res.status(404).json({ message: "Responsiva no encontrada" });
    }

    const detalle = await pool.request()
      .input("IdResponsiva", id)
      .query(`
        SELECT *
        FROM Responsiva_Detalle
        WHERE IdResponsiva = @IdResponsiva
        ORDER BY IdDetalle ASC
      `);

    res.json({
      responsiva: responsiva.recordset[0],
      equipos: detalle.recordset
    });
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo responsiva",
      error: error.message
    });
  }
};

const descargarResponsivaPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const { pdfBuffer, folio } = await generarPdfResponsiva(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${folio}.pdf`);

    res.end(pdfBuffer);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Error descargando responsiva PDF",
      error: error.message
    });
  }
};

const obtenerResponsivasPorEquipo = async (req, res) => {
  try {
    const { idInventario } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("IdInventario", idInventario)
      .query(`
        SELECT
          r.IdResponsiva,
          CONCAT('RESP-', RIGHT('00000' + CAST(r.IdResponsiva AS VARCHAR(10)), 5)) AS Folio,
          r.Fecha,
          r.NombreReceptor,
          r.Puesto,
          r.Area,
          r.Correo,
          r.Estado,
          rd.IdDetalle,
          rd.IdInventario,
          rd.Descripcion,
          rd.Marca,
          rd.Modelo,
          rd.NoSerie,
          rd.Devuelto,
          rd.FechaDevolucion,
          rd.ComentariosDevolucion
        FROM Responsiva_Detalle rd
        INNER JOIN Responsivas r ON rd.IdResponsiva = r.IdResponsiva
        WHERE rd.IdInventario = @IdInventario
        ORDER BY r.Fecha DESC, r.IdResponsiva DESC
      `);

    const historial = result.recordset;
    const activa = historial.find((item) => !item.Devuelto) || null;

    res.json({ activa, historial });
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo historial de responsivas del equipo",
      error: error.message
    });
  }
};

const marcarEquipoDevuelto = async (req, res) => {
  try {
    const { idDetalle } = req.params;
    const { ComentariosDevolucion } = req.body;

    const pool = await poolPromise;

    const detalle = await pool.request()
      .input("IdDetalle", idDetalle)
      .query(`
        SELECT IdInventario, IdResponsiva
        FROM Responsiva_Detalle
        WHERE IdDetalle = @IdDetalle
      `);

    if (detalle.recordset.length === 0) {
      return res.status(404).json({
        message: "Detalle de responsiva no encontrado"
      });
    }

    const { IdInventario, IdResponsiva } = detalle.recordset[0];

    await pool.request()
      .input("IdDetalle", idDetalle)
      .input("ComentariosDevolucion", ComentariosDevolucion || null)
      .query(`
        UPDATE Responsiva_Detalle
        SET Devuelto = 1,
            FechaDevolucion = GETDATE(),
            ComentariosDevolucion = @ComentariosDevolucion
        WHERE IdDetalle = @IdDetalle
      `);

    if (IdInventario) {
      await pool.request()
        .input("IdInventario", IdInventario)
        .query(`
          UPDATE INVENTARIO_M
          SET RESPONSIVA_DIGITAL = 0,
              NUM_RESPONSIVA = NULL
          WHERE id = @IdInventario
        `);
    }

    const pendientes = await pool.request()
      .input("IdResponsiva", IdResponsiva)
      .query(`
        SELECT COUNT(*) AS Pendientes
        FROM Responsiva_Detalle
        WHERE IdResponsiva = @IdResponsiva
          AND ISNULL(Devuelto, 0) = 0
      `);

    if (pendientes.recordset[0].Pendientes === 0) {
      await pool.request()
        .input("IdResponsiva", IdResponsiva)
        .query(`
          UPDATE Responsivas
          SET Estado = 'INACTIVA'
          WHERE IdResponsiva = @IdResponsiva
        `);
    }

    res.json({ message: "Equipo marcado como devuelto" });
  } catch (error) {
    res.status(500).json({
      message: "Error marcando devolución",
      error: error.message
    });
  }
};

const obtenerEquiposDisponibles = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        i.id,
        i.NOMBRE_EQUIPO,
        i.SERIAL,
        i.MODELO,
        i.SISTEMA_OPERATIVO,
        i.ID_TIPO_EQUIPO,
        te.tequipo AS TIPO_EQUIPO,
        i.ID_MARCA,
        m.Marca AS MARCA,
        i.ID_ESTATUS,
        e.Estatus_equipo AS ESTATUS
      FROM INVENTARIO_M i
      LEFT JOIN Tipo_equipo te ON i.ID_TIPO_EQUIPO = te.id
      LEFT JOIN Marcas m ON i.ID_MARCA = m.id
      LEFT JOIN Estatus e ON i.ID_ESTATUS = e.Id
      WHERE NOT EXISTS (
        SELECT 1
        FROM Responsiva_Detalle rd
        WHERE rd.IdInventario = i.id
          AND ISNULL(rd.Devuelto, 0) = 0
      )
      ORDER BY i.id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo equipos disponibles",
      error: error.message
    });
  }
};

const eliminarResponsiva = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const detalle = await pool.request()
      .input("IdResponsiva", id)
      .query(`
        SELECT IdInventario
        FROM Responsiva_Detalle
        WHERE IdResponsiva = @IdResponsiva
      `);

    for (const equipo of detalle.recordset) {
      if (equipo.IdInventario) {
        await pool.request()
          .input("IdInventario", equipo.IdInventario)
          .query(`
            UPDATE INVENTARIO_M
            SET RESPONSIVA_DIGITAL = 0,
                NUM_RESPONSIVA = NULL
            WHERE id = @IdInventario
          `);
      }
    }

    await pool.request()
      .input("IdResponsiva", id)
      .query(`
        DELETE FROM Responsiva_Detalle
        WHERE IdResponsiva = @IdResponsiva
      `);

    await pool.request()
      .input("IdResponsiva", id)
      .query(`
        DELETE FROM Responsivas
        WHERE IdResponsiva = @IdResponsiva
      `);

    res.json({ message: "Responsiva eliminada correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando responsiva",
      error: error.message
    });
  }
};

module.exports = {
  crearResponsiva,
  actualizarResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  obtenerResponsivasPorEquipo,
  descargarResponsivaPdf,
  eliminarResponsiva,
  marcarEquipoDevuelto,
  obtenerEquiposDisponibles
};