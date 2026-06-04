const express = require("express");
const puppeteer = require("puppeteer");

const router = express.Router();

router.post("/pdf", async (req, res) => {
    debugger
    try {

        const {
            nombre,
            firma
        } = req.body;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">

            <style>

                body{
                    font-family: Arial, sans-serif;
                    padding:40px;
                    line-height:1.6;
                }

                .firma{
                    margin-top:50px;
                }

                .firma img{
                    width:250px;
                    border-bottom:1px solid #000;
                }

            </style>

        </head>

        <body>

            <h1>Responsiva</h1>

            <p>
                Yo <strong>${nombre}</strong>,
                acepto los términos y condiciones
                descritos en este documento.
            </p>

            <p>
                Asimismo manifiesto que la información
                proporcionada es correcta.
            </p>

            <div class="firma">

                <p>Firma:</p>

                <img src="${firma}" />

            </div>

            <br>

            <p>
                Fecha:
                ${new Date().toLocaleString()}
            </p>

        </body>
        </html>
        `;

        const browser = await puppeteer.launch({
            headless: true
        });

        const page = await browser.newPage();

        await page.setContent(html);

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true
        });

        await browser.close();

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=responsiva.pdf"
        );

        res.send(pdf);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});

module.exports = router;