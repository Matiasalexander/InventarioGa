import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/Area.css";
import ProcesadoresPage from "./ProcesadoresPage";
import ModelosProcesadorPage from "./ModelosProcesadorPage";

function ProcesadoresModelosPPage ({setLoading}) {
    return (
    <>
        <div className="responsive">
           <div className="area-grid">
            <div className="area-item">
                <ProcesadoresPage setLoading={setLoading}></ProcesadoresPage>
            </div>

            <div className="area-item">
                <ModelosProcesadorPage setLoading={setLoading}></ModelosProcesadorPage>
            </div>
           </div>
        </div>
    </>
    );
}

export default ProcesadoresModelosPPage;