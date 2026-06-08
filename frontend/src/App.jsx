import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import InventarioDetallePage from "./pages/InventarioDetallePage";

import InventarioPage from "./pages/InventarioPage";
import InventarioFormPage from "./pages/InventarioFormPage";
import MarcasPage from "./pages/MarcasPage";
import TipoEquipoPage from "./pages/TipoEquipoPage";
import EstatusPage from "./pages/EstatusPage";
import ProcesadoresPage from "./pages/ProcesadoresPage";
import ModelosPage from "./pages/ModelosPage";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "24px", overflow: "auto" }}>

          <Routes>
            <Route path="/inventario/:id" element={<InventarioDetallePage />} />
            <Route path="/" element={<Navigate to="/inventario" />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/inventario/nuevo" element={<InventarioFormPage />} />
            <Route path="/inventario/editar/:id" element={<InventarioFormPage />} />
            <Route path="/marcas" element={<MarcasPage />} />
            <Route path="/tipo-equipo" element={<TipoEquipoPage />} />
            <Route path="/estatus" element={<EstatusPage />} />
            <Route path="/procesadores" element={<ProcesadoresPage />} />
            <Route path="/modelos" element={<ModelosPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;