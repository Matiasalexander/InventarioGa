import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/EquiposPage.css";
import DepartamentosPage from "./DepartamentosPage";
import PuestosPage from "./PuestosPage";

function AreasCorporativas({setLoading}) {

        return(
            <>
            <div className="responsive">
                <div className="grid">

                    <div className="detail-item">
                        <DepartamentosPage setLoading={setLoading}/>
                    </div>

                    <div className="detail-item">
                        <PuestosPage setLoading={setLoading}/>
                    </div>

                </div>
            </div>
            </>
        );
}
export default AreasCorporativas;