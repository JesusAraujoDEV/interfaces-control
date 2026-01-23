const getdata = require('./api.js');
const { BrowserRouter } = require('react-router-dom');
const React = require('react')
const ReactDOMServer = require('react')


const { Router, static, json } = require('express');
const { join } = require('path');

const router = Router()

router.use(json()); // Support JSON bodies
router.use(static(join(__dirname, 'public')));


router.get('/kpis/dashboard', (req, res) => {
    console.log(__dirname);
    res.sendFile(join(__dirname, 'public', 'dashboard.html'));
});

router.get('/kpis/bussines-intelligence', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'bussines-intelligence.html'));
});

router.get('/kpis/operational-efficent', (req, res) => {
    res.sendFile(join(__dirname, 'components', 'TrafficLight.html'));
});
router.get('/kpis/staff', (req, res) => {
    res.sendFile(join(__dirname, 'components', 'StaffRanking.html'));
});

router.get('/kpis/inventory', (req, res) => {
    res.sendFile(join(__dirname, 'components', 'InventoryView.html'));
});

router.get('/kpis/inventory', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'inventario.html'));
});


// -- MOCK API ENDPOINTS --

// Mutable state (mock database)
let summaryData = {
    revenue: 12450,
    goal: 65,
    avg_time: '04:15 min'
};

router.get('/api/v1/kpi/dashboard/summary', (req, res) => {
    res.json({
        data: summaryData
    });
});

router.patch('/api/v1/kpi/configuration/goals/:id', (req, res) => {
    const { id } = req.params;
    const { goal } = req.body;

    // In a real app, we'd valid id and update specific goal
    if (goal !== undefined) {
        summaryData.goal = parseInt(goal);
        return res.json({
            message: 'Goal updated successfully',
            data: { goal: summaryData.goal }
        });
    }

    res.status(400).json({ message: 'Invalid data' });
});

let stockConfig = {
    threshold: 20
};

router.put('/api/v1/kpi/configuration/thresholds/:metric', (req, res) => {
    const { metric } = req.params;
    const { threshold } = req.body;

    if (metric === 'stock') {
        if (threshold !== undefined) {
            stockConfig.threshold = parseInt(threshold);
            return res.json({
                message: 'Threshold updated',
                data: { metric, threshold: stockConfig.threshold }
            });
        }
    }

    res.status(400).json({ message: 'Invalid metric or data' });
});

