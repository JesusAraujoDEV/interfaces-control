async function cargarDespacho() {
    try {
    const response = await fetch(`${KITCHEN_URL}/kds/queue`, {
        headers: getCommonHeaders()
    });
    const tareas = await response.json();

    const readyOrders = tareas.filter(t => t.status === 'READY');
    renderizarDespacho(readyOrders);
    } catch (error) {
    console.error('Error al cargar despacho:', error);
    }
}

function renderizarDespacho(ordenes) {
    const feed = document.querySelector('.dispatch-feed');
    feed.innerHTML = '';

    ordenes.forEach(o => {
    const item = document.createElement('article');
    item.className = 'dispatch-item';
    item.setAttribute('data-id', o.id);

    item.innerHTML = `
        <div class="dispatch-item__header">
            <h2 class="dispatch-item__title">${o.displayLabel || o.externalOrderId}</h2>
            <span class="dispatch-item__timer">${new Date(o.updatedAt).toLocaleTimeString()}</span>
        </div>
        <div class="dispatch-item__content">
            <span class="dispatch-item__status">Listo</span>
            <p class="dispatch-item__description">${o.quantity}x ${o.product?.name || 'Producto'}</p>
        </div>
        <footer class="dispatch-actions">
            <button class="btn btn--primary btn--xl" onclick="marcarEntregado('${o.id}')">
            <i data-lucide="check-check"></i> MARCAR ENTREGADO
            </button>
        </footer>
    `;

    feed.appendChild(item);
    });

    lucide.createIcons();
}

async function marcarEntregado(taskId) {
    try {
    await fetch(`${KITCHEN_URL}/kds/${taskId}/served`, {
        method: 'PATCH',
        headers: getCommonHeaders(),
        body: JSON.stringify({ staff_id: localStorage.getItem('staff_id') })
    });
    cargarDespacho();
    } catch (error) {
    console.error('Error marcando entregado:', error);
    }
}

document.addEventListener('DOMContentLoaded', cargarDespacho);

window.marcarEntregado = marcarEntregado;