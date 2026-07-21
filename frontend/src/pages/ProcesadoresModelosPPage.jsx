import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/Area.css";
import ProcesadoresPage from "./ProcesadoresPage";
import ModelosProcesadorPage from "./ModelosProcesadorPage";
import RamPage from "./RamPage";
import DiscoPage from "./DiscoPage";

function ProcesadoresModelosPPage ({setLoading}) {
    return (
    <>
        <div className="responsive">
           <div className="area-grid">
            <div className="detail-item">
                <ProcesadoresPage setLoading={setLoading}></ProcesadoresPage>
            </div>

            <div className="detail-item">
                <ModelosProcesadorPage setLoading={setLoading}></ModelosProcesadorPage>
            </div>
           </div>

           <div className="detail-item">
            <DiscoPage setLoading={setLoading}></DiscoPage>
           </div>

           <div className="detail-item">
            <RamPage setLoading={setLoading}></RamPage>
           </div>
        </div>
    </>
    );
}

export default ProcesadoresModelosPPage;