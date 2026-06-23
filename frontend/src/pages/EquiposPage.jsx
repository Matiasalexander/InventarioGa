import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/EquiposPage.css";
import TipoEquipoPage from "./TipoEquipoPage";
import MarcasPage from "./MarcasPage";
import ModelosPage from "./ModelosPage";
import ModespPage from "./ModespPage";


function EquiposPage({ setLoading }) {

    return (
        <>
<div className="responsive">

    <div className="dashboard-grid">

        <TipoEquipoPage setLoading={setLoading}/>

        <MarcasPage setLoading={setLoading}/>
    </div>
    
    <div className="dashboard-grid">
        <ModelosPage setLoading={setLoading}/>
        <ModespPage setLoading={setLoading}/>
    </div>

</div>
        </>
    );

}

export default EquiposPage;