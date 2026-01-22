    async function cargarHistorialPedidos() {
    try {
        const startDate = document.querySelector('#startDate').value;
        const endDate = document.querySelector('#endDate').value;
        const status = document.querySelector('#status').value;

        // Construir la URL con parámetros dinámicos
        let url = `${KITCHEN_URL}/kds/history?`;
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        if (status) url += `status=${status}`;

        const res = await fetch(url, {
        headers: getCommonHeaders()
        });
        if (!res.ok) {
        throw new Error(`Error ${res.status}: no se pudo obtener el historial`);
        }

        const orders = await res.json();
        console.log('Historial de pedidos:', orders);

        renderizarHistorialPedidos(orders);
    } catch (error) {
        console.error('Error al cargar historial de pedidos:', error);
    }
    }

    function renderizarHistorialPedidos(orders) {
    const pedidosBody = document.querySelector('#pedidosBody');
    if (!pedidosBody) return;

    pedidosBody.innerHTML = '';

    const data = Array.isArray(orders) ? orders : orders.history || [];

    data.forEach(o => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${o.displayLabel || o.externalOrderId}</td>
        <td>${o.serviceMode}</td>
        <td>${o.status}</td>
        <td>${new Date(o.createdAt).toLocaleString()}</td>
        <td>${o.servedAt ? new Date(o.servedAt).toLocaleString() : 'No entregado'}</td>
        <td>${o.chef ? o.chef.name : '—'}</td>
        `;
        pedidosBody.appendChild(row);
    });
    }

    // Asociar el botón de búsqueda
    document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnBuscar').addEventListener('click', cargarHistorialPedidos);
    });