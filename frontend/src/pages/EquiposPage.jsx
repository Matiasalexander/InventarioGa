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
      <div className="area-grid">

        <div className="detail-item">
        <TipoEquipoPage setLoading={setLoading} />
        </div>

        <div className="detail-item">
        <MarcasPage setLoading={setLoading} />
  </div>

      <div className="detail-item">
        <ModespPage setLoading={setLoading} />
        </div>

        <div className="detail-item">
        <ModelosPage setLoading={setLoading} />
        </div>
      </div>
    </div>
  );
}

export default EquiposPage;