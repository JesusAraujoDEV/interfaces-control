let allOrders = [];

async function cargarHistorialPedidos() {
    try {
        const startDate = document.querySelector('#startDate').value;
        const endDate = document.querySelector('#endDate').value;
        const status = document.querySelector('#status').value;

        // Construir la URL con parámetros dinámicos
        let url = `${KITCHEN_URL}/api/kitchen/kds/history?`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (status) params.append('status', status);
        
        url += params.toString();

        const res = await fetch(url, {
            headers: getCommonHeaders()
        });
        
        if (!res.ok) {
            throw new Error(`Error ${res.status}: no se pudo obtener el historial`);
        }

        const data = await res.json();
        allOrders = Array.isArray(data) ? data : (data.history || []);
        
        renderizarHistorialPedidos(allOrders);
    } catch (error) {
        console.error('Error al cargar historial de pedidos:', error);
    }
}

function getStatusBadge(status) {
    const s = status.toUpperCase();
    let className = 'badge';
    if (s === 'READY') className += ' status-ready';
    else if (s === 'SERVED') className += ' status-served';
    else if (s === 'REJECTED' || s === 'CANCELLED') className += ' status-rejected';
    else className += ' badge--warning';
    
    return `<span class="${className}">${status}</span>`;
}

function renderizarHistorialPedidos(orders) {
    const pedidosBody = document.querySelector('#pedidosBody');
    if (!pedidosBody) return;

    pedidosBody.innerHTML = '';

    orders.forEach(o => {
        const row = document.createElement('tr');
        row.className = 'table__row';
        row.innerHTML = `
            <td>#${o.externalOrderId}</td>
            <td font-weight: 600;>${o.product ? o.product.name : 'Unknown Product'}</td>
            <td>${o.quantity}</td>
            <td>${o.serviceMode}</td>
            <td>${getStatusBadge(o.status)}</td>
            <td>${new Date(o.createdAt).toLocaleString()}</td>
            <td>${o.chef ? o.chef.name : '<span style="color: #94a3b8;">Sin asignar</span>'}</td>
            <td>
                <button class="btn btn--secondary btn-view" data-id="${o.id}">
                    <i data-lucide="eye" style="width: 14px; margin-right: 4px;"></i> Detalles
                </button>
            </td>
        `;
        pedidosBody.appendChild(row);
    });

    // Re-inicializar iconos de Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Agregar eventos a botones de ver detalles
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            const order = allOrders.find(x => x.id === orderId);
            if (order) mostrarDetalles(order);
        });
    });
}

function mostrarDetalles(order) {
    const modal = document.querySelector('#modalDetalle');
    const contenido = document.querySelector('#detalleContenido');
    
    contenido.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Orden Externa ID:</span>
            <span class="detail-value">#${order.externalOrderId}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Producto:</span>
            <span class="detail-value" style="font-weight: bold; color: var(--primary);">${order.product ? order.product.name : 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Cantidad:</span>
            <span class="detail-value">${order.quantity}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Modo de Servicio:</span>
            <span class="detail-value">${order.serviceMode}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Estado Actual:</span>
            <span class="detail-value">${getStatusBadge(order.status)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Fecha Creación:</span>
            <span class="detail-value">${new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Hora Despacho:</span>
            <span class="detail-value">${order.servedAt ? new Date(order.servedAt).toLocaleString() : 'Pendiente'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Cocinero Asignado:</span>
            <span class="detail-value">${order.chef ? order.chef.name : 'Ninguno'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Mesero:</span>
            <span class="detail-value">${order.waiter ? order.waiter.name : 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Notas:</span>
            <span class="detail-value">${order.notes || 'Sin notas adicionales'}</span>
        </div>
    `;
    
    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

function cerrarModal() {
    document.querySelector('#modalDetalle').classList.remove('active');
}

// Asociar el botón de búsqueda
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnBuscar').addEventListener('click', cargarHistorialPedidos);
    document.querySelector('#closeModal').addEventListener('click', cerrarModal);
    document.querySelector('#btnCerrarModal').addEventListener('click', cerrarModal);
    
    // Carga inicial
    cargarHistorialPedidos();
});
