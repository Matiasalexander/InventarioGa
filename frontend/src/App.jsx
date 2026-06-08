import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import InventarioPage from "./pages/InventarioPage";
import InventarioFormPage from "./pages/InventarioFormPage";
import MarcasPage from "./pages/MarcasPage";
import TipoEquipoPage from "./pages/TipoEquipoPage";
import EstatusPage from "./pages/EstatusPage";
import ProcesadoresPage from "./pages/ProcesadoresPage";
import ModelosPage from "./pages/ModelosPage";
import RestaurantesPage from "./pages/RestaurantesPage";
import UnidadesPage from "./pages/UnidadesPage";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, width: "240px", padding: "24px", overflow: "auto" }}>

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
            <Route path="/restaurantes" element={<RestaurantesPage />} />
            <Route path="/unidades" element={<UnidadesPage />} />
            
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;