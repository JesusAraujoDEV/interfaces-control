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

