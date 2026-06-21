import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Sidebar from "./components/Sidebar";
import InventarioDetallePage from "./pages/InventarioDetallePage";

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
import RestaurantesPage from "./pages/RestaurantesPage";
import UnidadesPage from "./pages/UnidadesPage";
import DepartamentosPage from "./pages/DepartamentosPage";
import PuestosPage from "./pages/PuestosPage";
import ModespPage from "./pages/ModespPage";

function App() {

  const [loading, setLoading] = useState(false);

  return (
    <>
      {loading && <LoadingScreen />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <BrowserRouter>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <main style={{ flex: 1, padding: "24px", overflow: "auto" }}>
            <Routes>
              <Route path="/" element={<Navigate to="/inventario" />} />
              <Route path="/inventario" element={<InventarioPage setLoading={setLoading}/>} />
              <Route path="/inventario/nuevo" element={<InventarioFormPage setLoading={setLoading}/>} />
              <Route path="/inventario/editar/:id" element={<InventarioFormPage setLoading={setLoading}/>} />
              <Route path="/marcas" element={<MarcasPage setLoading={setLoading}/>} />
              <Route path="/tipo-equipo" element={<TipoEquipoPage setLoading={setLoading}/>} />
              <Route path="/estatus" element={<EstatusPage setLoading={setLoading}/>} />
              <Route path="/procesadores" element={<ProcesadoresPage setLoading={setLoading}/>} />
              <Route path="/modelos" element={<ModelosPage setLoading={setLoading}/>} />
              <Route path="/responsiva" element={<ResponsivaPage setLoading={setLoading} />} />
              <Route path="/restaurantes" element={<RestaurantesPage setLoading={setLoading}/>} />
              <Route path="/unidades" element={<UnidadesPage setLoading={setLoading}/>} />
              <Route path="/departamentos" element={<DepartamentosPage setLoading={setLoading}/>} />
              <Route path="responsiva" element={<ResponsivaPage setLoading={setLoading}/>}/>
              <Route path="/inventario/detalle/:id" element={<InventarioDetallePage setLoading={setLoading}/>} />
              <Route path="/puestos" element={<PuestosPage setLoading={setLoading} />} />
              <Route path="/modesp" element={<ModespPage setLoading={setLoading} />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;