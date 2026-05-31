import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InventarioPage from "./pages/InventarioPage";
import InventarioFormPage from "./pages/InventarioFormPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inventario" />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/inventario/nuevo" element={<InventarioFormPage />} />
        <Route path="/inventario/editar/:id" element={<InventarioFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;