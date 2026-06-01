# API REST - Endpoint GET por ID Inventario

Documentación del endpoint **GET por ID** para consultar un único registro de la tabla `INVENTARIO_M` utilizando Node.js, Express y SQL Server.

---

# Paso 1 - Agregar función `obtenerInventarioPorId`

```javascript
const obtenerInventarioPorId = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    const result = await pool.request().input('id', id).query(`
        SELECT *
        FROM INVENTARIO_M
        WHERE id = @id
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Equipo no encontrado',
      })
    }

    res.json(result.recordset[0])
  } catch (error) {
    console.error('Error obteniendo equipo:', error)

    res.status(500).json({
      message: 'Error obteniendo equipo',
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
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario,
}
```

---

# Paso 3 - Modificar `inventario.routes.js`

```javascript
const {
  obtenerInventario,
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario,
} = require('../controllers/inventario.controller')
```

---

# Paso 4 - Crear ruta GET por ID

```javascript
router.get('/', obtenerInventario)
router.get('/:id', obtenerInventarioPorId)
router.post('/', crearInventario)
router.put('/:id', actualizarInventario)
router.delete('/:id', eliminarInventario)
```

---

# Paso 5 - Probar endpoint

## Método

```http
GET
```

## URL

```bash
http://localhost:3001/api/inventario/EQ-001
```

---

# Resultado esperado

```json
{
  "id": "EQ-001",
  "UNIDAD": "Corporativo",
  "LOCALIDAD": "Cancun",
  "UBICACION": "Direccion TI",
  "TIPO_EQUIPO": "Laptop",
  "NOMBRE_EQUIPO": "LAP-SIST-001",
  "SERIAL": "ABC123456"
}
```

---

# Si el equipo no existe

```json
{
  "message": "Equipo no encontrado"
}
```
