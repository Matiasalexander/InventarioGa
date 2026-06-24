export const getUsuario = () => {
  return JSON.parse(localStorage.getItem("usuario"));
};

export const getRol = () => {
  const usuario = getUsuario();
  return usuario?.Rol || "";
};

export const esAdministrador = () =>
  getRol() === "Administrador";

export const esSistemas = () =>
  getRol() === "Sistemas";

export const esRH = () =>
  getRol() === "RH";

export const esConsulta = () =>
  getRol() === "Consulta";