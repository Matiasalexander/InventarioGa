# 🚀 Inventario GA2 API

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5.x-black?logo=express)
![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC2927?logo=microsoftsqlserver)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?logo=javascript&logoColor=black)
![REST API](https://img.shields.io/badge/API-REST-blue)
![CRUD](https://img.shields.io/badge/CRUD-Complete-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-green)

Sistema de gestión de inventario desarrollado con **Node.js**, **Express** y **SQL Server** para la administración y control de activos tecnológicos dentro de una organización.

---

# 📋 Tabla de Contenidos

## Tabla de contenido

- [Descripción](#-descripción)
- [Objetivos](#-objetivos)
- [Características](#-características)
- [Arquitectura](#️-arquitectura)
- [Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#️-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Ejecución del Proyecto](#-ejecución-del-proyecto)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Endpoints Disponibles](#-endpoints-disponibles)
- [Documentación de Desarrollo](#-documentación-de-desarrollo)
- [Pruebas](#-pruebas)
- [Roadmap](#-roadmap)
- [Contribuciones](#-contribuciones)
- [Licencia](#-licencia)
- [Autor](#-autor)

---

# 📖 Descripción

Inventario GA2 es una API REST diseñada para centralizar la administración de equipos tecnológicos y activos de infraestructura.

La plataforma permite registrar, consultar, actualizar y eliminar información de inventario mediante una arquitectura modular basada en Node.js, Express y SQL Server.

Su diseño facilita la integración con aplicaciones web, móviles y sistemas empresariales.

---

# 🎯 Objetivos

- Centralizar la información de los activos tecnológicos.
- Facilitar el control y seguimiento de equipos.
- Mantener la trazabilidad de los recursos tecnológicos.
- Proporcionar una API REST escalable y mantenible.
- Permitir la integración con futuros módulos de autenticación y dashboards.

---

# ✨ Características

- ✅ CRUD completo de inventario.
- ✅ Consulta general de equipos.
- ✅ Consulta individual por ID.
- ✅ Registro de nuevos equipos.
- ✅ Actualización de información.
- ✅ Eliminación de registros.
- ✅ Integración con SQL Server.
- ✅ Arquitectura modular.
- ✅ Variables de entorno.
- ✅ Manejo de errores HTTP.
- ✅ Preparado para autenticación JWT.

---

# 🏗️ Arquitectura

## Arquitectura General

```text
Cliente
   │
   ▼
Express API
   │
   ├── Routes
   │
   ├── Controllers
   │
   └── SQL Server
```

## Flujo de Peticiones

```text
HTTP Request
      │
      ▼
   Routes
      │
      ▼
 Controllers
      │
      ▼
 SQL Server
      │
      ▼
 JSON Response
```

---

# 🛠️ Tecnologías Utilizadas

| Tecnología | Descripción |
|------------|------------|
| Node.js | Runtime de JavaScript |
| Express.js | Framework para APIs REST |
| SQL Server | Base de datos relacional |
| MSSQL | Driver de conexión |
| dotenv | Variables de entorno |
| cors | Configuración de CORS |
| Nodemon | Recarga automática |
| bcryptjs | Hash de contraseñas |
| jsonwebtoken | Autenticación JWT |

---

# 📦 Requisitos Previos

Antes de ejecutar el proyecto asegúrate de tener instalado:

- Node.js 18 o superior
- SQL Server 2019 o superior
- SQL Server Management Studio (SSMS)
- Git
- Visual Studio Code

Verificar versiones:

```bash
node -v
npm -v
git --version
```

---

# ⚙️ Instalación

## Clonar repositorio

```bash
git clone https://github.com/Matiasalexander/InventarioGa.git
```

## Ingresar al proyecto

```bash
cd InventarioGa/backend
```

## Instalar dependencias

```bash
npm install
```

---

# 🔐 Variables de Entorno

Crear archivo:

```bash
.env
```

Agregar:

```env
DB_USER=sa
DB_PASSWORD=tu_password
DB_SERVER=localhost
DB_DATABASE=InventarioGa2
DB_PORT=1433

PORT=3001
```

---

# 🚀 Ejecución del Proyecto

Iniciar en modo desarrollo:

```bash
npm run dev
```

Resultado esperado:

```bash
🔥 Servidor corriendo en puerto 3001
✅ Conectado a SQL Server
```

---

# 📂 Estructura del Proyecto

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   └── inventario.controller.js
│   │
│   ├── routes/
│   │   └── inventario.routes.js
│   │
│   └── server.js
│
├── docs/
│   │
│   ├── backend-inicial.md
│   ├── endpoint-get.md
│   ├── endpoint-get-by-id.md
│   ├── endpoint-post.md
│   ├── endpoint-put.md
│   └── endpoint-delete.md
│
├── README.md
├── .env
├── package.json
└── .gitignore
frontend/
│
├── public/
│   │
│   ├── favicon.svg
│   └── icons.svg
│
├── assets/
├── pages/
├── services/
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── .gitignore

```

---

# 🌐 Endpoints Disponibles

| Método | Endpoint | Descripción |
|----------|----------|-------------|
| GET | `/api/inventario` | Obtener todos los equipos |
| GET | `/api/inventario/:id` | Obtener equipo por ID |
| POST | `/api/inventario` | Registrar nuevo equipo |
| PUT | `/api/inventario/:id` | Actualizar equipo |
| DELETE | `/api/inventario/:id` | Eliminar equipo |

---

# 📚 Documentación de Desarrollo

## Backend Inicial

Esta sección contiene las guías paso a paso utilizadas durante la construcción de la API REST.

| Documento | Descripción |
|------------|------------|
| [Backend Inicial](docs/backend-inicial.md) | Configuración inicial del proyecto y conexión a SQL Server |
| [Endpoint GET](docs/endpoint-get.md) | Consulta de inventario |
| [Endpoint GET por ID](docs/endpoint-get-by-id.md) | Consulta individual de equipos |
| [Endpoint POST](docs/endpoint-post.md) | Registro de nuevos equipos |
| [Endpoint PUT](docs/endpoint-put.md) | Actualización de equipos |
| [Endpoint DELETE](docs/endpoint-delete.md) | Eliminación de equipos |

## Endpoint GET

Permite consultar registros del inventario.

```http
GET /api/inventario
```

---

## Endpoint GET por ID

Permite consultar un único equipo.

```http
GET /api/inventario/:id
```

---

## Endpoint POST

Permite registrar nuevos equipos.

```http
POST /api/inventario
```

---

## Endpoint PUT

Permite actualizar información existente.

```http
PUT /api/inventario/:id
```

---

## Endpoint DELETE

Permite eliminar registros.

```http
DELETE /api/inventario/:id
```

---

# 🧪 Pruebas

Se recomienda utilizar cualquiera de las siguientes herramientas:

- Bruno
- Postman
- Thunder Client

Ejemplo:

```http
GET http://localhost:3001/api/inventario
```

---

# 🔮 Roadmap

## Versión 1.0

- [x] Conexión SQL Server
- [x] Endpoint GET
- [x] Endpoint GET por ID
- [x] Endpoint POST
- [x] Endpoint PUT
- [x] Endpoint DELETE
- [x] CRUD completo

## Versión 2.0

- [ ] Login JWT
- [ ] Roles y permisos
- [ ] Dashboard React
- [ ] Auditoría de cambios
- [ ] Catálogos dinámicos

## Versión 3.0

- [ ] Swagger/OpenAPI
- [ ] Exportación Excel
- [ ] Exportación PDF
- [ ] Notificaciones
- [ ] Docker
- [ ] Integración CI/CD

---

# 🤝 Contribuciones

1. Crear un Fork del repositorio.
2. Crear una rama para tu funcionalidad.

```bash
git checkout -b feature/nueva-funcionalidad
```

3. Realizar cambios.
4. Crear Pull Request.

---

# 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**.

---

# 👨‍💻 Autor

- **Matias Arceo** - *Desarrollo Inicial* - [GitHub](https://github.com/Matiasalexander)

**Versión:** 1.0.0

**Última actualización:** Junio 2026
