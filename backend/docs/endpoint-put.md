# API REST - Endpoint PUT Inventario

Documentación del endpoint **PUT** para actualizar registros en la tabla `INVENTARIO_M` utilizando Node.js, Express y SQL Server.

---

# Paso 1 - Agregar función `actualizarInventario`

```javascript
const actualizarInventario = async (req, res) => {
  try {
    const { id } = req.params

    const {
      UNIDAD,
      LOCALIDAD,
      UBICACION,
      TIPO_EQUIPO,
      NOMBRE_EQUIPO,
      SERIAL,
      MARCA,
      MODELO,
      IP,
      ESTATUS,
      ESTADO_FISICO,
      CORREO,
    } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('id', id)
      .input('UNIDAD', UNIDAD)
      .input('LOCALIDAD', LOCALIDAD)
      .input('UBICACION', UBICACION)
      .input('TIPO_EQUIPO', TIPO_EQUIPO)
      .input('NOMBRE_EQUIPO', NOMBRE_EQUIPO)
      .input('SERIAL', SERIAL)
      .input('MARCA', MARCA)
      .input('MODELO', MODELO)
      .input('IP', IP)
      .input('ESTATUS', ESTATUS)
      .input('ESTADO_FISICO', ESTADO_FISICO)
      .input('CORREO', CORREO).query(`
        UPDATE INVENTARIO_M
        SET
          UNIDAD = @UNIDAD,
          LOCALIDAD = @LOCALIDAD,
          UBICACION = @UBICACION,
          TIPO_EQUIPO = @TIPO_EQUIPO,
          NOMBRE_EQUIPO = @NOMBRE_EQUIPO,
          SERIAL = @SERIAL,
          MARCA = @MARCA,
          MODELO = @MODELO,
          IP = @IP,
          ESTATUS = @ESTATUS,
          ESTADO_FISICO = @ESTADO_FISICO,
          CORREO = @CORREO
        WHERE id = @id
      `)

    res.json({
      message: 'Equipo actualizado correctamente',
    })
  } catch (error) {
    console.error('Error actualizando inventario:', error)

    res.status(500).json({
      message: 'Error actualizando inventario',
      error: error.message,
    })
  }
}
```

---

# Paso 2 - Exportar función

```javascript
module.exports = {
  obtenerInventario,
  crearInventario,
  actualizarInventario,
}
```

---

# Paso 3 - Modificar `inventario.routes.js`

```javascript
const {
  obtenerInventario,
  crearInventario,
  actualizarInventario,
} = require('../controllers/inventario.controller')
```

---

# Paso 4 - Crear ruta PUT

```javascript
router.get('/', obtenerInventario)
router.post('/', crearInventario)
router.put('/:id', actualizarInventario)
```

---

# Paso 5 - Probar endpoint PUT

## Método

```http
PUT
```

## URL

```bash
http://localhost:3001/api/inventario/EQ-001
```

---

# Paso 6 - JSON de prueba

```json
{
  "UNIDAD": "Corporativo",
  "LOCALIDAD": "Cancun",
  "UBICACION": "Direccion TI",
  "TIPO_EQUIPO": "Laptop",
  "NOMBRE_EQUIPO": "LAP-SIST-001",
  "SERIAL": "ABC123456",
  "MARCA": "Dell",
  "MODELO": "G3 3500",
  "IP": "192.168.1.99",
  "ESTATUS": "Mantenimiento",
  "ESTADO_FISICO": "Regular",
  "CORREO": "nuevo@grupoandersons.com"
}
```

---

# Resultado esperado

```json
{
  "message": "Equipo actualizado correctamente"
}
```
