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


  const rutaSolicitada = req.path;

  if (rutaSolicitada === "/seguridad/login") {
    if (req.user) {
      return res.redirect("/shared/admin-home/index.html");
    }
  }

  const rutasProtegidas = [
    "/perfil/editar",
    "/perfil/cambioPassword",
  ];

  if (!rutasProtegidas.includes(rutaSolicitada)) {
    return next();
  }
  if (!req.user) {
    return res.redirect(`/seguridad/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

};

module.exports = { viewsWithAuth };