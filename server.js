const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

// Load .env from repo root
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
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
      `window.__APP_CONFIG__.KITCHEN_URL = \`${jsString(process.env.KITCHEN_URL || 'http://localhost:5173')}\`;\n`
  );
});

// Compatibilidad Vercel: mismo contenido que /config.js
app.get('/api/config.js', (req, res) => {
  res.redirect(302, '/config.js');
});

// Home: login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mod-4-seguridad', 'Inicio sesión', 'Inicio-sesion.html'));
});

// Serve the workspace as static files (must come BEFORE "pretty" routes)
app.use(express.static(__dirname));

// Rutas "lindas" para order tracking
app.get('/order-tracking/:id', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'mod-1-delivery-pickup', 'pages', 'order-tracking', 'index.html'));
});

// Middleware para parsear JSON
app.use(express.json());

// Rutas de API mock para desarrollo
let mockAssets = [
    { id: 1, name: 'Sartén antiadherente 28cm', total: 5, status: 'OPERATIONAL', image_url: 'https://via.placeholder.com/200x150?text=Sarten' },
    { id: 2, name: 'Olla de presión 6L', total: 3, status: 'DAMAGED', image_url: 'https://via.placeholder.com/200x150?text=Olla' },
    { id: 3, name: 'Batidora industrial', total: 1, status: 'OPERATIONAL', image_url: 'https://via.placeholder.com/200x150?text=Batidora' }
];

let mockInventory = [
    { id: 1, name: 'Harina de trigo', category: 'Comida', unit: 'kg', stock: 25.5, max_stock: 50, min_stock: 5, cost_per_unit: 2.50 },
    { id: 2, name: 'Aceite vegetal', category: 'Comida', unit: 'L', stock: 12.0, max_stock: 20, min_stock: 3, cost_per_unit: 8.75 },
    { id: 3, name: 'Papel aluminio', category: 'Empaque', unit: 'rollo', stock: 8, max_stock: 15, min_stock: 2, cost_per_unit: 15.00 }
];

// Middleware to bypass auth for development mock routes
const bypassAuth = (req, res, next) => {
    // Skip authentication for mock routes during development
    next();
};

// API Routes for Assets
app.get('/assets', bypassAuth, (req, res) => {
    res.json(mockAssets);
});

app.get('/api/kitchen/assets', bypassAuth, (req, res) => {
    res.json(mockAssets);
});

app.post('/assets', bypassAuth, (req, res) => {
    const newAsset = { id: Date.now(), ...req.body };
    mockAssets.push(newAsset);
    res.json(newAsset);
});

app.post('/api/kitchen/assets', bypassAuth, (req, res) => {
    const newAsset = { id: Date.now(), ...req.body };
    mockAssets.push(newAsset);
    res.json(newAsset);
});

app.post('/assets/:id/logs', bypassAuth, (req, res) => {
    const assetId = parseInt(req.params.id);
    const log = { id: Date.now(), asset_id: assetId, ...req.body, created_at: new Date().toISOString() };
    // En un backend real, esto se guardaría en una base de datos
    res.json(log);
});

// API Routes for Inventory
app.get('/inventory/items', bypassAuth, (req, res) => {
    res.json(mockInventory);
});

app.get('/api/kitchen/inventory/items', bypassAuth, (req, res) => {
    res.json(mockInventory);
});

app.post('/inventory/items', bypassAuth, (req, res) => {
    const newItem = { id: Date.now(), ...req.body };
    mockInventory.push(newItem);
    res.json(newItem);
});

app.post('/api/kitchen/inventory/items', bypassAuth, (req, res) => {
    const newItem = { id: Date.now(), ...req.body };
    mockInventory.push(newItem);
    res.json(newItem);
});

app.patch('/inventory/items/:id', bypassAuth, (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = mockInventory.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        mockInventory[itemIndex] = { ...mockInventory[itemIndex], ...req.body };
        res.json(mockInventory[itemIndex]);
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

app.patch('/api/kitchen/inventory/items/:id', bypassAuth, (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = mockInventory.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        mockInventory[itemIndex] = { ...mockInventory[itemIndex], ...req.body };
        res.json(mockInventory[itemIndex]);
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

app.post('/inventory/inbound', bypassAuth, (req, res) => {
    const { item_id, quantity, unit_cost } = req.body;
    const item = mockInventory.find(i => i.id == item_id);
    if (item) {
        const newStock = item.stock + parseFloat(quantity);
        const newAvgCost = ((item.stock * item.cost_per_unit) + (quantity * unit_cost)) / newStock;
        item.stock = newStock;
        item.cost_per_unit = newAvgCost;
        res.json({ success: true, new_average_cost: newAvgCost });
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

app.post('/api/kitchen/inventory/inbound', bypassAuth, (req, res) => {
    const { item_id, quantity, unit_cost } = req.body;
    const item = mockInventory.find(i => i.id == item_id);
    if (item) {
        const newStock = item.stock + parseFloat(quantity);
        const newAvgCost = ((item.stock * item.cost_per_unit) + (quantity * unit_cost)) / newStock;
        item.stock = newStock;
        item.cost_per_unit = newAvgCost;
        res.json({ success: true, new_average_cost: newAvgCost });
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

app.post('/inventory/outbound', bypassAuth, (req, res) => {
    const { item_id, quantity } = req.body;
    const item = mockInventory.find(i => i.id == item_id);
    if (item) {
        if (item.stock >= parseFloat(quantity)) {
            item.stock -= parseFloat(quantity);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Insufficient stock' });
        }
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

app.post('/api/kitchen/inventory/outbound', bypassAuth, (req, res) => {
    const { item_id, quantity } = req.body;
    const item = mockInventory.find(i => i.id == item_id);
    if (item) {
        if (item.stock >= parseFloat(quantity)) {
            item.stock -= parseFloat(quantity);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Insufficient stock' });
        }
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

// Mock routes for other endpoints
app.get('/api/kitchen/categories', bypassAuth, (req, res) => {
    res.json([
        { id: 1, name: 'Comida', active: true },
        { id: 2, name: 'Bebida', active: true },
        { id: 3, name: 'Postre', active: true }
    ]);
});

app.get('/api/kitchen/products', bypassAuth, (req, res) => {
    res.json([
        { _id: 1, name: 'Hamburguesa', category: 'Comida', price: 15.99, active: true },
        { _id: 2, name: 'Pizza', category: 'Comida', price: 12.99, active: true },
        { _id: 3, name: 'Refresco', category: 'Bebida', price: 3.99, active: true }
    ]);
});

// Rutas para Modulo 5 (Cocina)
const cocinaRoutes = require('./mod-5-cocina/routes');
app.use('/cocina', cocinaRoutes);

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

startServer(preferredPort, 10);
