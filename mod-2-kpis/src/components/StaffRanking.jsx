const React = require('react');
const { useState, useEffect } = require('react');
const { useParams } = require('react-router-dom');
const axios = require('axios');

const StaffRanking = () => {
  const { waiter_id } = useParams(); 
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); 

  if (!waiter_id) waiter_id=0;

  const BASE_URL = `${process.env.KPI_BASE_URL || 'localhost:3000/api/v1/kpi'}/operations/staff-metrics/${waiter_id}`;

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(BASE_URL, {
          params: { page: currentPage, page_size: 10 } 
        });
        setMetrics(response.data);
      } catch (err) {
        setError('Error al cargar métricas: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [waiter_id, currentPage]); 

  if (loading) return (<><div className="text-center py-10">Cargando métricas...</div></>);
  if (error) return (<><div className="text-center py-10 text-red-500">{error}</div></>);
  if (!metrics) return (<><div className="text-center py-10">No hay datos disponibles.</div></>);

  const { meta, data } = metrics;
  const { total, page, page_size, waiter, date_from, date_to, granularity } = meta;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Métricas de Operaciones - KPI</h1>
      
      {/* Información del Waiter y Filtros */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <p><strong>Waiter:</strong> {waiter.name || `ID: ${waiter.id}`}</p>
        <p><strong>Período:</strong> {new Date(date_from).toLocaleDateString()} - {new Date(date_to).toLocaleDateString()}</p>
        <p><strong>Granularidad:</strong> {granularity}</p>
        <p><strong>Total Registros:</strong> {total} | Página: {page} de {Math.ceil(total / page_size)}</p>
      </div>

      {/* Tabla de Métricas */}
      <table className="min-w-full bg-white border border-gray-300 rounded">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 border">Fecha</th>
            <th className="py-2 px-4 border">Ventas</th>
            <th className="py-2 px-4 border">Pedidos Atendidos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="py-2 px-4 border">{new Date(item.date).toLocaleDateString()}</td>
              <td className="py-2 px-4 border">${item.sales || 0}</td>
              <td className="py-2 px-4 border">{item.orders_served || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Controles de Paginación */}
      <div className="flex justify-between mt-4">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
          disabled={page <= 1} 
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Anterior
        </button>
        <button 
          onClick={() => setCurrentPage(prev => prev + 1)} 
          disabled={page >= Math.ceil(total / page_size)} 
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default StaffRanking;