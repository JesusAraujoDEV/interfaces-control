const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const { verifyToken } = require("../../utils/seguridad/jwt");

const viewsWithAuthClient = async (req, res, next) => {
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
      isValidToken = role && (role === 'GUEST');
  }


  // Si ruta path termina con / lo eliminamos
  const rutaSolicitada = req.path.replace(/\/$/, "");

  const rutasProtegidas = [
    "/mod-3-atencion-cliente/pages/pedidos/menu.html",
    "/mod-3-atencion-cliente/pages/pedidos/cart.html",
    "/mod-3-atencion-cliente/pages/pedidos/support.html",
  ];

  if (!rutasProtegidas.includes(rutaSolicitada)) {
    return next();
  }
  if (!isValidToken) {
    return res.redirect(`/mod-3-atencion-cliente/pages/login/scan.html?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
};

module.exports = { viewsWithAuthClient };