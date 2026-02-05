const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const { verifyToken } = require("../../utils/seguridad/jwt");

const viewsWithAuth = async (req, res, next) => {
  const access_token = req.cookies.access_token || null;
  if (access_token) {
    try {
      const decoded = verifyToken(access_token);
      req.user_administrative = decoded;
    } catch (error) {
      req.user_administrative = null;
    }
  }
  let isValidToken = false;
  if (req.user_administrative) {
      const role = req.user_administrative.role
      isValidToken = !(role && (role === 'GUEST'));
  }
  // Si ruta path termina con / lo eliminamos
  const rutaSolicitada = req.path.replace(/\/$/, "");

  if (rutaSolicitada === "/seguridad/login") {
    if (req.user_administrative) {
      return res.redirect("/admin");
    }
  }

  const rutasProtegidas = [
    "/seguridad/perfil/editar",
    "/seguridad/perfil/cambioPassword",
    "/seguridad",
    "/admin",
  ];

  if (!rutasProtegidas.includes(rutaSolicitada)) {
    return next();
  }
  if (!req.user_administrative || !isValidToken) {
    return res.redirect(`/seguridad/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
};

module.exports = { viewsWithAuth };