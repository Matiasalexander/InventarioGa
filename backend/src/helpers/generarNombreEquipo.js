const generarNombreEquipo = async (
  pool,
  ID_TIPO_EQUIPO,
  SISTEMA_OPERATIVO,
  FECHA_FABRICACION
) => {
  if (!ID_TIPO_EQUIPO || !SISTEMA_OPERATIVO || !FECHA_FABRICACION) {
    throw new Error(
      "Tipo de equipo, sistema operativo y fecha de fabricación son obligatorios para generar el nombre del equipo"
    );
  }

  const tipoResult = await pool.request()
    .input("ID_TIPO_EQUIPO", ID_TIPO_EQUIPO)
    .query(`
      SELECT tequipo
      FROM Tipo_equipo
      WHERE id = @ID_TIPO_EQUIPO
    `);

  if (tipoResult.recordset.length === 0) {
    throw new Error("Tipo de equipo no encontrado");
  }

  const tipoEquipo = tipoResult.recordset[0].tequipo;

  const prefijoTipo = tipoEquipo
    .substring(0, 2)
    .toUpperCase();

  const prefijoSO = SISTEMA_OPERATIVO
    .substring(0, 1)
    .toUpperCase();

  const anio = new Date(FECHA_FABRICACION)
    .getFullYear()
    .toString()
    .slice(-2);

  const base = `${prefijoTipo}${anio}${prefijoSO}-`;
    const countResult = await pool.request()
    .query(`SELECT COUNT(*) AS total FROM INVENTARIO_M WHERE NOMBRE_EQUIPO <> 'NA'`);

  let consecutivo = countResult.recordset[0].total + 1;
  let nombreEquipo;
  let existe = true;

  while (existe) {
    nombreEquipo = `${base}${String(consecutivo).padStart(3, "0")}`;

    const check = await pool.request()
      .input("NOMBRE_EQUIPO", nombreEquipo)
      .query(`SELECT id FROM INVENTARIO_M WHERE NOMBRE_EQUIPO = @NOMBRE_EQUIPO`);

    if (check.recordset.length === 0) {
      existe = false;
    } else {
      consecutivo++;
    }
  }

  return nombreEquipo;
};

module.exports = generarNombreEquipo;