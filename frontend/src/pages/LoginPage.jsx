import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f172a"
    }}>
      <form
        onSubmit={iniciarSesion}
        style={{
          width: "360px",
          background: "white",
          padding: "28px",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(0,0,0,.25)"
        }}
      >
        <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
          Inventario GA2
        </h2>

        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px"
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "18px"
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Iniciar sesión
        </button>

        <button
  type="button"
  onClick={() => navigate("/forgot-password")}
  style={{
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    background: "transparent",
    border: "none",
    color: "#4f46e5",
    cursor: "pointer"
  }}
>
  ¿Olvidaste tu contraseña?
</button>
      </form>
    </div>
  );
}

export default LoginPage;