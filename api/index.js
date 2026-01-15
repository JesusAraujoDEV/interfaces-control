const path = require('path');
const express = require('express');

const app = express();

// En Vercel, el root del proyecto es process.cwd().
// Usar __dirname aquí apuntaría a /var/task/api y rompería los paths.
const PROJECT_ROOT = process.cwd();

function jsString(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

// Config (equivalente a server.js): inyecta DP_URL, AUTH_URL, KITCHEN_URL
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

// Compatibilidad (misma intención que server.js)
app.get('/api/config.js', (req, res) => {
  res.redirect(302, '/config.js');
});

// Home: login
app.get('/', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'mod-4-seguridad', 'Inicio sesión', 'Inicio-sesion.html'));
});

// Evita ruido de 404 por favicon (opcional)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Static: servir TODO el repo como archivos estáticos
app.use(express.static(PROJECT_ROOT));

// Rutas "lindas" para order tracking
app.get('/order-tracking/:id', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(
    path.join(PROJECT_ROOT, 'mod-1-delivery-pickup', 'pages', 'order-tracking', 'index.html')
  );
});

// 404 controlado (si no existe archivo/ruta)
app.use((req, res) => {
  res.status(404).send('404: NOT_FOUND');
});

module.exports = app;
