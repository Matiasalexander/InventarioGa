const { poolPromise } = require("../config/db");

const crearResponsiva = async (req, res) => {
  try {
    const {
      Fecha,
      NombreReceptor,
      Puesto,
      Area,
      FirmaBase64,
      equipos
    } = req.body;

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

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Fecha", Fecha)
      .input("NombreReceptor", NombreReceptor)
      .input("Puesto", Puesto)
      .input("Area", Area || null)
      .input("FirmaBase64", FirmaBase64 || null)
      .query(`
        INSERT INTO Responsivas (
          Fecha,
          NombreReceptor,
          Puesto,
          Area,
          FirmaBase64
        )
        OUTPUT INSERTED.IdResponsiva
        VALUES (
          @Fecha,
          @NombreReceptor,
          @Puesto,
          @Area,
          @FirmaBase64
        )
      `);

    const IdResponsiva = result.recordset[0].IdResponsiva;

    for (const equipo of equipos) {
      await pool.request()
        .input("IdResponsiva", IdResponsiva)
        .input("IdInventario", equipo.IdInventario || null)
        .input("Descripcion", equipo.Descripcion || null)
        .input("Marca", equipo.Marca || null)
        .input("Modelo", equipo.Modelo || null)
        .input("NoSerie", equipo.NoSerie || null)
        .query(`
          INSERT INTO Responsiva_Detalle (
            IdResponsiva,
            IdInventario,
            Descripcion,
            Marca,
            Modelo,
            NoSerie
          )
          VALUES (
            @IdResponsiva,
            @IdInventario,
            @Descripcion,
            @Marca,
            @Modelo,
            @NoSerie
          )
        `);
    }

    res.status(201).json({
      message: "Responsiva creada correctamente",
      IdResponsiva
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creando responsiva",
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
        Fecha,
        NombreReceptor,
        Puesto,
        Area,
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
        SELECT *
        FROM Responsivas
        WHERE IdResponsiva = @IdResponsiva
      `);

    if (responsiva.recordset.length === 0) {
      return res.status(404).json({
        message: "Responsiva no encontrada"
      });
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

const eliminarResponsiva = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

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

    res.json({
      message: "Responsiva eliminada correctamente"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error eliminando responsiva",
      error: error.message
    });
  }
};

const marcarEquipoDevuelto = async (req, res) => {
  try {
    const { idDetalle } = req.params;
    const { ComentariosDevolucion } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("IdDetalle", idDetalle)
      .input("ComentariosDevolucion", ComentariosDevolucion || null)
      .query(`
        UPDATE Responsiva_Detalle
        SET
          Devuelto = 1,
          FechaDevolucion = GETDATE(),
          ComentariosDevolucion = @ComentariosDevolucion
        WHERE IdDetalle = @IdDetalle
      `);

    res.json({
      message: "Equipo marcado como devuelto"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error marcando devolución",
      error: error.message
    });
  }
};

module.exports = {
  crearResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  eliminarResponsiva,
  marcarEquipoDevuelto
};