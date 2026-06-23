import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/EquiposPage.css";
//resutarantes
import RestaurantesPage from "./RestaurantesPage";
import UnidadesPage from "./UnidadesPage";


function AreasUnidades({setLoading}) {
    return(
        <>
        <div className="reponsive">

            <div className="detail-item">
                <RestaurantesPage setLoading={setLoading}/>
            </div>

            <div className="detail-item">
                <UnidadesPage setLoading={setLoading}/>
            </div>

        </div>
        </>
    );
}
export default AreasUnidades;