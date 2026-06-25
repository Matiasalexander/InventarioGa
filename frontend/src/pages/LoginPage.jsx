import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { AreaChart } from "lucide-react";
import logo from "../img/gandersons-logo.png";
import fondo from "../img/FONDO.png";


function LoginPage({ setLoading }) {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const iniciarSesion = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          correo,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      toast.success("Bienvenido");

      navigate("/inventario");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage"   style={{
    backgroundImage: `url(${fondo})`,
  }}>

      <div className="card">

      <form
        onSubmit={iniciarSesion}
      >
      <img className="logoGA" src={logo} alt="logo"/>

      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
        Sistema de Inventario
        </h2>
        

        <input className="correo"
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <input className="password"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="sesionI"
          type="submit"
        >
          Iniciar sesión
        </button>

        <button
        className="forgot"
  type="button"
  onClick={() => navigate("/forgot-password")}
>
  ¿Olvidaste tu contraseña?
</button>
      </form>
      </div>

    </div>
  );
}

export default LoginPage;