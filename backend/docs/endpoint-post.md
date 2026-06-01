# API REST - Endpoint POST Inventario

Documentación del endpoint **POST** para insertar registros en la tabla `INVENTARIO_M` utilizando Node.js, Express y SQL Server.

---

# Paso 1 - Modificar `inventario.controller.js`

```javascript
const crearInventario = async (req, res) => {
  try {
    const {
      id,
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
        INSERT INTO INVENTARIO_M (
          id,
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
          CORREO
        )
        VALUES (
          @id,
          @UNIDAD,
          @LOCALIDAD,
          @UBICACION,
          @TIPO_EQUIPO,
          @NOMBRE_EQUIPO,
          @SERIAL,
          @MARCA,
          @MODELO,
          @IP,
          @ESTATUS,
          @ESTADO_FISICO,
          @CORREO
        )
      `)

    res.status(201).json({
      message: 'Equipo agregado correctamente',
    })
  } catch (error) {
    console.error('Error creando inventario:', error)

    res.status(500).json({
      message: 'Error creando inventario',
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
}
```

---

# Paso 3 - Modificar `inventario.routes.js`

```javascript
const express = require('express')
const router = express.Router()

const {
  obtenerInventario,
  crearInventario,
} = require('../controllers/inventario.controller')

router.get('/', obtenerInventario)
router.post('/', crearInventario)

module.exports = router
```

---

# Paso 4 - Probar endpoint POST

## Método

```http
POST
```

## URL

```bash
http://localhost:3001/api/inventario
```

---

# Paso 5 - JSON de prueba

```json
{
  "id": "EQ-001",
  "UNIDAD": "Corporativo",
  "LOCALIDAD": "Cancun",
  "UBICACION": "Sistemas",
  "TIPO_EQUIPO": "Laptop",
  "NOMBRE_EQUIPO": "LAP-SIST-001",
  "SERIAL": "ABC123456",
  "MARCA": "Dell",
  "MODELO": "G3 3500",
  "IP": "192.168.1.50",
  "ESTATUS": "Activo",
  "ESTADO_FISICO": "Bueno",
  "CORREO": "prueba@grupoandersons.com"
}
```

---

# Resultado esperado

```json
{
  "message": "Equipo agregado correctamente"
}
```
