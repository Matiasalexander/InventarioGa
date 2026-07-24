import "../styles/EquiposPage.css";

import { useAuth } from "../context/AuthContext";

import TipoEquipoPage from "./TipoEquipoPage";
import MarcasPage from "./MarcasPage";
import ModelosPage from "./ModelosPage";
import ModespPage from "./ModespPage";

function EquiposPage({ setLoading }) {
  const { tienePermiso } = useAuth();

  const puedeVerCatalogos = tienePermiso("catalogos.ver");

  if (!puedeVerCatalogos) {
    return null;
  }

  return (
    <div className="responsive">
      <div className="dashboard-grid">
        <TipoEquipoPage setLoading={setLoading} />
        <MarcasPage setLoading={setLoading} />
      </div>

      <div className="dashboard-grid">
        <ModespPage setLoading={setLoading} />
        <ModelosPage setLoading={setLoading} />
      </div>
    </div>
  );
}

export default EquiposPage;