// --- HELPER: Mock Large Dataset ---
const generateTransactions = (count) => {
    const transactions = [];
    const waiters = ['Ana Pérez', 'Carlos Ruiz', 'María Lopez', 'Juan Soto'];

    for (let i = 0; i < count; i++) {
        transactions.push({
            id: `TXN-${(100000 + i).toString()}`,
            date: new Date(2024, 7, 1 + (i % 30)).toLocaleDateString('es-ES'), // Randomish date in Aug
            time: `${Math.floor(9 + Math.random() * 12)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            waiter: waiters[i % waiters.length],
            amount: (Math.random() * 100).toFixed(2),
            duration: `${Math.floor(15 + Math.random() * 45)} min`
        });
    }
    return transactions;
};

// Cache the data so we don't regenerate on every request
const largeTransactionData = generateTransactions(5000);

router.get('/api/v1/kpi/business/transactions', (req, res) => {
    // Simulate network delay for realism if desired, but here we want speed
    res.json({
        data: largeTransactionData,
        count: largeTransactionData.length
    });
});

router.get('/api/v1/kpi/dashboard/summary/range', (req, res) => {
    res.json({
        data: [
            { label: '8 AM', value: 300 },
            { label: '9 AM', value: 450 },
            { label: '10 AM', value: 800 },
            { label: '11 AM', value: 1200 },
            { label: '12 PM', value: 1850 },
            { label: '1 PM', value: 1600 },
            { label: '2 PM', value: 1100 },
            { label: '3 PM', value: 900 },
            { label: '4 PM', value: 1000 },
            { label: '5 PM', value: 1300 },
            { label: '6 PM', value: 1500 },
            { label: '7 PM', value: 1200 },
            { label: '8 PM', value: 800 }
        ]
    });
});

// --- OPERATIONS ENDPOINTS ---
router.get('/api/v1/kpi/operations/staff-ranking', (req, res) => {
    const { sort_by = "EFFICIENCY", page = 1, limit = 10 } = req.query;
    // Mock data
    const rankingData = [
        { id: 1, name: "Sofia Vergara", total_orders: 145, avg_time_minutes: 12, current_status: "ACTIVE", efficiency_score: 95 },
        { id: 2, name: "Pedro Pascal", total_orders: 132, avg_time_minutes: 14, current_status: "ACTIVE", efficiency_score: 92 },
        { id: 3, name: "Oscar Isaac", total_orders: 120, avg_time_minutes: 15, current_status: "REST", efficiency_score: 88 },
        { id: 4, name: "Ana de Armas", total_orders: 110, avg_time_minutes: 11, current_status: "ACTIVE", efficiency_score: 98 },
        { id: 5, name: "Gael Garcia", total_orders: 95, avg_time_minutes: 18, current_status: "ACTIVE", efficiency_score: 80 }
    ];
    
    // Simple pagination mock
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = rankingData.slice(startIndex, endIndex);

    res.json({
        success: true,
        data: paginatedData,
        meta: {
            total_items: rankingData.length,
            current_page: parseInt(page),
            per_page: parseInt(limit)
        }
    });
});

router.get('/api/v1/kpi/operations/sla-breakdown', (req, res) => {
    res.json({
        success: true,
        data_timestamp: new Date().toLocaleDateString('es-ES'),
        green_zone_percent: 75,
        yellow_zone_percent: 20,
        red_zone_percent: 5
    });
});

// --- INVENTORY ENDPOINTS ---
router.get('/api/v1/kpi/inventory/pareto', (req, res) => {
    res.json({
        success: true,
        data: {
            data: [
                { name: "Café Latte", revenue_generated: 4500, quantity_sold: 1200 },
                { name: "Cappuccino", revenue_generated: 3200, quantity_sold: 800 },
                { name: "Espresso", revenue_generated: 2800, quantity_sold: 1400 },
                { name: "Muffin Arándanos", revenue_generated: 1500, quantity_sold: 500 },
                { name: "Té Chai", revenue_generated: 1200, quantity_sold: 300 },
                { name: "Croissant", revenue_generated: 900, quantity_sold: 400 }
            ]
        }
    });
});

router.get('/api/v1/kpi/inventory/alerts', (req, res) => {
    res.json({
        critical_count: 2,
        alerts: [
            { item_name: "Leche Entera", current_level_pct: 5, severity: "CRITICAL" },
            { item_name: "Azúcar Morena", current_level_pct: 8, severity: "CRITICAL" },
            { item_name: "Vasos 8oz", current_level_pct: 15, severity: "WARNING" }
        ]
    });
});

// --- CONFIGURATION ENDPOINTS ---
router.get('/api/v1/kpi/configuration/data/:metric_key', (req, res) => {
    const { metric_key } = req.params;
    res.json({
        success: true,
        metric: metric_key,
        value: 20
    });
});

router.post('/api/v1/kpi/configuration/data/:metric_key', (req, res) => {
    const { metric_key } = req.params;
    res.json({
        success: true,
        message: `Configuración para ${metric_key} actualizada.`
    });
});

// --- REPORTS ENDPOINTS ---
router.post('/api/v1/kpi/reports/export', (req, res) => {
    res.json({
        success: true,
        job_id: "JOB-" + Math.random().toString(36).substr(2, 9),
        message: "Proceso de exportación iniciado."
    });
});

router.get('/api/v1/kpi/reports/jobs/:job_id', (req, res) => {
    res.json({
        success: true,
        job_id: req.params.job_id,
        status: "COMPLETED",
        download_url: "/api/v1/kpi/reports/download/file.csv"
    });
});

// --- ALERTS ENDPOINTS ---
router.post('/api/v1/kpi/alerts', (req, res) => {
    res.json({
        success: true,
        message: "Alerta creada manualmente."
    });
});

router.get('/api/v1/kpi/alerts/history', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, type: "STOCK_LOW", message: "Café en grano por debajo del 10%", timestamp: new Date().toISOString() },
            { id: 2, type: "SLA_BREACH", message: "Tiempo de espera excedido en Mesa 4", timestamp: new Date().toISOString() }
        ]
    });
});

// --- EVENTS ENDPOINTS ---
router.post('/api/v1/kpi/events', (req, res) => {
    res.json({
        success: true,
        message: "Evento registrado."
    });
});

router.get('/api/v1/kpi/health', (req, res) => {
    res.json({ status: "ok", version: "1.0.0" });
});


router.get('/test-connection', async (req, res) => {
    try {
        // Now pointing to itself internally or just mocking response
        // const data = await getdata('/kpi/dashboard/summary'); 
        res.json({
            status: 'Conection successful',
            data: { message: "Mocked successful connection" }
        })
    } catch (error) {
        res.status(500).json({ message: 'Connection failed', error: error.message });
    }
});

module.exports = router

