import { apiFetch } from '/js/api.js';

async function cargarColaKDS() {
    try {
    const tareas = await apiFetch('/kitchen/kds/queue');
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

    card.innerHTML = `
        <div class="order-card__header">
        <div class="order-card__meta">
            <span class="order-card__id">${tarea.displayLabel || tarea.externalOrderId}</span>
            <span class="order-card__timer">Creado: ${new Date(tarea.createdAt).toLocaleTimeString()}</span>
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
}

function renderBotonAccion(tarea) {
    if (tarea.status === 'PENDING') {
        return `<button class="btn btn--primary btn--full" onclick="actualizarEstado('${tarea.id}', 'COOKING')">EMPEZAR</button>`;
    }
    if (tarea.status === 'COOKING') {
        return `<button class="btn btn--primary btn--full" onclick="actualizarEstado('${tarea.id}', 'READY')">LISTO</button>`;
    }
    if (tarea.status === 'READY') {
        return `<button class="btn btn--success btn--full" onclick="marcarServido('${tarea.id}')"><i data-lucide="check-circle"></i> RECOGIDO</button>`;
    }
    return '';
}

async function actualizarEstado(taskId, newStatus) {
    try {
    await apiFetch(`/kitchen/kds/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ newStatus })
    });
    cargarColaKDS();
    } catch (error) {
    console.error('Error actualizando estado:', error);
    }
}

async function marcarServido(taskId) {
    try {
    await apiFetch(`/kitchen/kds/${taskId}/served`, {
        method: 'PATCH',
        body: JSON.stringify({ staff_id: localStorage.getItem('staff_id') })
    });
    cargarColaKDS();
    } catch (error) {
    console.error('Error marcando como servido:', error);
    }
}

async function asignarTarea(taskId, staffId, role = 'CHEF') {
    try {
    const result = await apiFetch(`/kitchen/kds/${taskId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ staffId, role })
    });

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

document.addEventListener('DOMContentLoaded', cargarColaKDS);

window.actualizarEstado = actualizarEstado;
window.marcarServido = marcarServido;
window.asignarTarea = asignarTarea;