import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import InventarioPage from "./pages/InventarioPage";
import InventarioFormPage from "./pages/InventarioFormPage";
import MarcasPage from "./pages/MarcasPage";
import TipoEquipoPage from "./pages/TipoEquipoPage";
import EstatusPage from "./pages/EstatusPage";
import ProcesadoresPage from "./pages/ProcesadoresPage";
import ModelosPage from "./pages/ModelosPage";
import ResponsivaPage from "./pages/ResponsivaPage";
import LoadingScreen from "./utils/LoadingScreen";
import "react-toastify/dist/ReactToastify.css";

function App() {

  const [loading, setLoading] = useState(false);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
      {loading && <LoadingScreen />}
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
          <Route path="/responsiva" element={<ResponsivaPage setLoading={setLoading} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;