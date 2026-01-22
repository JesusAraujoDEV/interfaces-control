    async function cargarColaKDS() {
    try {
        const response = await fetch(`${KITCHEN_URL}/kds/queue`, {
        headers: getCommonHeaders()
        });
        const tareas = await response.json();
        console.log(tareas);
        renderizarTareas(tareas);
    } catch (error) {
        console.error('Error al cargar la cola KDS:', error);
    }
    }

    function renderizarTareas(tareas) {
    const nuevoCol = document.querySelector('.kds-column:nth-child(1) .kds-column__list');
    const cocinandoCol = document.querySelector('.kds-column:nth-child(2) .kds-column__list');
    const listoCol = document.querySelector('.kds-column:nth-child(3) .kds-column__list');

    nuevoCol.innerHTML = '';
    cocinandoCol.innerHTML = '';
    listoCol.innerHTML = '';

    tareas.forEach(tarea => {
        const card = document.createElement('article');
        card.className = 'order-card';
        card.setAttribute('data-id', tarea.id);
        card.setAttribute('data-created', tarea.createdAt);

        card.innerHTML = `
        <div class="order-card__header">
            <div class="order-card__meta">
            <span class="order-card__id">${tarea.displayLabel || tarea.externalOrderId}</span>
            <span class="order-card__timer js-timer">Creado: ${new Date(tarea.createdAt).toLocaleTimeString()}</span>
            </div>
            <span class="order-type order-type--${tarea.serviceMode.toLowerCase()}">
            ${tarea.serviceMode === 'DINE_IN' ? '<i data-lucide="utensils"></i> En Restaurante' : '<i data-lucide="shopping-bag"></i> Para Llevar'}
            </span>
        </div>
        <ul class="order-card__items">
            <li><strong>${tarea.quantity}x</strong> ${tarea.product?.name || 'Producto'}</li>
        </ul>
        ${renderBotonAccion(tarea)}
        `;

        if (tarea.status === 'PENDING') {
        card.innerHTML += `
            <button class="btn btn--secondary btn--full"
            onclick="asignarTarea('${tarea.id}', localStorage.getItem('staff_id'), 'CHEF')">
            Tomar Orden
            </button>
        `;
        nuevoCol.appendChild(card);
        } else if (tarea.status === 'COOKING') {
        cocinandoCol.appendChild(card);
        } else if (tarea.status === 'READY') {
        listoCol.appendChild(card);
        }
    });

    lucide.createIcons();
    actualizarTimers();
    }

    async function actualizarEstado(taskId, newStatus) {
    try {
        const res = await fetch(`${KITCHEN_URL}/kds/${taskId}/status`, {
        method: 'PATCH',
        headers: getCommonHeaders(),
        body: JSON.stringify({
            newStatus,
            staffId: localStorage.getItem('staff_id')
        })
        });
        const json = await res.json();
        console.log('Respuesta actualizarEstado:', res.status, json);
        cargarColaKDS();
    } catch (error) {
        console.error('Error actualizando estado:', error);
    }
    }

    async function marcarServido(taskId) {
    try {
        const res = await fetch(`${KITCHEN_URL}/kds/${taskId}/served`, {
        method: 'PATCH',
        headers: getCommonHeaders(),
        body: JSON.stringify({
            staffId: localStorage.getItem('staff_id')
        })
        });
        const json = await res.json();
        console.log('Respuesta marcarServido:', res.status, json);
        cargarColaKDS();
    } catch (error) {
        console.error('Error marcando como servido:', error);
    }
    }

    async function asignarTarea(taskId, staffId, role = 'CHEF') {
    if (!staffId) {
        alert('No hay staff_id en localStorage. Debes hacer login o check-in primero.');
        return;
    }

    try {
        const res = await fetch(`${KITCHEN_URL}/kds/${taskId}/assign`, {
        method: 'PATCH',
        headers: getCommonHeaders(),
        body: JSON.stringify({ staffId, role })
        });
        const result = await res.json();
        console.log('Respuesta asignarTarea:', res.status, result);

        const card = document.querySelector(`.order-card[data-id="${taskId}"]`);
        if (card) {
        const info = document.createElement('p');
        info.className = 'order-card__assigned';
        info.textContent = `Asignado a: ${result.assignedChef?.name || 'Chef'}`;
        card.appendChild(info);
        }
    } catch (error) {
        console.error('Error asignando tarea:', error);
    }
    }

    function renderBotonAccion(tarea) {
    if (tarea.status === 'PENDING') {
        return `
        <div class="card-actions">
            <button class="btn btn--primary btn--full" onclick="actualizarEstado('${tarea.id}', 'COOKING')">EMPEZAR</button>
            <button class="btn btn--danger btn--icon" title="Rechazar" onclick="confirmarRechazo('${tarea.id}')">✕</button>
        </div>
        `;
    }
    if (tarea.status === 'COOKING') {
        return `
        <div class="card-actions">
            <button class="btn btn--primary btn--full" onclick="actualizarEstado('${tarea.id}', 'READY')">LISTO</button>
            <button class="btn btn--danger btn--icon" title="Rechazar" onclick="confirmarRechazo('${tarea.id}')">✕</button>
        </div>
        `;
    }
    if (tarea.status === 'READY') {
        return `<button class="btn btn--success btn--full" onclick="marcarServido('${tarea.id}')"><i data-lucide="check-circle"></i> RECOGIDO</button>`;
    }
    return '';
    }

    async function confirmarRechazo(taskId) {
    const ok = window.confirm('¿Seguro que deseas rechazar esta orden? Esta acción no se puede deshacer.');
    if (!ok) return;

    try {
        const response = await fetch(`${KITCHEN_URL}/kds/${taskId}/reject`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ reason: 'Rejected by kitchen' })
        });
        const json = await response.json();
        console.log('Respuesta confirmarRechazo:', response.status, json);

        if (!response.ok) throw new Error(`Reject failed: ${response.status}`);
        const card = document.querySelector(`.order-card[data-id="${taskId}"]`);
        if (card) card.remove();
    } catch (error) {
        console.error('Error rechazando orden:', error);
    }
    }

    const POLL_MS = 30_000;

    document.addEventListener('DOMContentLoaded', () => {
    cargarColaKDS();
    setInterval(syncKDS, POLL_MS);
    });

    async function syncKDS() {
    try {
        const response = await fetch(`${KITCHEN_URL}/kds/queue`, {
        headers: getCommonHeaders()
        });
        const serverTasks = await response.json();
        renderizarTareas(serverTasks);
    } catch (error) {
        console.error('Error en sync KDS:', error);
    }
    }

    function actualizarTimers() {
    const cards = document.querySelectorAll('.order-card');
    const now = Date.now();

    cards.forEach(card => {
        const created = new Date(card.getAttribute('data-created')).getTime();
        const diff = now - created;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        const timerEl = card.querySelector('.js-timer');
        if (timerEl) timerEl.textContent = `${minutes}m ${seconds}s`;

        if (diff > 20 * 60 * 1000) {
        card.classList.add('border-red-500');
        } else {
        card.classList.remove('border-red-500');
        }
    });
    }

window.confirmarRechazo = confirmarRechazo;
window.actualizarEstado = actualizarEstado;
window.marcarServido = marcarServido;
window.asignarTarea = asignarTarea;