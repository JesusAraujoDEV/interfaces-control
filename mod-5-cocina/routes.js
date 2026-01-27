const express = require('express');
const path = require('path');
const router = express.Router();

// Middleware para servir archivos estáticos del módulo
router.use(express.static(path.join(__dirname)));

// Definición de rutas
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

router.get('/activos', (req, res) => {
    res.sendFile(path.join(__dirname, 'activos.html'));
});

router.get('/auditoria', (req, res) => {
    res.sendFile(path.join(__dirname, 'auditoria.html'));
});

router.get('/despacho', (req, res) => {
    res.sendFile(path.join(__dirname, 'Despacho.html'));
});

router.get('/inv', (req, res) => {
    res.sendFile(path.join(__dirname, 'inv.html'));
});

router.get('/kds', (req, res) => {
    res.sendFile(path.join(__dirname, 'kds.html'));
});

router.get('/personal', (req, res) => {
    res.sendFile(path.join(__dirname, 'personal.html'));
});

router.get('/rec-pro', (req, res) => {
    res.sendFile(path.join(__dirname, 'rec-pro.html'));
});

module.exports = router;
