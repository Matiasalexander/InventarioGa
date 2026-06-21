import { NavLink } from "react-router-dom";
import {
    Monitor, Tag, Layers, CheckCircle,
    Cpu, Box, LayoutDashboard,
    Book,
} from "lucide-react";

const links = [

    { to: "/inventario", label: "Inventario", icon: Monitor },
    { to: "/marcas", label: "Marcas", icon: Tag },
    { to: "/estatus", label: "Estatus", icon: CheckCircle },
    { to: "/tipo-equipo", label: "Tipo Equipo", icon: Box },
    { to: "/modelos", label: "Modelos", icon: Layers },
    { to: "/procesadores", label: "Procesadores", icon: Cpu },
    { to: "/restaurantes", label: "Restaurantes", icon: Box },
    { to: "/unidades", label: "Unidades", icon: LayoutDashboard },
    { to: "/departamentos", label: "Departamentos", icon: LayoutDashboard },
    { to: "/puestos", label: "Puestos", icon: LayoutDashboard },
    { to: "/modesp", label: "Modelos base", icon: LayoutDashboard },
    {to:"/modelos-procesador", label: "Modelos Procesador", icon: Book},
      {to:"/responsiva", label: "Responsivas", icon: Book}


];

export default function Sidebar() {
    return (
        <aside style={{ width: "240px", minHeight: "100vh", background: "#1e293b", color: "white", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", fontSize: "18px", fontWeight: "bold", borderBottom: "1px solid #334155" }}>
                Inventario GA2
            </div>
            <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
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
                            background: isActive ? "#4f46e5" : "transparent",
                        })}
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}