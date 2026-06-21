import sql from "mssql";
import { getConnection } from "../config/db.js";

export const crearResponsiva = async (req, res) => {
  const {
    fecha,
    nombreReceptor,
    puesto,
    area,
    firmaBase64,
    equipos
  } = req.body;

  if (!fecha || !nombreReceptor || !puesto || !equipos || equipos.length === 0) {
    return res.status(400).json({
      message: "Fecha, receptor, puesto y al menos un equipo son obligatorios"
    });
  }

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const requestResponsiva = new sql.Request(transaction);

    const result = await requestResponsiva
      .input("Fecha", sql.Date, fecha)
      .input("NombreReceptor", sql.VarChar(150), nombreReceptor)
      .input("Puesto", sql.VarChar(150), puesto)
      .input("Area", sql.VarChar(150), area || null)
      .input("FirmaBase64", sql.VarChar(sql.MAX), firmaBase64 || null)
      .query(`
        INSERT INTO Responsivas
        (
          Fecha,
          NombreReceptor,
          Puesto,
          Area,
          FirmaBase64
        )
        OUTPUT INSERTED.IdResponsiva
        VALUES
        (
          @Fecha,
          @NombreReceptor,
          @Puesto,
          @Area,
          @FirmaBase64
        )
      `);

    const idResponsiva = result.recordset[0].IdResponsiva;

    for (const equipo of equipos) {
      const requestDetalle = new sql.Request(transaction);

      await requestDetalle
        .input("IdResponsiva", sql.Int, idResponsiva)
        .input("IdInventario", sql.Int, equipo.idInventario || null)
        .input("Descripcion", sql.VarChar(200), equipo.descripcion)
        .input("Marca", sql.VarChar(100), equipo.marca)
        .input("Modelo", sql.VarChar(100), equipo.modelo)
        .input("NoSerie", sql.VarChar(150), equipo.noSerie)
        .query(`
          INSERT INTO Responsiva_Detalle
          (
            IdResponsiva,
            IdInventario,
            Descripcion,
            Marca,
            Modelo,
            NoSerie
          )
          VALUES
          (
            @IdResponsiva,
            @IdInventario,
            @Descripcion,
            @Marca,
            @Modelo,
            @NoSerie
          )
        `);
    }

    await transaction.commit();

    res.status(201).json({
      message: "Responsiva creada correctamente",
      idResponsiva
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Error al crear responsiva:", error);

    res.status(500).json({
      message: "Error al crear responsiva",
      error: error.message
    });
  }
};

export const obtenerResponsivas = async (req, res) => {
  try {
    const pool = await getConnection();

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
    console.error("Error al obtener responsivas:", error);

    res.status(500).json({
      message: "Error al obtener responsivas",
      error: error.message
    });
  }
};

export const obtenerResponsivaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await getConnection();

    const responsiva = await pool.request()
      .input("IdResponsiva", sql.Int, id)
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
      .input("IdResponsiva", sql.Int, id)
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
    console.error("Error al obtener responsiva:", error);

    res.status(500).json({
      message: "Error al obtener responsiva",
      error: error.message
    });
  }
};

export const eliminarResponsiva = async (req, res) => {
  const { id } = req.params;

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await new sql.Request(transaction)
      .input("IdResponsiva", sql.Int, id)
      .query(`
        DELETE FROM Responsiva_Detalle
        WHERE IdResponsiva = @IdResponsiva
      `);

    await new sql.Request(transaction)
      .input("IdResponsiva", sql.Int, id)
      .query(`
        DELETE FROM Responsivas
        WHERE IdResponsiva = @IdResponsiva
      `);

    await transaction.commit();

    res.json({
      message: "Responsiva eliminada correctamente"
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Error al eliminar responsiva:", error);

    res.status(500).json({
      message: "Error al eliminar responsiva",
      error: error.message
    });
  }
};

export const marcarEquipoDevuelto = async (req, res) => {
  const { idDetalle } = req.params;
  const { comentariosDevolucion } = req.body;

  try {
    const pool = await getConnection();

    await pool.request()
      .input("IdDetalle", sql.Int, idDetalle)
      .input("ComentariosDevolucion", sql.VarChar(sql.MAX), comentariosDevolucion || null)
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
    console.error("Error al marcar devolución:", error);

    res.status(500).json({
      message: "Error al marcar devolución",
      error: error.message
    });
  }
};