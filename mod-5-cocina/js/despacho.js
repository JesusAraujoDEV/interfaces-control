    async function cargarDespacho() {
    try {
        const response = await fetch(`${KITCHEN_URL}/kds/queue`, {
        headers: getCommonHeaders()
        });
        const orders = await response.json();

        // Filtrar solo las órdenes con status READY
        const readyOrders = orders.filter(o => o.status === 'READY');
        console.log('Pedidos listos:', readyOrders);

        renderizarDespacho(readyOrders);
    } catch (error) {
        console.error('Error al cargar despacho:', error);
    }
    }

    function renderizarDespacho(orders) {
    const despachoList = document.querySelector('.despacho-list');
    despachoList.innerHTML = '';

    orders.forEach(o => {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.setAttribute('data-id', o.id);

        card.innerHTML = `
        <div class="order-card__header">
            <span class="order-card__id">${o.displayLabel || o.externalOrderId}</span>
            <span class="order-card__timer">Creado: ${new Date(o.createdAt).toLocaleTimeString()}</span>
        </div>
        <p><strong>Modo:</strong> ${o.serviceMode}</p>
        <ul class="order-card__items">
            ${(o.items || []).map(it => `<li><strong>${it.quantity}x</strong> ${it.product?.name || 'Producto'}</li>`).join('')}
        </ul>
        `;

        //Solo mostrar botón si es TAKE_OUT
        if (o.serviceMode === 'TAKE_OUT') {
        card.innerHTML += `
            <button class="btn btn--success btn--full" onclick="marcarEntregado('${o.id}')">
            <i data-lucide="check-circle"></i> Marcar Entregado
            </button>
        `;
        }

        despachoList.appendChild(card);
    });

    lucide.createIcons();
    }

    async function marcarEntregado(taskId) {
    try {
        const payload = {};
        const staffId = localStorage.getItem('staff_id');
        if (staffId) payload.staffId = staffId;

        const res = await fetch(`${KITCHEN_URL}/kds/${taskId}/served`, {
        method: 'PATCH',
        headers: getCommonHeaders(),
        body: JSON.stringify(payload)
        });
        const json = await res.json();
        console.log('Respuesta marcarEntregado:', res.status, json);

        if (res.ok) {
        cargarDespacho();
        } else {
        alert(json.message || 'Error al marcar entregado');
        }
    } catch (error) {
        console.error('Error marcando como entregado:', error);
    }
    }

    document.addEventListener('DOMContentLoaded', cargarDespacho);

    window.marcarEntregado = marcarEntregado;