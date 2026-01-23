const getdata = require('./api.js');
const { BrowserRouter } = require('react-router-dom');
const React = require('react')
const ReactDOMServer = require('react')


const { Router, static, json } = require('express');
const { join } = require('path');

const router = Router()

router.use(json()); // Support JSON bodies
router.use(static(join(__dirname, 'public')));

function sendKpiView(res, fileName) {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(join(__dirname, 'public', fileName));
}

// --- VISTAS DEL MÓDULO KPI ---
router.get(['/kpis', '/kpis/'], (req, res) => {
    sendKpiView(res, 'dashboard.html');
});

router.get(['/kpis/dashboard', '/kpis/dashboard/'], (req, res) => {
    sendKpiView(res, 'dashboard.html');
});

router.get(['/kpis/business-intelligence', '/kpis/business-intelligence/'], (req, res) => {
    sendKpiView(res, 'bussines-intelligence.html');
});

router.get(['/kpis/eficiencia-operacional', '/kpis/eficiencia-operacional/'], (req, res) => {
    sendKpiView(res, 'eficiencia-operacional.html');
});

router.get(['/kpis/inventario', '/kpis/inventario/'], (req, res) => {
    sendKpiView(res, 'inventario.html');
});

router.get('/mod-2-kpis/src/public/dashboard.html', (req, res) => {
    sendKpiView(res, 'dashboard.html');
});

router.get('/mod-2-kpis/src/public/bussines-intelligence.html', (req, res) => {
    sendKpiView(res, 'bussines-intelligence.html');
});

router.get('/mod-2-kpis/src/public/eficiencia-operacional.html', (req, res) => {
    sendKpiView(res, 'eficiencia-operacional.html');
});

router.get('/mod-2-kpis/src/public/inventario.html', (req, res) => {
    sendKpiView(res, 'inventario.html');
});


// --- 1. AUTENTICACIÓN ---
router.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === "usuario.p11@charlotte.com" && password === "SuperSeguraPassword") {
        return res.json({
            token: "mock_jwt_token_charlotte_p11_super_secret",
            user: { name: "Juan Pérez", role: "Administrador" }
        });
    }
    res.status(401).json({ message: "Credenciales inválidas" });
});

// --- 2. DASHBOARD ---
router.get('/dashboard/summary', (req, res) => {
    // Simular variaciones reales
    const baseRevenue = 12450;
    const variation = (Math.random() * 200 - 100); // +/- 100
    const currentRotation = (Math.random() * 0.5 + 1.2).toFixed(1);

    res.json({
        revenue: baseRevenue + variation,
        revenue_trend: variation >= 0 ? `+${(Math.random() * 5 + 10).toFixed(1)}%` : `-${(Math.random() * 5).toFixed(1)}%`,
        quarterly_goal: 65 + Math.floor(Math.random() * 3),
        quarterly_goal_total: "450k",
        avg_wait_time: `04:${Math.floor(Math.random() * 30 + 10)} min`,
        avg_wait_time_status: "Óptimo",
        rotation: parseFloat(currentRotation),
        rotation_target: 1.7
    });
});

router.get('/dashboard/summary/range', (req, res) => {
    const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'];
    const data = hours.map((hour, index) => {
        // Generar una curva de demanda realista con variaciones aleatorias
        let baseValue = 0;
        if (index < 4) baseValue = 300 + (index * 200); // Mañana subiendo
        else if (index < 6) baseValue = 1800 - ((index - 4) * 200); // Almuerzo pico
        else baseValue = 1000 + (Math.sin(index) * 500); // Tarde fluctuante
        
        return {
            hour: hour,
            value: Math.floor(baseValue + (Math.random() * 100 - 50))
        };
    });
    res.json(data);
});

// --- 3. OPERACIONES ---
router.get('/operations/staff-ranking', (req, res) => {
    const { sort_by = "EFFICIENCY" } = req.query;
    const staff = [
        { id: 1, name: "Ana García", turn: "Mañana", total_orders: 112, avg_time: "4m 32s", status: "ACTIVE", efficiency_score: 95 },
        { id: 2, name: "Luis Pérez", turn: "Tarde", total_orders: 98, avg_time: "5m 15s", status: "ACTIVE", efficiency_score: 88 },
        { id: 3, name: "Sofía Torres", turn: "Mañana", total_orders: 95, avg_time: "5m 45s", status: "REST", efficiency_score: 85 },
        { id: 4, name: "Carlos Ruiz", turn: "Noche", total_orders: 88, avg_time: "6m 02s", status: "ACTIVE", efficiency_score: 82 },
        { id: 5, name: "María Gómez", turn: "Tarde", total_orders: 85, avg_time: "6m 18s", status: "REST", efficiency_score: 80 }
    ];
    res.json(staff);
});

