import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffRanking = () => {
  const [ranking, setRanking] = useState([]); 
  const [meta, setMeta] = useState({ total_items: 0, current_page: 1, per_page: 10 }); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); 
  const limit = 10; 

  const BASE_URL = `${process.env.KPI_BASE_URL || 'localhost:5000/api/v1/kpi'}/operations/staff-metrics/${waiter_id}`; 

  // Función para cargar datos de la API
  const fetchRanking = async (currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(BASE_URL, {
        params: { page: currentPage, limit }
      });
      if (response.data.success) {
        setRanking(response.data.data);
        setMeta(response.data.meta);
      } else {
        setError('Error al cargar los datos.');
      }
    } catch (err) {
      setError('Error de conexión con la API.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente o cambiar de página
  useEffect(() => {
    fetchRanking(page);
  }, [page]);

  // Funciones para paginación
  const handleNextPage = () => {
    if (page < Math.ceil(meta.total_items / meta.per_page)) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Renderizado condicional
  if (loading) return <div className="text-center py-10">Cargando...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Módulo KPI - Ranking de Staff</h1>
      
      {/* Tabla de rankings */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Posición</th>
              <th className="px-4 py-2 text-left">Puntuación</th>
              {/* Agrega más columnas si 'ranking' tiene otros campos, ej. Ventas, Eficiencia */}
            </tr>
          </thead>
          <tbody>
            {ranking.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">{item.id}</td>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.position}</td>
                <td className="px-4 py-2">{item.score}</td>
                {/* Ajusta según los campos reales */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Anterior
        </button>
        <span>Página {meta.current_page} de {Math.ceil(meta.total_items / meta.per_page)}</span>
        <button
          onClick={handleNextPage}
          disabled={page >= Math.ceil(meta.total_items / meta.per_page)}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default StaffRanking;