const getdata = require('./api.js');

const { Router, static } = require('express');
const { join } = require('path');

const router = Router()

router.use(static(join(__dirname, 'public')));

router.get('/kpis/dashboard', (req, res) => {
    console.log(__dirname);
    res.sendFile(join(__dirname, 'public' ,'dashboard.html'));
});

router.get('/kpis/bussines-intelligence', (req, res) => {
    res.sendFile(join(__dirname, 'public' ,'bussines-intelligence.html'));
});

router.get('/kpis/operational-efficent', (req, res) => {
    res.sendFile(join(__dirname, 'public' ,'eficiencia-operacional.html'));
});

router.get('/kpis/inventory', (req, res) => {
    res.sendFile(join(__dirname, 'public' ,'inventario.html'));
});

router.get('/test-connection', async (req, res) => {
    try {
        const data = await getdata('/kpi/dashboard/summary');
        res.json({
            status: 'Conection successful',
            data: data.data
        })
    }catch (error) {
        res.status(500).json({ message: 'Connection failed', error: error.message });
    }
});

module.exports = router