router.get('/operations/sla-breakdown', (req, res) => {
    res.json({
        fast_orders_pct: 85,
        medium_wait_pct: 10,
        critical_delay_pct: 5,
        timestamp: new Date().toISOString()
    });
});

router.get('/operations/staff-metrics/:waiter_id', (req, res) => {
    res.json({
        waiter_id: req.params.waiter_id,
        history: [
            { date: "2024-01-20", orders: 45, efficiency: 92 },
            { date: "2024-01-21", orders: 52, efficiency: 95 }
        ]
    });
});

// --- 4. INVENTARIO ---
router.get('/inventory/pareto', (req, res) => {
    res.json({
        top_products: [
            { id: 1, name: "Charlotte Burger", sales_pct: 35, revenue: 4500 },
            { id: 2, name: "Avocado Toast", sales_pct: 25, revenue: 3200 },
            { id: 3, name: "Iced Caramel Latte", sales_pct: 15, revenue: 1900 },
            { id: 4, name: "Croissant Almendras", sales_pct: 10, revenue: 1200 },
            { id: 5, name: "Cheesecake Fresa", sales_pct: 5, revenue: 600 }
        ],
        total_80_20_message: "80% de las ventas proviene de estos 5 productos"
    });
});

router.get('/inventory/alerts', (req, res) => {
    res.json([
        { id: 1, item: "Tomates Frescos", stock: 10, severity: "CRITICAL" },
        { id: 2, item: "Granos de Café (Espresso)", stock: 5, severity: "CRITICAL" },
        { id: 3, item: "Leche de Almendras", stock: 25, severity: "WARNING" }
    ]);
});

router.get('/inventory/items/:item_id', (req, res) => {
    res.json({ id: req.params.item_id, name: "Item Genérico", current_stock: 50, unit: "kg" });
});

// --- 5. REPORTES ---
router.post('/reports/export', (req, res) => {
    res.json({
        job_id: "JOB-" + Math.random().toString(36).substr(2, 9),
        status: "PENDING",
        message: "Exportación iniciada"
    });
});

router.get('/reports/jobs/:job_id', (req, res) => {
    res.json({
        job_id: req.params.job_id,
        status: "COMPLETED",
        download_url: `/api/v1/kpi/reports/download/${req.params.job_id}.csv`
    });
});

// --- 6. CONFIGURACIÓN ---
router.patch('/configuration/goals/:id', (req, res) => {
    res.json({ success: true, message: `Meta ${req.params.id} actualizada a ${req.body.goal}` });
});

router.put('/configuration/thresholds/:metric_key', (req, res) => {
    res.json({ success: true, metric: req.params.metric_key, threshold: req.body.threshold });
});

router.get('/configuration/data/:metric_key', (req, res) => {
    res.json({ metric: req.params.metric_key, value: 20 });
});

// --- 7. ALERTAS ---
router.get('/alerts/history', (req, res) => {
    res.json([
        { id: 1, type: "STOCK", message: "Stock crítico: Tomates", date: "2024-01-23" }
    ]);
});

router.post('/alerts', (req, res) => {
    res.json({ success: true, message: "Alerta creada" });
});

// --- 8. WEBHOOKS & EVENTOS ---
router.post('/webhooks/delivery/ready', (req, res) => res.json({ status: "ok" }));
router.post('/webhooks/kitchen/ready', (req, res) => res.json({ status: "ok" }));
router.post('/events', (req, res) => res.json({ status: "received" }));

// --- COMPATIBILIDAD CON VISTAS EXISTENTES (FALLBACK) ---
router.get('/api/v1/kpi/business/transactions', (req, res) => {
    const { search = "", start_date, end_date } = req.query;
    const waiters = ['Ana Pérez', 'Carlos Ruiz', 'María Lopez', 'Juan Soto'];
    
    // Generar datos base
    let transactions = Array.from({ length: 100 }, (_, i) => ({
        id: `TXN-${(1000 + i)}`,
        date: "2024-01-23", // Formato ISO para facilitar filtrado
        time: "14:30",
        waiter: waiters[i % waiters.length],
        amount: (Math.random() * 50 + 10).toFixed(2),
        duration: "25 min"
    }));

    // Aplicar filtros simulados
    if (search) {
        const term = search.toLowerCase();
        transactions = transactions.filter(t => 
            t.id.toLowerCase().includes(term) || 
            t.waiter.toLowerCase().includes(term)
        );
    }

    // El filtro de fecha se simula devolviendo un subconjunto si hay fechas
    if (start_date || end_date) {
        transactions = transactions.slice(0, 15); // Simulación de filtrado por rango
    }

    res.json({ 
        data: transactions,
        meta: {
            total: transactions.length,
            filtered_by: { search, start_date, end_date }
        }
    });
});

module.exports = router;

