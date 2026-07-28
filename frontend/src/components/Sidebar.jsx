import { useState } from "react";
import {
  Menu,
  Monitor,
  Cpu,
  Laptop,
  Book,
  AreaChart,
  LayoutDashboard,
  LogOut,
  Paperclip,
  PackageCheck,
  Utensils,
  LampDesk,
  MonitorCog,
  Signature,
  UsersRound,
  SlidersHorizontal
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const { usuario, tienePermiso, logout } = useAuth();

  const [abierto, setAbierto] = useState(false);

  const links = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      permiso: "dashboard.ver"
    },
    {
      to: "/inventario",
      label: "Inventario",
      icon: PackageCheck,
      permiso: "inventario.ver"
    },
    {
      to: "/Equipo",
      label: "Equipo",
      icon: Laptop,
      permiso: "inventario.ver"
    },
    {
      to: "/Areas",
      label: "Restaurantes/Unidades",
      icon: Utensils,
      permiso: "catalogos.ver"
    },
    {
      to: "/AreasCorporativas",
      label: "Áreas Corporativas",
      icon: LampDesk,
      permiso: "catalogos.ver"
    },
    {
      to: "/ProcesadoresModelosP",
      label: "Componentes",
      icon: MonitorCog,
      permiso: "catalogos.ver"
    },
    {
      to: "/responsivas/historial",
      label: "Historial Responsivas",
      icon: Signature,
      permiso: "responsivas.ver"
    },
    {
      to: "/usuarios",
      label: "Usuarios",
      icon: UsersRound,
      permiso: "usuarios.ver"
    },
    {
      to: "/roles",
      label: "Roles",
      icon: SlidersHorizontal,
      permiso: "roles.ver"
    }
  ];

  const linksVisibles = links.filter((link) =>
    tienePermiso(link.permiso)
  );

  const cerrarSesion = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <button
        className="menu-button"
        onClick={() => setAbierto((prev) => !prev)}
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
          <span>Inventario Grupo Anderson&apos;s</span>
        </div>

        <div className="usuario">
          <strong>{usuario?.Nombre || "Usuario"}</strong>
          <small>{usuario?.Rol || "Sin rol"}</small>
        </div>

        <nav className="menu">
          {linksVisibles.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setAbierto(false)}
              className={({ isActive }) =>
                isActive ? "link activo-link" : "link"
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            className="logout"
            onClick={cerrarSesion}
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </nav>
      </aside>
    </>
  );
}