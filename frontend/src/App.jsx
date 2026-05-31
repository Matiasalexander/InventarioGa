import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InventarioPage from "./pages/InventarioPage";
import InventarioFormPage from "./pages/InventarioFormPage";
import MarcasPage from "./pages/MarcasPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inventario" />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/inventario/nuevo" element={<InventarioFormPage />} />
        <Route path="/inventario/editar/:id" element={<InventarioFormPage />} />
        <Route path="/marcas" element={<MarcasPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;