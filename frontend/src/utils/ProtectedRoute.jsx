import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, permiso }) {
  const token = localStorage.getItem("token");

  const { tienePermiso } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (permiso && !tienePermiso(permiso)) {
    return <Navigate to="/inventario" replace />;
  }

  return children;
}

export default ProtectedRoute;