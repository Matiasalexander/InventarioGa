import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import logo from "../img/gandersons-logo.png";
import { login } from "../services/authService";
import { useAuth } from "../context/AuthContext";

function LoginPage({ setLoading }) {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const iniciarSesion = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await login(correo, password);

    authLogin(data.token, data.usuario);
      toast.success("Bienvenido");

      navigate("/inventario");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="card">
        <form onSubmit={iniciarSesion}>
          <img className="logoGA" src={logo} alt="logo" />

          <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
            Sistema de Inventario
          </h2>

          <input
            className="correo"
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <input
            className="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="sesionI" type="submit">
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