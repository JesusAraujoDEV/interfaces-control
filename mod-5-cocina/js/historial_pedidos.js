let allOrders = [];
let staffMap = {};

function formatStaffName(staff) {
    if (!staff) return null;
    const first = staff.firstName || staff.firstname || staff.givenName || '';
    const last = staff.lastName || staff.lastname || staff.surname || staff.familyName || '';
    const full = `${first} ${last}`.trim();
    return full || staff.externalName || staff.name || staff.displayName || staff.email || null;
}

async function loadStaffMap() {
    try {
        const resp = await fetch(`${KITCHEN_URL}/api/kitchen/staff`, {
            headers: getCommonHeaders()
        });
        if (!resp.ok) return;
        const list = await resp.json();
        list.forEach(s => {
            staffMap[s.id] = formatStaffName(s) || s.workerCode;
        });
    } catch (e) {
        console.warn('No se pudo cargar staff:', e);
    }
}

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

        await loadStaffMap();

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
    const safeStatus = status || 'UNKNOWN';
    const s = safeStatus.toUpperCase();
    let className = 'badge';
    if (s === 'READY') className += ' status-ready';
    else if (s === 'SERVED') className += ' status-served';
    else if (s === 'REJECTED' || s === 'CANCELLED') className += ' status-rejected';
    else className += ' badge--warning';
    
    return `<span class="${className}">${safeStatus}</span>`;
}

function resolveStaffName(order, role) {

console.log('Resolving staff name for role:', role, 'in order:', order);    // role: 'chef' | 'waiter'
    const obj = order?.[role];
    if (obj) {
        return formatStaffName(obj) || obj.workerCode || obj.email;
    }

    const byName = order?.[`${role}Name`] || order?.[`${role}_name`];
    if (byName) return byName;

    const idField = order?.[`${role}Id`] || order?.[`${role}_id`] || order?.[`assigned${role.charAt(0).toUpperCase()}${role.slice(1)}Id`];
    if (idField && staffMap[idField]) return staffMap[idField];

    return null;
}

function renderizarHistorialPedidos(orders) {
    const pedidosBody = document.querySelector('#pedidosBody');
    if (!pedidosBody) return;

    pedidosBody.innerHTML = '';

    orders.forEach(o => {
        const row = document.createElement('tr');
        row.className = 'table__row';
        const productName = o.product?.name || o.productName || o.product_name || 'Producto no disponible';
        const externalId = o.externalOrderId || o.external_id || o.id || 'N/A';
        const createdAt = o.createdAt || o.created_at || o.timestamp || null;
        const chefName = resolveStaffName(o, 'chef');

        row.innerHTML = `
            <td>#${externalId}</td>
            <td style="font-weight: 600;">${productName}</td>
            <td>${o.quantity ?? '-'}</td>
            <td>${o.serviceMode || o.service_mode || '-'}</td>
            <td>${getStatusBadge(o.status)}</td>
            <td>${createdAt ? new Date(createdAt).toLocaleString() : '-'}</td>
            <td>${chefName || '<span style="color: #94a3b8;">Sin asignar</span>'}</td>
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
            <span class="detail-value">#${order.externalOrderId || order.external_id || order.id || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Producto:</span>
            <span class="detail-value" style="font-weight: bold; color: var(--primary);">${order.product?.name || order.productName || order.product_name || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Cantidad:</span>
            <span class="detail-value">${order.quantity}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Modo de Servicio:</span>
            <span class="detail-value">${order.serviceMode || order.service_mode || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Estado Actual:</span>
            <span class="detail-value">${getStatusBadge(order.status)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Fecha Creación:</span>
            <span class="detail-value">${order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toLocaleString() : '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Hora Despacho:</span>
            <span class="detail-value">${order.servedAt || order.served_at ? new Date(order.servedAt || order.served_at).toLocaleString() : 'Pendiente'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Cocinero Asignado:</span>
            <span class="detail-value">${resolveStaffName(order, 'chef') || 'Ninguno'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Mesero:</span>
            <span class="detail-value">${resolveStaffName(order, 'waiter') || 'N/A'}</span>
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
