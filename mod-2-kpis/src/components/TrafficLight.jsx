import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TrafficLight = () => {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 

  const API_URL = `${process.env.KPI_BASE_URL || 'localhost:5000/api/v1/kpi'}/operations/sla-breakdown`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        setData(response.data); // Guarda los datos en el estado
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos. Verifica la conexión a la API.');
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL]); 

  const renderZone = (zoneName, zoneData, bgColor, textColor) => (
    <div className={`p-4 rounded-lg shadow-md ${bgColor} ${textColor} mb-4`}>
        <h3 className="text-lg font-bold mb-2 capitalize">{zoneName.replace('_', ' ')}</h3>
        <p className="mb-1">{zoneData} %</p>
    </div>
  );

  if (loading) return <p className="text-center">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Desglose de SLA de Comandas</h2>
      
      {/* Bloque para la fecha */}
      <div className="p-4 rounded-lg shadow-md bg-gray-100 text-gray-800 mb-6">
        <h3 className="text-lg font-bold">Fecha</h3>
        <p>{data.data_timestamp || 'Fecha no disponible'}</p>
      </div>

      {/* Bloques para las zonas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderZone('green_zone', data.green_zone, 'bg-green-100', 'text-green-800')}
        {renderZone('yellow_zone', data.yellow_zone, 'bg-yellow-100', 'text-yellow-800')}
        {renderZone('red_zone', data.red_zone, 'bg-red-100', 'text-red-800')}
      </div>
    </div>
  );
};

export default TrafficLight;