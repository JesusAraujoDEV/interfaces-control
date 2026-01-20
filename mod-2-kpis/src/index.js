import getdata from './api.js';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import StaffMetricsPage from './components/StaffMetrics.jsx';
import StaffRanking from './components/StaffRanking.jsx';
import TrafficLight from './components/TrafficLight.jsx';

import { Router } from 'express';
import { join } from 'path';

const router = Router()

router.use(express.static(join(__dirname, 'public')));

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

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/operations/staff-ranking" element={<StaffRanking />} />
        <Route path="/operations/sla-breakdown" element={<TrafficLight />} />
        <Route path="/operations/staff-metrics/:waiter_id" element={<StaffMetricsPage />} />
        {/* Ruta para páginas no encontradas (404) */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

export default router

