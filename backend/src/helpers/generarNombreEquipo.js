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

  const prefijo = `${prefijoTipo}${prefijoSO}${anio}`;

  const ultimoResult = await pool.request()
    .input("Prefijo", `${prefijo}-%`)
    .query(`
      SELECT TOP 1 NOMBRE_EQUIPO
      FROM INVENTARIO_M
      WHERE NOMBRE_EQUIPO LIKE @Prefijo
      ORDER BY NOMBRE_EQUIPO DESC
    `);

  let consecutivo = 1;

  if (ultimoResult.recordset.length > 0) {
    const ultimoNombre = ultimoResult.recordset[0].NOMBRE_EQUIPO;
    const ultimoNumero = parseInt(ultimoNombre.split("-")[1], 10);

    consecutivo = ultimoNumero + 1;
  }

  const consecutivoFormateado = String(consecutivo).padStart(3, "0");

  return `${prefijo}-${consecutivoFormateado}`;
};

module.exports = generarNombreEquipo;