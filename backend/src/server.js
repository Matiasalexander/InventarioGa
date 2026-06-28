const express = require("express");
const cors = require("cors");
require("dotenv").config();

const inventarioRoutes = require("./routes/inventario.routes");
const catalogosRoutes = require("./routes/catalogos.routes");
const marcasRoutes = require("./routes/marcas.routes");
const tipoEquipoRoutes = require("./routes/tipoEquipo.routes");
const estatusRoutes = require("./routes/estatus.routes");
const procesadoresRoutes = require("./routes/procesadores.routes");
const modelosRoutes = require("./routes/modelos.routes");
const responsivaRoutes = require("./routes/responsiva.routes");
const restaurantesRoutes = require("./routes/restaurantes.routes");
const unidadesRoutes = require("./routes/unidades.routes");
const departamentosRoutes = require("./routes/departamentos.routes");
const puestosRoutes = require("./routes/puestos.routes");
const modespRoutes = require("./routes/modesp.routes");
const authRoutes = require("./routes/auth.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const modelosProcesadorRoutes = require("./routes/modelosProcesador.routes");

require("./config/db");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "https://inventario-ga.azurewebsites.net"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("🚀 API Inventario GA2 funcionando correctamente");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Inventario GA2 API",
    date: new Date()
  });
});

app.use("/api/inventario", inventarioRoutes);
app.use("/api/catalogos", catalogosRoutes);
app.use("/api/marcas", marcasRoutes);
app.use("/api/tipo-equipo", tipoEquipoRoutes);
app.use("/api/estatus", estatusRoutes);
app.use("/api/procesadores", procesadoresRoutes);
app.use("/api/modelos", modelosRoutes);
app.use("/api/responsiva", responsivaRoutes);
app.use("/api/restaurantes", restaurantesRoutes);
app.use("/api/unidades", unidadesRoutes);
app.use("/api/departamentos", departamentosRoutes);
app.use("/api/puestos", puestosRoutes);
app.use("/api/modesp", modespRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/modelos-procesador", modelosProcesadorRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});