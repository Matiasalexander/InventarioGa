const { poolPromise } = require("../config/db");
const sql = require("mssql");
const generarPdfResponsiva = require("../helpers/generarPdfResponsiva");
const enviarCorreoResponsiva = require("../helpers/enviarCorreoResponsiva");

const generarPdfDevolucion = require("../helpers/generarPdfDevolucion");
const crearFolioResponsiva = (id) => {
  return `RESP-${String(id).padStart(5, "0")}`;
};

const lanzarError = (mensaje, statusCode = 400) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  throw error;
};

const validarResponsiva = ({ Fecha, NombreReceptor, Puesto, equipos }) => {
  if (!Fecha || !NombreReceptor || !Puesto) {
    lanzarError("Fecha, nombre del receptor y puesto son obligatorios");
  }

  if (!equipos || equipos.length === 0) {
    lanzarError("Debes agregar al menos un equipo a la responsiva");
  }
};

const validarEquiposDisponibles = async (pool, equipos) => {
  for (const equipo of equipos) {
    if (!equipo.IdInventario) continue;

    const result = await pool.request()
      .input("IdInventario", equipo.IdInventario)
      .query(`
        SELECT TOP 1
          rd.IdDetalle,
          r.IdResponsiva,
          r.NombreReceptor
        FROM Responsiva_Detalle rd
        INNER JOIN Responsivas r
          ON rd.IdResponsiva = r.IdResponsiva
        WHERE rd.IdInventario = @IdInventario
          AND ISNULL(rd.Devuelto, 0) = 0
      `);

    if (result.recordset.length > 0) {
      lanzarError(
        `El equipo ya está asignado a ${result.recordset[0].NombreReceptor}`
      );
    }
  }
};


