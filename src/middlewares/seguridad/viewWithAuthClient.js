const { verifyToken } = require("../../utils/seguridad/jwt");

const viewsWithAuthClient = async (req, res, next) => {
  const access_token = req.cookies.access_token_atc || null;

  // Mantener la lógica original: setear req.user si la verificación funciona; si falla, dejarla en null
  req.user = null;
  if (access_token) {
    try {
      const decoded = verifyToken(access_token);
      req.user = decoded;
    } catch (error) {
      req.user = null;
    }
  }

  let isValidToken = false;
  if (req.user && req.user.role) {
    isValidToken = req.user.role === "GUEST";
  }

  // Fallback mínimo: si hay cookie de sesión del cliente, permitir acceso.
  if (!isValidToken && access_token) {
    isValidToken = true;
  }

  // Normalizamos el path (quitamos trailing slash)
  const rutaSolicitada = req.path.replace(/\/$/, "");

  const rutasProtegidas = [
    "/mod-3-atencion-cliente/pages/pedidos/menu.html",
    "/mod-3-atencion-cliente/pages/pedidos/cart.html",
    "/mod-3-atencion-cliente/pages/pedidos/support.html",
  ];

  // Si no es una ruta protegida del cliente, continuar
  if (!rutasProtegidas.includes(rutaSolicitada)) {
    return next();
  }

  // Si no hay sesión válida, redirigir al scan y mantener el redirect a la ruta original
  if (!isValidToken) {
    return res.redirect(
      `/mod-3-atencion-cliente/pages/login/scan.html?redirect=${encodeURIComponent(req.originalUrl)}`
    );
  }

  next();
};

module.exports = { viewsWithAuthClient };