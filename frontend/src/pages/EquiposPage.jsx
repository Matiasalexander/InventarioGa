import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/EquiposPage.css";
import TipoEquipoPage from "./TipoEquipoPage";
import MarcasPage from "./MarcasPage";
import ModelosPage from "./ModelosPage";


function EquiposPage({ setLoading }) {

    return (
        <>
<div className="responsive">

    <div className="dashboard-grid">

        <TipoEquipoPage setLoading={setLoading}/>

        <MarcasPage setLoading={setLoading}/>
    </div>
    
    <ModelosPage setLoading={setLoading}/>

</div>
        </>
    );

}

export default EquiposPage;