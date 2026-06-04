import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InventarioPage from "./pages/InventarioPage";
import InventarioFormPage from "./pages/InventarioFormPage";
import MarcasPage from "./pages/MarcasPage";
import TipoEquipoPage from "./pages/TipoEquipoPage";
import EstatusPage from "./pages/EstatusPage";
import ProcesadoresPage from "./pages/ProcesadoresPage";
import ModelosPage from "./pages/ModelosPage";
import ResponsivaPage from "./pages/ResponsivaPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inventario" />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/inventario/nuevo" element={<InventarioFormPage />} />
        <Route path="/inventario/editar/:id" element={<InventarioFormPage />} />
        <Route path="/marcas" element={<MarcasPage />} />
        <Route path="/tipo-equipo" element={<TipoEquipoPage />} />
        <Route path="/estatus" element={<EstatusPage />} />
        <Route path="/procesadores" element={<ProcesadoresPage />} />
        <Route path="/modelos" element={<ModelosPage />} />
        <Route path="/responsiva" element={<ResponsivaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;