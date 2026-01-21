const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const seguridadRouterModule = require("./src/routes/seguridad/seguridad");
const apiSeguridadRouterModule = require("./src/routes/seguridad/apiSeguridad");

// Load .env from repo root
dotenv.config({ path: path.join(__dirname, ".env") });

const createSeguridadRouter =
  seguridadRouterModule.default || seguridadRouterModule;
const createApiSeguridadRouter =
  apiSeguridadRouterModule.default || apiSeguridadRouterModule;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

app.use(express.json());

// En Vercel, /public se sirve en la raíz (/...). En local replicamos ese comportamiento
// para que rutas como /styles/tailwind.css funcionen.
app.use(express.static(path.join(__dirname, "public")));

const preferredPort = Number(process.env.PORT) || 5173;

function sendDpPage(res, folder) {
  res.sendFile(
    path.join(__dirname, "mod-1-delivery-pickup", "pages", folder, "index.html")
  );
}

function sendDpAppShell(res) {
  res.sendFile(
    path.join(
      __dirname,
      "mod-1-delivery-pickup",
      "pages",
      "app-shell",
      "index.html"
    )
  );
}

function jsString(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

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
      )}\`;\n`
  );
});

// Favicon (tanto en dev como en Vercel, Vercel servirá /favicon.ico desde public/, pero
// en dev respondemos explícitamente para evitar 404 de ruido).
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "assets", "001novo_120744.ico"));
});

// Compatibilidad Vercel: mismo contenido que /config.js
app.get("/api/config.js", (req, res) => {
  res.redirect(302, "/config.js");
});

// Alias bonito para el Home de Administración
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "shared", "admin-home", "index.html"));
});

// Landing como ruta raíz
app.get(["/", "//"], (req, res) => {
  res.sendFile(path.join(__dirname, "landing", "index.html"));
});

// Alias bonito para el Menú compartido
app.get(["/menu", "/menu/"], (req, res) => {
  res.sendFile(path.join(__dirname, "shared", "pages", "menu", "index.html"));
});

// Ruta bonita para Checkout
app.get(["/checkout", "/checkout/"], (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(
    path.join(
      __dirname,
      "mod-1-delivery-pickup",
      "pages",
      "checkout",
      "index.html"
    )
  );
});

// Delivery & Pickup - Admin (SPA Shell)
// Todas estas rutas sirven el mismo "app shell"; el contenido se carga por JS con History API.
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

// Serve the workspace as static files (must come BEFORE "pretty" routes)
app.use(express.static(__dirname));

// Rutas "lindas" para order tracking
app.get("/order-tracking/:id", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(
    path.join(
      __dirname,
      "mod-1-delivery-pickup",
      "pages",
      "order-tracking",
      "index.html"
    )
  );
});

function startServer(port, remainingAttempts) {
  const server = app.listen(port, () => {
    console.log(`[interface] dev server running at http://localhost:${port}`);
    console.log(
      "[interface] /config.js injects DP_URL, AUTH_URL, KITCHEN_URL from .env"
    );
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && remainingAttempts > 0) {
      const nextPort = port + 1;
      console.warn(`[interface] port ${port} in use, trying ${nextPort}...`);
      startServer(nextPort, remainingAttempts - 1);
      return;
    }
    throw err;
  });
}

// Rutas de Seguridad
app.use("/seguridad", createSeguridadRouter());
app.use("/api/seguridad", createApiSeguridadRouter());

if (require.main === module) {
  // Iniciar el servidor solo si este archivo es el principal
  startServer(preferredPort, 10);
}

module.exports = app;
