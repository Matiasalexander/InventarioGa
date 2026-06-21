import { Router } from "express";

import {
  crearResponsiva,
  obtenerResponsivas,
  obtenerResponsivaPorId,
  eliminarResponsiva,
  marcarEquipoDevuelto
} from "../controllers/responsivas.controller.js";

const router = Router();

router.get("/", obtenerResponsivas);
router.get("/:id", obtenerResponsivaPorId);
router.post("/", crearResponsiva);
router.delete("/:id", eliminarResponsiva);
router.put("/detalle/:idDetalle/devolver", marcarEquipoDevuelto);

export default router;