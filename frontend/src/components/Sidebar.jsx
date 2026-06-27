import { NavLink, useNavigate } from "react-router-dom";
import {
  Monitor,
  Cpu,
  Book,
  AreaChart,
  LogOut
} from "lucide-react";
import { getRol } from "../utils/roles";

export default function Sidebar() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const rol = getRol();

  const links = [];

  if (rol === "Administrador" || rol === "Sistemas") {
    links.push(
      { to: "/inventario", label: "Inventario", icon: Monitor },
      { to: "/Equipo", label: "Equipo", icon: Monitor },
      { to: "/Areas", label: "Restaurantes/Unidades", icon: AreaChart },
      { to: "/AreasCorporativas", label: "Áreas Corporativas", icon: AreaChart },
      { to: "/procesadores", label: "Procesadores", icon: Cpu }
    );
  }

  if (rol === "Administrador" || rol === "Sistemas" || rol === "RH") {
    links.push(
      /*{ to: "/responsiva", label: "Nueva Responsiva", icon: Book },*/
      { to: "/responsivas/historial", label: "Historial Responsivas", icon: Book }
    );
  }

  if (rol === "Administrador") {
    links.push(
      { to: "/usuarios", label: "Usuarios", icon: Book }
    );
  }

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (

    <aside style={{
      width: "240px",
      minHeight: "100vh",
      background: "#1e293b",
      color: "white",
      display: "flex",
      flexDirection: "column"
    }}>

      <div style={{
        padding: "20px 24px",
        fontSize: "18px",
        fontWeight: "bold",
        borderBottom: "1px solid #334155"
      }}>
        Inventario GA2
      </div>

      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid #334155"
      }}>
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>
          {usuario?.Nombre || "Usuario"}
        </div>

        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
          {usuario?.Rol || "Sin rol"}
        </div>
      </div>

      <nav style={{
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        flex: 1
      }}>

        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              textDecoration: "none",
              color: isActive ? "white" : "#94a3b8",
              background: isActive ? "#4f46e5" : "transparent"
            })}
          >

            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <button
          onClick={cerrarSesion}
          style={{
            margin: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #334155",
            background: "transparent",
            color: "#fca5a5",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px"
          }}
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </nav>


    </aside>
  );
}