const crearResponsiva = async (payload) => {
  validarResponsiva(payload);

  const {
    Fecha,
    NombreReceptor,
    Puesto,
    Area,
    Correo,
    FirmaBase64,
    CorreoCreador,
    IdUsuarioCreador,
    equipos
  } = payload;

  const idsEquipos = equipos
    .filter(equipo => equipo.IdInventario != null)
    .map(equipo => Number(equipo.IdInventario));

  if (idsEquipos.some(id =>
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > 2147483647
  )) {
    lanzarError("Hay identificadores de equipo inválidos.");
  }

  if (new Set(idsEquipos).size !== idsEquipos.length) {
    lanzarError(
      "No puedes agregar dos veces el mismo equipo."
    );
  }

  const pool = await poolPromise;
  const transaccion = new sql.Transaction(pool);

  let iniciada = false;
  let IdResponsiva;

  try {
    await transaccion.begin(
      sql.ISOLATION_LEVEL.READ_COMMITTED
    );

    iniciada = true;

    // 1. Validar y bloquear los equipos de inventario.
    // El bloqueo se conserva hasta terminar la transacción.
    for (const idEquipo of [...idsEquipos].sort(
      (a, b) => a - b
    )) {
      const resultado = await new sql.Request(transaccion)
        .input("IdInventario", sql.Int, idEquipo)
        .input("FechaResponsiva", Fecha)
        .query(`
          SELECT
            i.id,
            i.ID_ESTATUS,
            i.FECHA_FABRICACION,
            CASE
              WHEN CAST(@FechaResponsiva AS date) <
                   CAST(i.FECHA_FABRICACION AS date)
              THEN 1
              ELSE 0
            END AS FechaInvalida
          FROM dbo.INVENTARIO_M AS i
            WITH (UPDLOCK, HOLDLOCK)
          WHERE i.id = @IdInventario;
        `);

      if (!resultado.recordset.length) {
        lanzarError(
          `El equipo ${idEquipo} no existe.`,
          404
        );
      }

      const equipoBD = resultado.recordset[0];

      if (equipoBD.FechaInvalida === 1) {
        lanzarError(
          `La fecha de la responsiva es anterior a la fabricación del equipo ${idEquipo}.`
        );
      }

      if (Number(equipoBD.ID_ESTATUS) !== 1) {
        lanzarError(
          `El equipo ${idEquipo} no está disponible para asignación.`,
          409
        );
      }

      const asignacion = await new sql.Request(
        transaccion
      )
        .input("IdInventario", sql.Int, idEquipo)
        .query(`
          SELECT TOP (1)
            r.NombreReceptor
          FROM dbo.Responsiva_Detalle AS rd
          INNER JOIN dbo.Responsivas AS r
            ON r.IdResponsiva = rd.IdResponsiva
          WHERE rd.IdInventario = @IdInventario
            AND ISNULL(rd.Devuelto, 0) = 0;
        `);

      if (asignacion.recordset.length) {
        lanzarError(
          `El equipo ${idEquipo} ya está asignado a ${
            asignacion.recordset[0].NombreReceptor
          }.`,
          409
        );
      }
    }

    // 2. Crear encabezado de responsiva.
    const nuevaResponsiva = await new sql.Request(
      transaccion
    )
      .input("Fecha", Fecha)
      .input("NombreReceptor", NombreReceptor)
      .input("Puesto", Puesto)
      .input("Area", Area || null)
      .input("Correo", Correo || null)
      .input("FirmaBase64", FirmaBase64 || null)
      .input("CorreoCreador", CorreoCreador || null)
      .input(
        "IdUsuarioCreador",
        IdUsuarioCreador || null
      )
      .query(`
        INSERT INTO dbo.Responsivas (
          Fecha,
          NombreReceptor,
          Puesto,
          Area,
          Correo,
          FirmaBase64,
          Estado,
          CorreoCreador,
          IdUsuarioCreador
        )
        OUTPUT INSERTED.IdResponsiva
        VALUES (
          @Fecha,
          @NombreReceptor,
          @Puesto,
          @Area,
          @Correo,
          @FirmaBase64,
          'ACTIVA',
          @CorreoCreador,
          @IdUsuarioCreador
        );
      `);

    IdResponsiva =
      nuevaResponsiva.recordset[0].IdResponsiva;

    // 3. Registrar los detalles y actualizar inventario.
    for (const equipo of equipos) {
      const IdInventario =
        equipo.IdInventario == null
          ? null
          : Number(equipo.IdInventario);

      await new sql.Request(transaccion)
        .input("IdResponsiva", IdResponsiva)
        .input("IdInventario", IdInventario)
        .input("Descripcion", equipo.Descripcion || null)
        .input("Marca", equipo.Marca || null)
        .input("Modelo", equipo.Modelo || null)
        .input("NoSerie", equipo.NoSerie || null)
        .query(`
          INSERT INTO dbo.Responsiva_Detalle (
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
          );
        `);

      if (IdInventario === null) {
        continue;
      }

      const actualizacion = await new sql.Request(
        transaccion
      )
        .input("IdInventario", sql.Int, IdInventario)
        .input("IdResponsiva", IdResponsiva)
        .query(`
          UPDATE dbo.INVENTARIO_M
          SET
            ID_ESTATUS = 2,
            RESPONSIVA_DIGITAL = 1,
            NUM_RESPONSIVA = @IdResponsiva
          WHERE id = @IdInventario
            AND ID_ESTATUS = 1;
        `);

      if (actualizacion.rowsAffected[0] !== 1) {
        lanzarError(
          `No fue posible asignar el equipo ${IdInventario}.`,
          409
        );
      }
    }

    // 4. Confirmar todo en una sola operación.
    await transaccion.commit();
    iniciada = false;

  } catch (error) {
    if (iniciada) {
      try {
        await transaccion.rollback();
      } catch (errorRollback) {
        console.error(
          "Error revirtiendo responsiva:",
          errorRollback
        );
      }
    }

    throw error;
  }

  // 5. Generar y enviar documentos después de guardar.
  // Si falla el correo no se revierte una responsiva
  // que ya se registró correctamente.
  const folio = crearFolioResponsiva(IdResponsiva);
  let correoEnviado = false;

  if (Correo) {
    try {
      const { pdfBuffer } =
        await generarPdfResponsiva(IdResponsiva);

      await enviarCorreoResponsiva({
        correo: Correo,
        nombre: NombreReceptor,
        folio,
        pdfBuffer
      });

      correoEnviado = true;
    } catch (errorCorreo) {
      console.error(
        "Responsiva creada, pero falló el envío de correo:",
        errorCorreo
      );
    }
  }

  return {
    IdResponsiva,
    Folio: folio,
    correoEnviado
  };
};


