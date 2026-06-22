const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const {
  crearResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  eliminarResponsiva,
  marcarEquipoDevuelto
} = require("../controllers/responsiva.controller");

const router = express.Router();

const logoPath = path.join(__dirname, "../assets/gandersons-logo.png");

const logoBase64 = fs.readFileSync(logoPath, {
  encoding: "base64"
});

const logo = `data:image/png;base64,${logoBase64}`;

router.get("/", obtenerResponsivas);

router.post("/", crearResponsiva);

router.put("/detalle/:idDetalle/devolver", marcarEquipoDevuelto);

router.post("/pdf", async (req, res) => {
  try {
    const {
      fecha,
      nombreReceptor,
      puesto,
      area,
      firma,
      equipos = []
    } = req.body;

    const filasEquipos = equipos.length > 0
      ? equipos.map((equipo) => `
        <tr>
          <td>${equipo.Descripcion || ""}</td>
          <td>${equipo.Marca || ""}</td>
          <td>${equipo.Modelo || ""}</td>
          <td>${equipo.NoSerie || ""}</td>
        </tr>
      `).join("")
      : `
        <tr>
          <td colspan="4">Sin equipos registrados</td>
        </tr>
      `;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{
  font-family: Arial;
  margin:40px;
  font-size:14px;
  color:#222;
}

.header{
  display:flex;
  justify-content:flex-start;
}

.logo{
  width:130px;
}

.titulo{
  text-align:center;
  font-size:24px;
  font-weight:bold;
  margin-top:20px;
  margin-bottom:35px;
}

p{
  text-align:justify;
  line-height:1.8;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:20px;
}

th{
  background:#ececec;
  border:1px solid black;
  padding:10px;
}

td{
  border:1px solid black;
  padding:8px;
}

.firma{
  margin-top:90px;
  text-align:center;
}

.firma img{
  width:220px;
  height:auto;
}

.linea{
  width:320px;
  border-top:1px solid black;
  margin:auto;
  margin-top:-5px;
}

.nombre{
  margin-top:10px;
  font-weight:bold;
}

.area{
  margin-top:5px;
}
</style>
</head>

<body>

<div class="header">
  <img class="logo" src="${logo}">
</div>

<div class="titulo">
  CARTA RESPONSIVA DE EQUIPO DE CÓMPUTO
</div>

<p>
Por este medio hago constar que el equipo que se detalla a continuación se encuentra en calidad de préstamo a partir del día
<strong>${fecha || "FECHA"}</strong>
y que está bajo resguardo de
<strong>${nombreReceptor || "NOMBRE RECEPTOR"}</strong>,
quien se desempeña en el puesto
<strong>${puesto || "PUESTO"}</strong>
en Grupo Andersons. Dicho(s) equipo(s) cumplirá(n) el uso para los fines que fueron acordados y se hace responsable de regresarlo en las mismas condiciones que se le fue entregado.
</p>

<p>
La descripción del (los) equipo(s) se detalla a continuación:
</p>

<table>
<thead>
<tr>
  <th>Descripción</th>
  <th>Marca</th>
  <th>Modelo</th>
  <th>Número de Serie</th>
</tr>
</thead>

<tbody>
${filasEquipos}
</tbody>
</table>

<div class="firma">
  <img src="${firma}" />

  <div class="linea"></div>

  <div class="nombre">
    ${nombreReceptor || "NOMBRE"}
  </div>

  <div class="area">
    ${area || "AREA"}
  </div>
</div>

</body>
</html>
`;

    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=responsiva.pdf"
    );

    res.send(pdf);
  } catch (error) {
    console.error("ERROR GENERANDO PDF:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

router.get("/:id", obtenerResponsivaPorId);

router.delete("/:id", eliminarResponsiva);

module.exports = router;