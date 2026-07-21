import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  olvidePassword,
  resetPassword
} from "../services/authService";

function ForgotPasswordPage({ setLoading }) {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");

  const solicitarCodigo = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await olvidePassword(correo);

      toast.success("Código generado correctamente.");

      if (data.codigo) {
        alert(`Código temporal: ${data.codigo}`);
      }

      setPaso(2);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Error generando código"
      );
    } finally {
      setLoading(false);
    }
  };

  const restablecerPassword = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await resetPassword(correo, codigo, nuevaPassword);

      toast.success("Contraseña actualizada correctamente.");
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Error restableciendo contraseña"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a"
      }}
    >
      <form
        onSubmit={paso === 1 ? solicitarCodigo : restablecerPassword}
        style={{
          width: "380px",
          background: "white",
          padding: "28px",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(0,0,0,.25)"
        }}
      >
        <h2 style={{ marginBottom: "8px", textAlign: "center", color: "#1e293b"}}>
          Cambiar contraseña
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "14px",
            marginBottom: "20px"
          }}
        >
          {paso === 1
            ? "Ingresa tu correo para generar un código."
            : "Ingresa el código y tu nueva contraseña."}
        </p>

        <input
          type="email"
          placeholder="Correo"
          value={correo}
          disabled={paso === 2}
          onChange={(e) => setCorreo(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px"
          }}
        />

        {paso === 2 && (
          <>
            <input
              type="text"
              placeholder="Código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px"
              }}
            />

            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "18px"
              }}
            />
          </>
        )}

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
          {paso === 1 ? "Generar código" : "Cambiar contraseña"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
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
          Volver al login
        </button>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;