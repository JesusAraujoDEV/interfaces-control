const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require("cookie-parser");
const seguridadRouterModule = require("./src/routes/seguridad/seguridad");
const apiSeguridadRouterModule = require("./src/routes/seguridad/apiSeguridad");

// Load .env from repo root
dotenv.config({ path: path.join(__dirname, '.env') });

const createSeguridadRouter = seguridadRouterModule.default || seguridadRouterModule;
const createApiSeguridadRouter = apiSeguridadRouterModule.default || apiSeguridadRouterModule;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

app.use(express.json());

const preferredPort = Number(process.env.PORT) || 5173;

function jsString(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

app.get('/config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    `window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};\n` +
      `window.__APP_CONFIG__.DP_URL = \`${jsString(process.env.DP_URL)}\`;\n` +
      `window.__APP_CONFIG__.AUTH_URL = \`${jsString(process.env.AUTH_URL)}\`;\n` +
      `window.__APP_CONFIG__.KITCHEN_URL = \`${jsString(process.env.KITCHEN_URL)}\`;\n`
  );
});

// Compatibilidad Vercel: mismo contenido que /config.js
app.get('/api/config.js', (req, res) => {
  res.redirect(302, '/config.js');
});

// Home: login
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'mod-4-seguridad', 'Inicio sesión', 'Inicio-sesion.html'));
// });

// Serve the workspace as static files (must come BEFORE "pretty" routes)
app.use(express.static(__dirname));

// Rutas "lindas" para order tracking
app.get('/order-tracking/:id', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'mod-1-delivery-pickup', 'pages', 'order-tracking', 'index.html'));
});

function startServer(port, remainingAttempts) {
  const server = app.listen(port, () => {
    console.log(`[interface] dev server running at http://localhost:${port}`);
    console.log('[interface] /config.js injects DP_URL, AUTH_URL, KITCHEN_URL from .env');
  });

  server.on('error', err => {
    if (err && err.code === 'EADDRINUSE' && remainingAttempts > 0) {
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

startServer(preferredPort, 10);
