const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const seguridadRouterModule = require("../src/routes/seguridad/seguridad");
const apiSeguridadRouterModule = require("../src/routes/seguridad/apiSeguridad");
const apiAtencionClienteRouterModule = require("../mod-3-atencion-cliente/router/auth_cliente.js");
const { viewsWithPermission } = require("../src/middlewares/seguridad/viewsWithPermission");
const { viewsWithAuth } = require("../src/middlewares/seguridad/viewsWithAuth");
const { requireLocation } = require("../src/middlewares/seguridad/locationRequired");

const app = express();

app.use(cookieParser());
app.use(viewsWithAuth);
app.use(viewsWithPermission);
app.use(requireLocation);
const createSeguridadRouter =
  seguridadRouterModule.default || seguridadRouterModule;
const createApiSeguridadRouter =
  apiSeguridadRouterModule.default || apiSeguridadRouterModule;

// En Vercel, el root del proyecto es process.cwd().
// Usar __dirname aquí apuntaría a /var/task/api y rompería los paths.
const PROJECT_ROOT = process.cwd();

function sendDpPage(res, folder) {
  res.sendFile(
    path.join(
      PROJECT_ROOT,
      "mod-1-delivery-pickup",
      "pages",
      folder,
      "index.html"
    )
  );
}

function sendDpAppShell(res) {
  res.sendFile(
    path.join(
      PROJECT_ROOT,
      "mod-1-delivery-pickup",
      "pages",
      "app-shell",
      "index.html"
    )
  );
}

// En Vercel, los archivos de /public se sirven desde la raíz del sitio.
// Como esta API actúa como router principal (vercel.json), montamos /public aquí también.
app.use(express.static(path.join(PROJECT_ROOT, "public")));

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(PROJECT_ROOT, "src/views"));
app.use(express.json());

function jsString(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

// Config (equivalente a server.js): inyecta DP_URL, AUTH_URL, KITCHEN_URL
app.get("/config.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  res.end(
    `window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};\n` +
      `window.__APP_CONFIG__.DP_URL = \`${jsString(process.env.DP_URL)}\`;\n` +
      `window.__APP_CONFIG__.AUTH_URL = \`${jsString(
        process.env.AUTH_URL
      )}\`;\n` +
      `window.__APP_CONFIG__.KITCHEN_URL = \`${jsString(
        process.env.KITCHEN_URL
      )}\`;\n` +
      `window.__APP_CONFIG__.ATC_URL = \`${jsString(
        process.env.ATC_URL
      )}\`;\n`
  );
});

// Compatibilidad (misma intención que server.js)
app.get("/api/config.js", (req, res) => {
  res.redirect(302, "/config.js");
});

// Favicon para Vercel (sirve el mismo ico que en dev)
app.get("/favicon.ico", (req, res) => {
  res.sendFile(
    path.join(PROJECT_ROOT, "public", "assets", "001novo_120744.ico")
  );
});

// Vista de Home de Administración (ruta original)
app.get("/shared/admin-home/index.html", (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, "shared", "admin-home", "index.html"));
});

// Alias bonito para el Home de Administración
app.get("/admin", (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, "shared", "admin-home", "index.html"));
});

// Landing como ruta raíz
app.get(["/", "//"], (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, "landing", "index.html"));
});

// Alias bonito para el Menú compartido
app.get(["/menu", "/menu/"], (req, res) => {
  res.sendFile(
    path.join(PROJECT_ROOT, "shared", "pages", "menu", "index.html")
  );
});

// Ruta bonita para Checkout
app.get(["/checkout", "/checkout/"], (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(
    path.join(
      PROJECT_ROOT,
      "mod-1-delivery-pickup",
      "pages",
      "checkout",
      "index.html"
    )
  );
});

// Delivery & Pickup - Admin (SPA Shell)
app.get(
  [
    "/admin/dp",
    "/admin/dp/",
    "/admin/dp/pages/dashboard-home",
    "/admin/dp/pages/dashboard-home/",
    "/admin/dp/orders",
    "/admin/dp/orders/:id",
    "/admin/dp/managers",
    "/admin/dp/zones",
    "/admin/dp/config",
    "/admin/dp/audit",
  ],
  (req, res) => {
    sendDpAppShell(res);
  }
);

// Static: servir TODO el repo como archivos estáticos
app.use(express.static(PROJECT_ROOT));

// Rutas "lindas" para order tracking
app.get("/order-tracking/:id", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(
    path.join(
      PROJECT_ROOT,
      "mod-1-delivery-pickup",
      "pages",
      "order-tracking",
      "index.html"
    )
  );
});

// Rutas de Seguridad
app.use("/seguridad", createSeguridadRouter());
app.use("/api/seguridad", createApiSeguridadRouter());
app.use("/api/atencion-cliente", apiAtencionClienteRouterModule());

// 404 controlado (si no existe archivo/ruta)
app.use((req, res) => {
  res.status(404).send("404: NOT_FOUND");
});

module.exports = app;
