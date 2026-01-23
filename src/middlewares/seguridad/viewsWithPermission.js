const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const hasPermission = require("../../utils/seguridad/hasPermission");

const viewsWithPermission = async (req, res, next) => {
  let resource = null;
  const rutaSolicitada = req.path;
  req

  switch (true) {

    // Vistas de Seguridad

    case rutaSolicitada === "/seguridad/usuarios":
      resource = "Security_view";
      break;
    case rutaSolicitada === "/seguridad/usuarios/crear":
      resource = "Security_view";
      break;
    case /^\/seguridad\/usuarios\/editar\/[^/]+$/.test(rutaSolicitada):
      resource = "Security_view";
      break;
    case rutaSolicitada === "/seguridad/roles":
      resource = "Security_view";
      break;
    case rutaSolicitada === "/seguridad/roles/crear":
      resource = "Security_view";
      break;
    case /^\/seguridad\/roles\/editar\/[^/]+$/.test(rutaSolicitada):
      resource = "Security_view";
      break;
    case rutaSolicitada === "/seguridad/permisos":
      resource = "Security_view";
      break;
    case rutaSolicitada === "/seguridad/permisos/crear":
      resource = "Security_view";
      break;
    case /^\/seguridad\/permisos\/[^/]+$/.test(rutaSolicitada):
      resource = "Security_view";
      break;
    case rutaSolicitada === "/seguridad/restaurante/coordenadas":
      resource = "Security_view";
      break;

    // Vistas de Delivery & Pickup

    case rutaSolicitada === "/admin/dp":
        resource = "DeliveryPickup_view";
        break;
    case rutaSolicitada === "/admin/dp/zones":
        resource = "DeliveryPickup_view";
        break;
    case rutaSolicitada === "/admin/dp/orders":
        resource = "DeliveryPickup_view";
        break;
    case rutaSolicitada === "/admin/dp/config":
        resource = "DeliveryPickup_view";
        break;
    case rutaSolicitada === "/admin/dp/audit":
        resource = "DeliveryPickup_view";
        break;  

    // Vistas de atc
    case rutaSolicitada === "/mod-3-atencion-cliente/pages/admin/tables.html":
        resource = "Atc_view";
        break;
    
    // Vistas de kpi 
    case rutaSolicitada === "/mod-2-kpis/src/public/dashboard.html":
        resource = "KpiDashboard_view";
        break;
    case rutaSolicitada === "/mod-2-kpis/src/public/bussines-intelligence.html":
        resource = "KpiDashboard_view";
        break;
    case rutaSolicitada === "/mod-2-kpis/src/public/eficiencia-operacional.html":
        resource = "KpiDashboard_view";
        break;
    
    case rutaSolicitada === "/mod-2-kpis/src/public/inventario.html":
        resource = "KpiDashboard_view";
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
    return res.status(403).render("seguridad/sinAcceso", {
      messagesError: ["No tienes permiso para acceder a esta vista."],
      resource
    });
  }
};

module.exports = { viewsWithPermission };