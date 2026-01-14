const express = require('express')
const path = require('path')

const router = express.Router()

router.use(express.static(path.join(__dirname, 'public')));

router.get('/kpis/dashboard', (req, res) => {
    console.log(__dirname);
    res.sendFile(path.join(__dirname, 'public' ,'dashboard.html'));
});

router.get('/kpis/bussines-intelligence', (req, res) => {
    res.sendFile(path.join(__dirname, 'public' ,'bussines-intelligence.html'));
});

router.get('/kpis/operational-efficent', (req, res) => {
    res.sendFile(path.join(__dirname, 'public' ,'eficiencia-operacional.html'));
});

router.get('/kpis/inventory', (req, res) => {
    res.sendFile(path.join(__dirname, 'public' ,'inventario.html'));
});

module.exports = router

