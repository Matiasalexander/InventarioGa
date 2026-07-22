import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const obtenerUsuarioGuardado = () => {
    try {
      const usuarioGuardado = localStorage.getItem("usuario");

      return usuarioGuardado
        ? JSON.parse(usuarioGuardado)
        : null;
    } catch (error) {
      localStorage.removeItem("usuario");
      return null;
    }
  };

  const [usuario, setUsuario] = useState(obtenerUsuarioGuardado);

  const login = (token, usuario) => {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));

    setUsuario(usuario);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    setUsuario(null);
  };

  const tienePermiso = (permiso) => {
    if (!usuario) return false;

    return usuario.permisos?.includes(permiso) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        setUsuario,
        login,
        logout,
        tienePermiso
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}