const actualizarResponsiva = async (id, payload) => {
  const {
    Fecha,
    NombreReceptor,
    Puesto,
    Area,
    Correo,
    Comentario
  } = payload;

  if (!Fecha || !NombreReceptor || !Puesto) {
    lanzarError(
      "Fecha, nombre del receptor y puesto son obligatorios"
    );
  }

  if (
    Comentario !== undefined &&
    Comentario !== null &&
    typeof Comentario !== "string"
  ) {
    lanzarError("El comentario debe ser texto.");
  }

  const pool = await poolPromise;

  const existe = await pool.request()
    .input("IdResponsiva", sql.Int, id)
    .query(`
      SELECT IdResponsiva
      FROM dbo.Responsivas
      WHERE IdResponsiva = @IdResponsiva
    `);

  if (existe.recordset.length === 0) {
    lanzarError("Responsiva no encontrada", 404);
  }

  await pool.request()
    .input("IdResponsiva", sql.Int, id)
    .input("Fecha", sql.Date, Fecha)
    .input("NombreReceptor", sql.NVarChar(255), NombreReceptor)
    .input("Puesto", sql.NVarChar(255), Puesto)
    .input("Area", sql.NVarChar(255), Area || null)
    .input("Correo", sql.NVarChar(255), Correo || null)
    .input(
      "Comentario",
      sql.NVarChar(sql.MAX),
      Comentario?.trim() || null
    )
    .query(`
      UPDATE dbo.Responsivas
      SET
        Fecha = @Fecha,
        NombreReceptor = @NombreReceptor,
        Puesto = @Puesto,
        Area = @Area,
        Correo = @Correo,
        Comentario = @Comentario,
        FechaActualizacion = GETDATE()
      WHERE IdResponsiva = @IdResponsiva
    `);

  return {
    message: "Responsiva actualizada correctamente"
  };
};

/*esta es la función para el permiso de firma de responsiva*/
const autorizarEdicionFirma = async(id, permitir) => {
  const pool = await poolPromise;
  const existe = await pool.request()
    .input("IdResponsiva", id)
    .query(`
        SELECT IdResponsiva, PermitirEditarFirma FROM Responsivas WHERE IdResponsiva = @IdResponsiva`);
      
    if (existe.recordset.length === 0) {
      lanzarError("Responsiva no encontrada", 404);
    }

    await pool.request()
      .input("IdResponsiva", id)
      .input("PermitirEditarFirma", permitir ? 1 : 0)
      .query(`UPDATE Responsivas 
        SET PermitirEditarFirma = @PermitirEditarFirma, 
        FechaActualizacion = GETDATE()
        WHERE IdResponsiva = @IdResponsiva`);
      
        return{
          message: permitir ? "Edición de firma autorizada correctamente" : "Edición de firma desautorizada correctamente",
          PermitirEditarFirma: permitir ? 1 : 0
        };
};

/*Permitir guardar la girma*/
const actualizarFirmaResponsiva = async (
  id,
  FirmaBase64
) => {
  if (!FirmaBase64 || !FirmaBase64.trim()) {
    lanzarError("La firma es obligatoria");
  }

  const pool = await poolPromise;

  const existe = await pool
    .request()
    .input("IdResponsiva", id)
    .query(`
      SELECT
        IdResponsiva,
        PermitirEditarFirma
      FROM Responsivas
      WHERE IdResponsiva = @IdResponsiva
    `);

  if (existe.recordset.length === 0) {
    lanzarError(
      "Responsiva no encontrada",
      404
    );
  }

  const permisoFirma =
    Number(
      existe.recordset[0].PermitirEditarFirma
    ) === 1;
/*
  console.log(
    "AUTORIZACIÓN FIRMA:",
    {
      IdResponsiva: id,
      PermitirEditarFirma:
        existe.recordset[0].PermitirEditarFirma,
      permisoFirma
    }
  );*/

  if (!permisoFirma) {
    lanzarError(
      "La edición de firma no está autorizada para esta responsiva",
      403
    );
  }

  const resultado = await pool
    .request()
    .input("IdResponsiva", id)
    .input("FirmaBase64", FirmaBase64)
    .query(`
      UPDATE Responsivas
      SET
        FirmaBase64 = @FirmaBase64,
        PermitirEditarFirma = 0,
        FechaActualizacion = GETDATE()
      WHERE IdResponsiva = @IdResponsiva
        AND PermitirEditarFirma = 1
    `);

  if (resultado.rowsAffected[0] === 0) {
    lanzarError(
      "La edición de firma ya no está autorizada para esta responsiva",
      403
    );
  }

  return {
    message: "Firma actualizada correctamente",
    PermitirEditarFirma: 0
  };
};

