# API REST - Endpoint DELETE Inventario

Documentación del endpoint **DELETE** para eliminar registros de la tabla `INVENTARIO_M` utilizando Node.js, Express y SQL Server.

---

# Paso 1 - Agregar función `eliminarInventario`

```javascript
const eliminarInventario = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', id).query(`
        DELETE FROM INVENTARIO_M
        WHERE id = @id
      `)

    res.json({
      message: 'Equipo eliminado correctamente',
    })
  } catch (error) {
    console.error('Error eliminando inventario:', error)

    res.status(500).json({
      message: 'Error eliminando inventario',
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
  eliminarInventario,
}
```

---

# Paso 3 - Modificar `inventario.routes.js`

```javascript
const {
  obtenerInventario,
  crearInventario,
  actualizarInventario,
  eliminarInventario,
} = require('../controllers/inventario.controller')
```

---

# Paso 4 - Crear ruta DELETE

```javascript
router.get('/', obtenerInventario)
router.post('/', crearInventario)
router.put('/:id', actualizarInventario)
router.delete('/:id', eliminarInventario)
```

---

# Paso 5 - Probar endpoint DELETE

## Método

```http
DELETE
```

## URL

```bash
http://localhost:3001/api/inventario/EQ-001
```

---

# Resultado esperado

```json
{
  "message": "Equipo eliminado correctamente"
}
```

---

# Verificación

Abrir:

```bash
http://localhost:3001/api/inventario
```

El registro eliminado ya no debe aparecer.
