# Backend Inicial - Inventario GA2

Documentación paso a paso para iniciar el backend del sistema Inventario GA2 utilizando Node.js, Express y SQL Server.

---

# Paso 0 - Crear estructura inicial

```bash
INVENTARIOGA/
└── backend/
    ├── .gitignore
    └── package.json
```

---

# Paso 1 - Instalar paquetes

```bash
npm install express mssql cors dotenv bcryptjs jsonwebtoken
```

```bash
npm install nodemon --save-dev
```

---

# Paso 2 - Configurar scripts

## Archivo

```bash
backend/package.json
```

## Reemplazar

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

## Por

```json
"scripts": {
  "dev": "nodemon src/server.js"
}
```

---

# Paso 3 - Crear estructura `src`

```bash
src/
├── config/
├── controllers/
└── routes/
```

---

# Paso 4 - Crear archivos

```bash
src/config/db.js
src/controllers/inventario.controller.js
src/routes/inventario.routes.js
src/server.js
```

---

# Paso 5 - Crear archivo `.env`

```env
DB_USER=sa
DB_PASSWORD=tu_password
DB_SERVER=localhost
DB_DATABASE=InventarioGa2
DB_PORT=1433

PORT=3001
```

---

# Paso 6 - Código `db.js`

```javascript
const sql = require('mssql')
require('dotenv').config()

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT),

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
}

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log('✅ Conectado a SQL Server')
    return pool
  })
  .catch((err) => {
    console.error('❌ Error SQL:', err)
  })

module.exports = {
  sql,
  poolPromise,
}
```

---

# Paso 7 - Código `server.js`

```javascript
const express = require('express')
const cors = require('cors')
require('dotenv').config()

require('./config/db')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('🚀 API Inventario GA2 funcionando')
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`)
})
```

---

# Paso 8 - Ejecutar servidor

```bash
npm run dev
```

---

# Resultado esperado

```bash
🔥 Servidor corriendo en puerto 3001
✅ Conectado a SQL Server
```