const obtenerResponsivas = async () => {
  const pool = await poolPromise; //espera un pool de conexión

  const result = await pool.request().query(`
    SELECT
      r.IdResponsiva,

      CONCAT(
        'RESP-',
        RIGHT(
          '00000' + CAST(r.IdResponsiva AS VARCHAR(10)),
          5
        )
      ) AS Folio,
--concatena el folio

      r.Fecha,
      r.NombreReceptor,
      r.Puesto,
      r.Area,
      r.Correo,
      r.CorreoCreador,
      r.Estado,
      r.PermitirEditarFirma,
      r.FechaCreacion,
      r.FechaActualizacion,

      STRING_AGG(
        rd.Descripcion,
        ' | '
      ) AS Equipos,

      STRING_AGG(
        rd.Marca,
        ' | '
      ) AS Marcas,

      STRING_AGG(
        rd.Modelo,
        ' | '
      ) AS Modelos,

      STRING_AGG(
        rd.NoSerie,
        ' | '
      ) AS Series

    FROM Responsivas r

    --join con la tabla responsiva_detalle
    LEFT JOIN Responsiva_Detalle rd
      ON rd.IdResponsiva = r.IdResponsiva

    GROUP BY
      r.IdResponsiva,
      r.Fecha,
      r.NombreReceptor,
      r.Puesto,
      r.Area,
      r.Correo,
      r.CorreoCreador,
      r.Estado,
      r.PermitirEditarFirma,
      r.FechaCreacion,
      r.FechaActualizacion

    ORDER BY
      r.IdResponsiva DESC
  `);

  return result.recordset;
};

const obtenerResponsivaPorId = async (id) => {
  const pool = await poolPromise;

  const responsiva = await pool.request()
    .input("IdResponsiva", id)
    .query(`
      SELECT
        *,
        CONCAT('RESP-', RIGHT('00000' + CAST(IdResponsiva AS VARCHAR(10)), 5)) AS Folio
      FROM Responsivas
      WHERE IdResponsiva = @IdResponsiva
    `);

  if (responsiva.recordset.length === 0) {
    lanzarError("Responsiva no encontrada", 404);
  }

  const detalle = await pool.request()
    .input("IdResponsiva", id)
    .query(`
      SELECT *
      FROM Responsiva_Detalle
      WHERE IdResponsiva = @IdResponsiva
      ORDER BY IdDetalle ASC
    `);

  return {
    responsiva: responsiva.recordset[0],
    equipos: detalle.recordset
  };
};

