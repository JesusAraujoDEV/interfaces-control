const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const hasPermission = require("../../utils/seguridad/hasPermission");

const viewsWithPermission = async (req, res, next) => {
  let resource = null;
  const rutaSolicitada = req.path;
  req

  switch (true) {
    case rutaSolicitada === "/seguridad/usuarios":
      resource = "UserManagement_view";
      break;
    case rutaSolicitada === "/seguridad/usuarios/crear":
      resource = "UserManagement_view";
      break;
    case /^\/seguridad\/usuarios\/editar\/[^/]+$/.test(rutaSolicitada):
      resource = "UserManagement_view";
      break;
    case rutaSolicitada === "/seguridad/roles":
      resource = "UserManagement_view";
      break;
    case rutaSolicitada === "/seguridad/roles/crear":
      resource = "UserManagement_view";
      break;
    case /^\/seguridad\/roles\/editar\/[^/]+$/.test(rutaSolicitada):
      resource = "UserManagement_view";
      break;
    case rutaSolicitada === "/seguridad/permisos":
      resource = "UserManagement_view";
      break;
    case rutaSolicitada === "/seguridad/permisos/crear":
      resource = "UserManagement_view";
      break;
    case /^\/seguridad\/permisos\/[^/]+$/.test(rutaSolicitada):
      resource = "UserManagement_view";
      break;
    case rutaSolicitada === "/seguridad/restaurante/coordenadas":
      resource = "RestaurantCoordinates_view";
      break;
    default:
      return next();
  }
  const access_token = req.cookies.access_token || null;
  if (!access_token) {
    return res.redirect(`/seguridad/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  const response = await hasPermission(resource, "View", access_token);
  if (response.success && response.data.hasPermission) {
    return next();
  } else {
    return res.status(403).render("seguridad/accesoDenegado", {
      messagesError: ["No tienes permiso para acceder a esta vista."],
      resource
    });
  }
};

module.exports = { viewsWithPermission };