import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/Area.css";
import DepartamentosPage from "./DepartamentosPage";
import PuestosPage from "./PuestosPage";

function AreasCorporativas({ setLoading }) {

    return (
        <>
            <div className="responsive">
                <div className="area-grid">

                    <div className="area-item">
                        <DepartamentosPage setLoading={setLoading} />
                    </div>

                    <div className="area-item">
                        <PuestosPage setLoading={setLoading} />
                    </div>

                </div>
            </div>
        </>
    );
}
export default AreasCorporativas;