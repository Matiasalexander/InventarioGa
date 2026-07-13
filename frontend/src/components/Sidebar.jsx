import { useState } from "react";
import { Menu, Monitor, Cpu, Book, AreaChart, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { getRol } from "../utils/roles";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const rol = getRol();

  const [abierto, setAbierto] = useState(false);

  const links = [];

  if (rol === "Administrador" || rol === "Sistemas") {
    links.push(
      { to: "/dashboard", label: "Dashboard", icon: AreaChart },
      { to: "/inventario", label: "Inventario", icon: Monitor },
      { to: "/Equipo", label: "Equipo", icon: Monitor },
      { to: "/Areas", label: "Restaurantes/Unidades", icon: AreaChart },
      { to: "/AreasCorporativas", label: "Áreas Corporativas", icon: AreaChart },
      { to: "/ProcesadoresModelosP", label: "Procesadores", icon: Cpu }
    );
  }

  if (
    rol === "Administrador" ||
    rol === "Sistemas" ||
    rol === "RH"
  ) {
    links.push(
      {
        to: "/responsivas/historial",
        label: "Historial Responsivas",
        icon: Book
      }
    );
  }

  if (rol === "Administrador") {
    links.push({
      to: "/usuarios",
      label: "Usuarios",
      icon: Book
    });
  }


  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };


  return (
    <>
<button
  className="menu-button"
  onClick={() => setAbierto(prev => !prev)}
>
  <Menu size={26} />
</button>


      {abierto && (
        <div
          className="overlay"
          onClick={() => setAbierto(false)}
        />
      )}


      <aside className={`sidebar ${abierto ? "activo" : ""}`}>

        <div className="sidebar-header">

          <span>
            Inventario Grupo Anderson's
          </span>

        </div>


        <div className="usuario">

          <strong>
            {usuario?.Nombre || "Usuario"}
          </strong>

          <small>
            {usuario?.Rol || "Sin rol"}
          </small>

        </div>


        <nav className="menu">

          {
            links.map(({to,label,icon:Icon}) => (

              <NavLink
                key={to}
                to={to}
                onClick={() => setAbierto(false)}
                className={({isActive}) =>
                  isActive ? "link activo-link" : "link"
                }
              >

                <Icon size={18}/>
                {label}

              </NavLink>

            ))
          }


          <button
            className="logout"
            onClick={cerrarSesion}
          >

            <LogOut size={18}/>
            Cerrar sesión

          </button>


        </nav>


      </aside>
    </>
  );
}