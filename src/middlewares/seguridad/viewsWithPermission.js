const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const hasPermission = require("../../utils/seguridad/hasPermission");

const viewsWithPermission = async (req, res, next) => {
  let resource = null;
  // Si ruta path termina con / lo eliminamos
  const rutaSolicitada = req.path.replace(/\/$/, "");
  req

  switch (true) {

    // Vistas de Seguridad

    case rutaSolicitada === "/seguridad/usuarios":
      resource = ["SeguridadPersonal_view"];
      break;
    case rutaSolicitada === "/seguridad/usuarios/crear":
      resource = ["SeguridadPersonal_view"];
      break;
    case /^\/seguridad\/usuarios\/editar\/[^/]+$/.test(rutaSolicitada):
      resource = ["SeguridadPersonal_view"];
      break;
    case rutaSolicitada === "/seguridad/roles":
      resource = ["SeguridadPersonal_view"];
      break;
    case rutaSolicitada === "/seguridad/roles/crear":
      resource = ["SeguridadPersonal_view"];
      break;
    case /^\/seguridad\/roles\/editar\/[^/]+$/.test(rutaSolicitada):
      resource = ["SeguridadPersonal_view"];
      break;
    case rutaSolicitada === "/seguridad/permisos":
      resource = ["SeguridadPersonal_view"];
      break;
    case rutaSolicitada === "/seguridad/permisos/crear":
      resource = ["SeguridadPersonal_view"];
      break;
    case /^\/seguridad\/permisos\/[^/]+$/.test(rutaSolicitada):
      resource = ["SeguridadPersonal_view"];
      break;
    case rutaSolicitada === "/seguridad/restaurante/coordenadas":
      resource = ["SeguridadPersonal_view"];
      break;

    // Vistas de Delivery & Pickup

    // case rutaSolicitada === "/admin/dp":
    //     resource = ["DpSupervisor_view", "DpDespachador_view"];
    //     break;
    case rutaSolicitada === "/admin/dp/zones":
        resource = ["DpSupervisor_view"];
        break;
    case rutaSolicitada === "/admin/dp/orders":
        resource = ["DpSupervisor_view", "DpDespachador_view"];
        break;
    case rutaSolicitada === "/admin/dp/config":
        resource = ["DpSupervisor_view"];
        break;
    case rutaSolicitada === "/admin/dp/audit":
        resource = ["DpSupervisor_view"];
        break;  

    // Vistas de atc
    case rutaSolicitada === "/mod-3-atencion-cliente/pages/admin/tables.html":
        resource = ["AtcSupervisorSala_view"];
        break;
    case rutaSolicitada === "/mod-3-atencion-cliente/pages/admin/tables-maitre.html": 
        resource = ["AtcMaitre_view"];
        break;
    case rutaSolicitada === "/mod-3-atencion-cliente/pages/admin/sessions.html":
        resource = ["AtcSupervisorSala_view", "AtcMaitre_view"];
        break;
    case rutaSolicitada === "/mod-3-atencion-cliente/pages/admin/requests.html":
        resource = ["AtcSupervisorSala_view", "AtcMaitre_view", "CocinaCamarero_view"];
        break;

    // Vistas de kpi 
    case rutaSolicitada === "/mod-2-kpis/src/public/dashboard.html":
        resource = ["KpiGerente_view"];
        break;
    case rutaSolicitada === "/mod-2-kpis/src/public/bussines-intelligence.html":
        resource = ["KpiGerente_view"];
        break;
    case rutaSolicitada === "/mod-2-kpis/src/public/eficiencia-operacional.html":
        resource = ["KpiGerente_view"];
        break;
    case rutaSolicitada === "/mod-2-kpis/src/public/inventario.html":
        resource = ["KpiGerente_view"];
        break;

    // Vistas de cocina
    case rutaSolicitada === "/mod-5-cocina/kds.html":
        resource = ["CocinaSupervisor_view", "CocinaCocinero_view", "CocinaChef_view"];
        break;
    case rutaSolicitada === "/mod-5-cocina/Despacho.html":
        resource = ["CocinaSupervisor_view", "CocinaCamarero_view", "AtcMaitre_view"];
        break;

    case rutaSolicitada === "/mod-5-cocina/rec-pro.html":
        resource = ["CocinaSupervisor_view", "CocinaChef_view"];
        break;
    case rutaSolicitada === "/mod-5-cocina/inv.html":
        resource = ["CocinaSupervisor_view", "CocinaChef_view"];
        break;
    case rutaSolicitada === "/mod-5-cocina/activos.html":
        resource = ["CocinaSupervisor_view", "CocinaChef_view"];
        break;
    case rutaSolicitada === "/mod-5-cocina/personal.html":
        resource = ["CocinaSupervisor_view", "CocinaChef_view"];
        break;
    case rutaSolicitada === "/mod-5-cocina/historial_pedidos.html":
        resource = ["CocinaSupervisor_view", "CocinaChef_view"];
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