const obtenerResponsivasPorEquipo = async (idInventario) => {
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
      INNER JOIN Responsivas r
        ON rd.IdResponsiva = r.IdResponsiva
      WHERE rd.IdInventario = @IdInventario
      ORDER BY r.Fecha DESC, r.IdResponsiva DESC
    `);

  const historial = result.recordset;
  const activa = historial.find((item) => !item.Devuelto) || null;

  return {
    activa,
    historial
  };
};

const generarPdfPorId = async (id) => {
  return generarPdfResponsiva(id);
};

const reenviarResponsivaCorreo = async (id) => {
  const {
    pdfBuffer,
    responsiva,
    folio
  } = await generarPdfResponsiva(id);

  if (!responsiva.Correo) {
    lanzarError("La responsiva no tiene correo registrado");
  }

  await enviarCorreoResponsiva({
    correo: responsiva.Correo,
    nombre: responsiva.NombreReceptor,
    folio,
    pdfBuffer
  });

  return {
    message: "Responsiva reenviada correctamente por correo"
  };
};


const marcarEquipoDevuelto = async (
  idDetalle,
  ComentariosDevolucion
) => {
  const id = Number(idDetalle);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > 2147483647
  ) {
    lanzarError(
      "Identificador de detalle inválido.",
      400
    );
  }

  const pool = await poolPromise;
  const transaccion = new sql.Transaction(pool);

  let iniciada = false;

  try {
    await transaccion.begin(
      sql.ISOLATION_LEVEL.READ_COMMITTED
    );

    iniciada = true;

    // 1. Obtener y bloquear la asignación.
    const detalle = await new sql.Request(transaccion)
      .input("IdDetalle", sql.Int, id)
      .query(`
        SELECT
          RD.IdDetalle,
          RD.IdInventario,
          RD.IdResponsiva,
          RD.Devuelto,
          R.Estado AS EstadoResponsiva
        FROM dbo.Responsiva_Detalle AS RD
          WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.Responsivas AS R
          ON R.IdResponsiva = RD.IdResponsiva
        WHERE RD.IdDetalle = @IdDetalle;
      `);

    if (!detalle.recordset.length) {
      lanzarError(
        "Detalle de responsiva no encontrado.",
        404
      );
    }

    const {
      IdInventario,
      IdResponsiva,
      Devuelto,
      EstadoResponsiva
    } = detalle.recordset[0];

    // 2. Evitar devoluciones duplicadas.
    if (Number(Devuelto) === 1) {
      lanzarError(
        "Este equipo ya fue devuelto anteriormente.",
        409
      );
    }

    if (EstadoResponsiva !== "ACTIVA") {
      lanzarError(
        "La responsiva no está activa.",
        409
      );
    }

    // 3. Bloquear y validar el equipo de inventario.
    if (IdInventario != null) {
      const equipo = await new sql.Request(transaccion)
        .input(
          "IdInventario",
          sql.Int,
          IdInventario
        )
        .query(`
          SELECT
            id,
            ID_ESTATUS,
            RESPONSIVA_DIGITAL,
            NUM_RESPONSIVA
          FROM dbo.INVENTARIO_M
            WITH (UPDLOCK, HOLDLOCK)
          WHERE id = @IdInventario;
        `);

      if (!equipo.recordset.length) {
        lanzarError(
          "El equipo asociado ya no existe en inventario.",
          404
        );
      }

      const registro = equipo.recordset[0];

      if (
        Number(registro.ID_ESTATUS) !== 2 ||
        Number(registro.NUM_RESPONSIVA) !==
          Number(IdResponsiva) ||
        Number(registro.RESPONSIVA_DIGITAL) !== 1
      ) {
        lanzarError(
          "El estado o la responsiva del equipo no coinciden con esta devolución.",
          409
        );
      }
    }

    // 4. Registrar la devolución.
    const devolucion = await new sql.Request(
      transaccion
    )
      .input("IdDetalle", sql.Int, id)
      .input(
        "ComentariosDevolucion",
        sql.NVarChar(sql.MAX),
        ComentariosDevolucion || null
      )
      .query(`
        UPDATE dbo.Responsiva_Detalle
        SET
          Devuelto = 1,
          FechaDevolucion = GETDATE(),
          ComentariosDevolucion =
            @ComentariosDevolucion
        WHERE IdDetalle = @IdDetalle
          AND ISNULL(Devuelto, 0) = 0;
      `);

    if (devolucion.rowsAffected[0] !== 1) {
      lanzarError(
        "No fue posible registrar la devolución.",
        409
      );
    }

    // 5. Cambiar el equipo a Disponible.
    if (IdInventario != null) {
      const actualizacion = await new sql.Request(
        transaccion
      )
        .input(
          "IdInventario",
          sql.Int,
          IdInventario
        )
        .input(
          "IdResponsiva",
          sql.Int,
          IdResponsiva
        )
        .query(`
          UPDATE dbo.INVENTARIO_M
          SET
            ID_ESTATUS = 1,
            RESPONSIVA_DIGITAL = 0,
            NUM_RESPONSIVA = NULL
          WHERE id = @IdInventario
            AND ID_ESTATUS = 2
            AND RESPONSIVA_DIGITAL = 1
            AND NUM_RESPONSIVA = @IdResponsiva;
        `);

      if (actualizacion.rowsAffected[0] !== 1) {
        lanzarError(
          "No fue posible liberar el equipo en inventario.",
          409
        );
      }
    }

    // 6. Comprobar equipos pendientes.
    const pendientes = await new sql.Request(
      transaccion
    )
      .input(
        "IdResponsiva",
        sql.Int,
        IdResponsiva
      )
      .query(`
        SELECT COUNT(*) AS Pendientes
        FROM dbo.Responsiva_Detalle
        WHERE IdResponsiva = @IdResponsiva
          AND ISNULL(Devuelto, 0) = 0;
      `);

    const totalPendientes = Number(
      pendientes.recordset[0].Pendientes
    );

    // 7. Cerrar la responsiva solo cuando
    // todos los equipos hayan sido devueltos.
    if (totalPendientes === 0) {
      const cierre = await new sql.Request(
        transaccion
      )
        .input(
          "IdResponsiva",
          sql.Int,
          IdResponsiva
        )
        .query(`
          UPDATE dbo.Responsivas
          SET Estado = 'INACTIVA'
          WHERE IdResponsiva = @IdResponsiva
            AND Estado = 'ACTIVA';
        `);

      if (cierre.rowsAffected[0] !== 1) {
        lanzarError(
          "No fue posible cerrar la responsiva.",
          409
        );
      }
    }

    // 8. Confirmar todas las modificaciones.
    await transaccion.commit();
    iniciada = false;

    return {
      message: "Equipo devuelto correctamente.",
      IdDetalle: id,
      IdInventario,
      IdResponsiva,
      estatusEquipo: IdInventario != null
        ? "Disponible"
        : null,
      equiposPendientes: totalPendientes,
      estadoResponsiva: totalPendientes === 0
        ? "INACTIVA"
        : "ACTIVA"
    };

  } catch (error) {
    if (iniciada) {
      try {
        await transaccion.rollback();
      } catch (errorRollback) {
        console.error(
          "Error revirtiendo devolución:",
          errorRollback
        );
      }
    }

    throw error;
  }
};


const actualizarComentariosDevolucion = async (
  idDetalle,
  ComentariosDevolucion
) => {
  const id = Number(idDetalle);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > 2147483647
  ) {
    lanzarError("Identificador de detalle inválido.", 400);
  }

  if (
    ComentariosDevolucion !== null &&
    ComentariosDevolucion !== undefined &&
    typeof ComentariosDevolucion !== "string"
  ) {
    lanzarError("Los comentarios deben ser texto.", 400);
  }

  const comentario = ComentariosDevolucion?.trim() || null;

  const pool = await poolPromise;

  const resultado = await pool.request()
    .input("IdDetalle", sql.Int, id)
    .input(
      "ComentariosDevolucion",
      sql.NVarChar(sql.MAX),
      comentario
    )
    .query(`
      UPDATE dbo.Responsiva_Detalle
      SET ComentariosDevolucion = @ComentariosDevolucion
      OUTPUT
        INSERTED.IdDetalle,
        INSERTED.ComentariosDevolucion,
        INSERTED.Devuelto,
        INSERTED.FechaDevolucion
      WHERE IdDetalle = @IdDetalle
        AND Devuelto = 1;
    `);

  if (resultado.recordset.length === 0) {
    lanzarError(
      "No se encontró el detalle o el equipo todavía no ha sido devuelto.",
      409
    );
  }

  return {
    message: "Comentarios de devolución actualizados correctamente.",
    ...resultado.recordset[0]
  };
};


const obtenerEquiposDisponibles = async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      i.id,
      i.NOMBRE_EQUIPO,
      i.SERIAL,
      i.MODELO,

      i.id_sistema_operativo AS ID_SISTEMA_OPERATIVO,
      so.Nombre AS SISTEMA_OPERATIVO,
      so.N_Version AS VERSION_SISTEMA_OPERATIVO,

      i.ID_TIPO_EQUIPO,
      te.tequipo AS TIPO_EQUIPO,
      i.ID_MARCA,
      m.Marca AS MARCA,
      i.ID_ESTATUS,
      e.Estatus_equipo AS ESTATUS

    FROM INVENTARIO_M i

    LEFT JOIN SISTEMAS_OPERATIVOS so
      ON i.id_sistema_operativo = so.id

    LEFT JOIN Tipo_equipo te
      ON i.ID_TIPO_EQUIPO = te.id

    LEFT JOIN Marcas m
      ON i.ID_MARCA = m.id

    LEFT JOIN Estatus e
      ON i.ID_ESTATUS = e.Id

   WHERE
  UPPER(LTRIM(RTRIM(e.Estatus_equipo))) = 'DISPONIBLE'
  AND NOT EXISTS (
    SELECT 1
    FROM Responsiva_Detalle rd
    WHERE rd.IdInventario = i.id
      AND ISNULL(rd.Devuelto, 0) = 0
  )
    ORDER BY i.id DESC
  `);

  return result.recordset;
};
const eliminarResponsiva = async (id) => {
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
    .input("IdResponsiva", IdResponsiva)
    .query(`
      UPDATE INVENTARIO_M
      SET
        RESPONSIVA_DIGITAL = 1,
        NUM_RESPONSIVA = @IdResponsiva
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

  return {
    message: "Responsiva eliminada correctamente"
  };
};

//PDF DE DEVOLUCION

const generarComprobanteDevolucion = async (idDetalle, correoAutoriza) => {
  const id = Number(idDetalle);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > 2147483647
  ) {
    lanzarError("Identificador de detalle inválido", 400);
  }

  const pool = await poolPromise;

  const usuarioResultado = await pool.request()
    .input("Correo", sql.NVarChar(255), correoAutoriza)
    .query(`
      SELECT TOP(1)
      Nombre, Correo
        FROM dbo.Usuarios
        WHERE LOWER(LTRIM(RTRIM(Correo))) = LOWER(LTRIM(RTRIM(@Correo)));
      `);
  if (usuarioResultado.recordset.length === 0) {
    lanzarError("No se encontró el usuario autenticado", 404);
  } 
  const nombreAutoriza =
  usuarioResultado.recordset[0].Nombre;

  const resultado = await pool.request()
    .input("IdDetalle", id)
    .query(`
      SELECT
        rd.IdDetalle,
        rd.IdResponsiva,
        rd.IdInventario,
        rd.Descripcion,
        rd.Marca,
        rd.Modelo,
        rd.NoSerie,
        rd.Devuelto,
        rd.FechaDevolucion,
        rd.ComentariosDevolucion,

        r.NombreReceptor,
        r.Puesto,
        r.Area

      FROM dbo.Responsiva_Detalle AS rd

      INNER JOIN dbo.Responsivas AS r
        ON r.IdResponsiva = rd.IdResponsiva

      WHERE rd.IdDetalle = @IdDetalle;
    `);

  if (resultado.recordset.length === 0) {
    lanzarError(
      "No se encontró el detalle de la responsiva",
      404
    );
  }

  const registro = resultado.recordset[0];

  if (!registro.Devuelto || !registro.FechaDevolucion) {
    lanzarError(
      "El equipo todavía no tiene una devolución registrada",
      409
    );
  }

  const folioResponsiva =
    crearFolioResponsiva(registro.IdResponsiva);

  const folio =
    `DEV-${String(registro.IdResponsiva).padStart(5, "0")}` +
    `-${String(registro.IdDetalle).padStart(4, "0")}`;

  const pdfBuffer = await generarPdfDevolucion({
    folio,
    folioResponsiva,
    fechaDevolucion: registro.FechaDevolucion,
    nombreReceptor: registro.NombreReceptor,
    puesto: registro.Puesto,
    area: registro.Area,
    nombreAutoriza,
    descripcion: registro.Descripcion,
    marca: registro.Marca,
    modelo: registro.Modelo,
    noSerie: registro.NoSerie,
    idInventario: registro.IdInventario,
    comentarios: registro.ComentariosDevolucion
  });

  return {
    folio,
    pdfBuffer
  };
};


module.exports = {
  crearResponsiva,
  actualizarResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  obtenerResponsivasPorEquipo,
  generarPdfPorId,
  reenviarResponsivaCorreo,
  marcarEquipoDevuelto,
  obtenerEquiposDisponibles,
  eliminarResponsiva,
  autorizarEdicionFirma,
  actualizarFirmaResponsiva,
  generarComprobanteDevolucion,
  actualizarComentariosDevolucion
};