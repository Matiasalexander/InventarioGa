import { useEffect, useState, useMemo} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/Area.css";
//resutarantes
import RestaurantesPage from "./RestaurantesPage";
import UnidadesPage from "./UnidadesPage";


function AreasUnidades({setLoading}) {
    return(
        <>
    <div className="responsive">
        <div className="area-grid">
            <div className="detail-item">
                <RestaurantesPage setLoading={setLoading}/>
            </div>

            <div className="detail-item">
                <UnidadesPage setLoading={setLoading}/>
            </div>
            
        </div>
    </div>
        </>
    );
}
export default AreasUnidades;