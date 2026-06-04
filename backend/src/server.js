const express = require("express");
const cors = require("cors");
const inventarioRoutes = require("./routes/inventario.routes");
const catalogosRoutes = require("./routes/catalogos.routes");
const marcasRoutes = require("./routes/marcas.routes");
const tipoEquipoRoutes = require("./routes/tipoEquipo.routes");
const estatusRoutes = require("./routes/estatus.routes");
const procesadoresRoutes = require("./routes/procesadores.routes");
const modelosRoutes = require("./routes/modelos.routes");
const responsivaRoutes = require("./routes/responsiva.routes")
require("dotenv").config();

require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/inventario", inventarioRoutes);
app.use("/api/catalogos", catalogosRoutes);
app.use("/api/marcas", marcasRoutes);
app.use("/api/tipo-equipo", tipoEquipoRoutes);
app.use("/api/estatus", estatusRoutes);
app.use("/api/procesadores", procesadoresRoutes);
app.use("/api/modelos", modelosRoutes);
app.use("/api/responsiva", responsivaRoutes)


app.get("/", (req, res) => {
  res.send("🚀 API Inventario GA2 funcionando");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});