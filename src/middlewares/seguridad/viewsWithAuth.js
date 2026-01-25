const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const { verifyToken } = require("../../utils/seguridad/jwt");

const viewsWithAuth = async (req, res, next) => {
  const access_token = req.cookies.access_token || null;
  if (access_token) {
    try {
      const decoded = verifyToken(access_token);
      req.user = decoded;
    } catch (error) {
      req.user = null;
    }
  }
  let isValidToken = false;
  if (req.user) {
      const role = req.user.role
      isValidToken = !(role && (role === 'GUEST'));
  }
  // Si ruta path termina con / lo eliminamos
  const rutaSolicitada = req.path.replace(/\/$/, "");

  if (rutaSolicitada === "/seguridad/login") {
    if (req.user) {
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
  if (!req.user || !isValidToken) {
    return res.redirect(`/seguridad/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
};

module.exports = { viewsWithAuth };