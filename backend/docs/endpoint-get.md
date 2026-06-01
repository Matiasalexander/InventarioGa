# API REST - Endpoint GET Inventario

Documentación de la creación del primer endpoint **GET** para consultar el inventario desde SQL Server utilizando Node.js y Express.

---

# Paso 1 - `inventario.controller.js`

```javascript
const { poolPromise } = require('../config/db')

const obtenerInventario = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT TOP 100
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
      FROM INVENTARIO_M
      ORDER BY UNIDAD, TIPO_EQUIPO
    `)

    res.json(result.recordset)
  } catch (error) {
    console.error('Error obteniendo inventario:', error)

    res.status(500).json({
      message: 'Error obteniendo inventario',
      error: error.message,
    })
  }
}

module.exports = {
  obtenerInventario,
}
```

---

# Paso 2 - `inventario.routes.js`

```javascript
const express = require('express')
const router = express.Router()

const { obtenerInventario } = require('../controllers/inventario.controller')

router.get('/', obtenerInventario)

module.exports = router
```

---

# Paso 3 - Modificar `server.js`

## Agregar

```javascript
const inventarioRoutes = require('./routes/inventario.routes')
```

## Debajo de

```javascript
app.use(express.json())
```

## Agregar

```javascript
app.use('/api/inventario', inventarioRoutes)
```

---

# Paso 4 - Probar endpoint

## Abrir en navegador

```bash
http://localhost:3001/api/inventario
```

---

# Resultado esperado

```json
[]
```

Esto significa:

- ✅ Endpoint funcionando
- ✅ Express funcionando
- ✅ SQL Server conectado
- ✅ Query funcionando
- ✅ API respondiendo correctamente
- ✅ Tabla aún vacía

---

# Conceptos REST API

```text
GET     -> Consultar registros
POST    -> Insertar registros
PUT     -> Actualizar registros
DELETE  -> Eliminar registros
```
