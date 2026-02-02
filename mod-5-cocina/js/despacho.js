// CONFIG
const CONFIG = {
    API_URL: window.__APP_CONFIG__?.KITCHEN_URL || 'http://localhost:3000',
    REFRESH_RATE: 10000 
};

// STATE
let state = {
    tasks: [],
    filter: 'ALL', // 'ALL', 'DINE_IN', 'DELIVERY'
    activeModal: null,
    pendingAction: null // { type: 'ASSIGN'|'SERVE', orderId: '...' }
};

// DOM
const ui = {
    tabs: document.querySelectorAll('.dispatch-tabs__btn'),
    feed: document.getElementById('dispatchFeed'),
    authModal: document.getElementById('authModal'),
    authForm: document.getElementById('authForm'),
    workerCode: document.getElementById('workerCode'),
    closeModalBtn: document.getElementById('closeAuthModal'),
    cancelModalBtn: document.getElementById('cancelAuthBtn')
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModal();
    fetchTasks();
    setInterval(fetchTasks, CONFIG.REFRESH_RATE);
});

function initTabs() {
    ui.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
             ui.tabs.forEach(b => b.classList.remove('dispatch-tabs__btn--active'));
             btn.classList.add('dispatch-tabs__btn--active');
             state.filter = btn.dataset.filter;
             render();
        });
    });
}

function initModal() {
    const closeModal = () => {
        if(ui.authModal) {
            ui.authModal.classList.remove('modal--active');
            setTimeout(() => ui.authModal.style.display = 'none', 300);
        }
        state.pendingAction = null;
        if(ui.authForm) ui.authForm.reset();
    };

    if(ui.closeModalBtn) ui.closeModalBtn.addEventListener('click', closeModal);
    if(ui.cancelModalBtn) ui.cancelModalBtn.addEventListener('click', closeModal);

    if(ui.authForm) {
        ui.authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = ui.workerCode.value.trim();
            if(!code) return;

            try {
                // 1. Validate Worker
                const staff = await validateWorker(code);
                if(!staff) {
                    alert('Código inválido o usuario inactivo');
                    return;
                }

                // 2. Validate Role for Operational Actions
                const actionType = state.pendingAction ? state.pendingAction.type : null;
                const isOperational = ['ASSIGN', 'SERVE'].includes(actionType);
                const allowedRoles = ['WAITER', 'HEAD_WAITER'];

                // 2.1 Validate Active Status
                if (staff.isActive === false) {
                    alert(`⛔ ACCESO DENEGADO\n\nEl usuario ${staff.name || 'Personal'} no está activo.`);
                    return;
                }

                if (isOperational && !allowedRoles.includes(staff.role)) {
                    alert(`⛔ ACCESO DENEGADO\n\nEl usuario ${staff.name} tiene el rol "${staff.role}".\nSolo personal de servicio (Meseros) puede despachar pedidos.`);
                    return;
                }

                // 3. Validate Shift Status
                const isClockedIn = !!staff.currentShift;

                if (isOperational) {
                     if (!isClockedIn) {
                         alert(`⚠️ ACCESO DENEGADO\n\nEl usuario ${staff.name || 'Personal'} no tiene un turno activo.\nPor favor, fiche entrada antes de tomar pedidos.`);
                         return;
                     }
                }
                
                if (actionType === 'ATTENDANCE_OUT' && !isClockedIn) {
                     alert(`El usuario ${staff.name} no tiene un turno activo para cerrar.`);
                     return;
                }
                
                if (actionType === 'ATTENDANCE_IN' && isClockedIn) {
                     alert(`El usuario ${staff.name} ya tiene un turno activo iniciado.`);
                     return;
                }

                // 3. Perform Action
                if(state.pendingAction) {
                    await executeAction(state.pendingAction, staff);

                    // 3. Chain Flow: If Assigned, offer to Serve immediately
                    if(state.pendingAction.type === 'ASSIGN') {
                        // Optional: Use a nicer UI for this, but confirm works for MVP
                        // We ask the user if they want to complete the flow (Serve) immediately
                        // using the credentials they just provided.
                        const wantsToServe = confirm(`Pedido asignado a ${staff.workerCode}. \n¿Desea marcarlo como ENTREGADO ahora mismo?`);
                        
                        if(wantsToServe) {
                            await executeAction({ ...state.pendingAction, type: 'SERVE' }, staff);
                        }
                    }
                }

                closeModal();
                await fetchTasks(); // Refresh immediately

            } catch (error) {
                console.error(error);
                alert('Error al procesar la solicitud: ' + error.message);
            }
        });
    }

    // Expose to window for inline onclick
    window.openAuthModal = (actionType, orderId) => {
        state.pendingAction = { type: actionType, orderId };
        if(ui.authModal) {
            ui.authModal.style.display = 'block';
            setTimeout(() => ui.authModal.classList.add('modal--active'), 10);
            if(ui.workerCode) {
                ui.workerCode.value = '';
                ui.workerCode.focus();
            }
            
            // Update Title Context
            const titleEl = ui.authModal.querySelector('.modal__header h2');
            if (titleEl) {
                if (actionType.startsWith('ATTENDANCE')) {
                    titleEl.textContent = actionType === 'ATTENDANCE_IN' ? 'Fichar Entrada de Turno' : 'Fichar Salida de Turno';
                } else {
                    titleEl.textContent = 'Identificación Requerida';
                }
            }
        }
    };
}

// API
async function fetchTasks() {
    try {
        // Fetch queue. If status=READY acts as specific filter, we use it.
        const res = await fetch(`${CONFIG.API_URL}/api/kitchen/kds/queue?status=READY`);
        
        if(!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        const list = Array.isArray(data) ? data : [];
        
        // Filter strictly for READY tasks (client side safeguard)
        state.tasks = list.filter(t => t.status === 'READY');
        
        render();
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

async function validateWorker(code) {
    const res = await fetch(`${CONFIG.API_URL}/api/kitchen/staff/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerCode: code })
    });
    
    if(!res.ok) {
        if(res.status === 401 || res.status === 404) return null;
        throw new Error('Error validando personal');
    }
    return await res.json(); // { id, name, role, ... }
}

async function executeAction(action, staff) {
    const { type, orderId } = action;

    // Lógica de asistencia (independiente de pedidos)
    if (type === 'ATTENDANCE_IN' || type === 'ATTENDANCE_OUT') {
        const bodyType = type === 'ATTENDANCE_IN' ? 'CHECK_IN' : 'CHECK_OUT';
        const res = await fetch(`${CONFIG.API_URL}/api/kitchen/staff/${staff.id}/shift`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: bodyType })
        });

        if (res.ok) {
            alert(`${bodyType === 'CHECK_IN' ? 'Entrada' : 'Salida'} registrada correctamente`);
        } else {
            let data = {};
            try { data = await res.json(); } catch (_) {}
            throw new Error(data.message || 'Error registrando asistencia');
        }
        return;
    }

    // Solo continuar para acciones operativas de pedidos
    if (type !== 'ASSIGN' && type !== 'SERVE') return;

    const tasks = getTasksByOrderId(orderId);
    if (tasks.length === 0) return;

    // Ejecución paralela para todos los ítems del pedido
    const promises = tasks.map(t => {
        const body = { staffId: staff.id };
        if (type === 'ASSIGN') {
            body.role = 'WAITER';
            return fetch(`${CONFIG.API_URL}/api/kitchen/kds/${t.id}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            return fetch(`${CONFIG.API_URL}/api/kitchen/kds/${t.id}/served`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
    });

    await Promise.all(promises);

    // Notificar atribución de mesero a Atención al Cliente
    try {
        const ATC_URL = window.__APP_CONFIG__?.ATC_URL?.replace(/\/$/, '') || '';
        if (ATC_URL) {
            await fetch(`${ATC_URL}/api/v1/atencion-cliente/kitchen/waiter-interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    external_order_id: orderId,
                    action: type,
                    waiter_id: staff.id,
                    worker_code: staff.workerCode
                })
            });
        }
    } catch (e) {
        console.warn('No se pudo notificar atribución a ATC:', e.message);
    }
}

// LOGIC helpers
function getTasksByOrderId(orderId) {
    return state.tasks.filter(t => t.externalOrderId === orderId);
}

function groupTasksByOrder(tasks) {
    const groups = {};
    tasks.forEach(t => {
        if(!groups[t.externalOrderId]) {
            groups[t.externalOrderId] = {
                id: t.externalOrderId,
                displayLabel: t.displayLabel,
                customerName: t.customerName,
                serviceMode: t.serviceMode,
                createdAt: t.createdAt, 
                updatedAt: t.updatedAt,
                items: [],
                waiter: null
            };
        }
        groups[t.externalOrderId].items.push(t);
        // Propagate waiter info if any item has it (assuming consistent assignment)
        if(t.assignedWaiterId && !groups[t.externalOrderId].waiter) {
            // We just have ID? The list endpoint usually expands relations?
            // Assuming t.waiter is the expanded relation object
            if(t.waiter) groups[t.externalOrderId].waiter = t.waiter;
        }
    });
    
    // Convert to array and sort by time (Ready time usually)
    return Object.values(groups).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

function render() {
    if(!ui.feed) return;
    ui.feed.innerHTML = '';
    
    // Filter
    let visibleTasks = state.tasks;
    if (state.filter === 'DINE_IN') {
        visibleTasks = visibleTasks.filter(t => t.serviceMode === 'DINE_IN');
    } else if (state.filter === 'DELIVERY') {
        visibleTasks = visibleTasks.filter(t => ['DELIVERY', 'TAKEOUT', 'PICKUP'].includes(t.serviceMode));
    }

    const groups = groupTasksByOrder(visibleTasks);

    if (groups.length === 0) {
        ui.feed.innerHTML = '<div style="padding:2rem;text-align:center;color:#64748b;font-size:1.1rem;">No hay pedidos listos en esta sección.</div>';
        return;
    }

    groups.forEach(group => {
        const hasWaiter = !!group.waiter;
        const waiterName = group.waiter ? (group.waiter.user?.name || group.waiter.name || 'Personal') : ''; 
        
        const card = document.createElement('article');
        card.className = 'dispatch-item';
        
        const timeDiff = Math.floor((new Date() - new Date(group.updatedAt || group.createdAt)) / 60000);
        const timeText = timeDiff < 1 ? 'Ahora' : `hace ${timeDiff} min`;

        const itemsHtml = group.items.map(item => {
             const notes = item.preparationNotes ? `<div style="font-size:0.85em;color:#666;margin-left:1.5em;font-style:italic;">"${item.preparationNotes}"</div>` : '';
             return `<div style="margin-bottom:0.5rem; border-bottom:1px solid #eee; padding-bottom:0.25rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span><b>${item.quantity}x</b> ${item.product?.name || 'Producto'}</span>
                </div>
                ${notes}
             </div>`;
        }).join('');

        let actionButton = '';
        if (!hasWaiter) {
            // Assign Button
            actionButton = `<button class="btn btn--secondary" onclick="window.openAuthModal('ASSIGN', '${group.id}')" style="width:100%; margin-top:1rem; border:1px solid #e2e8f0;">
                <i data-lucide="user-plus"></i> Asignarme
            </button>`;
        } else {
            // Serve Button
             actionButton = `<div style="margin-top:1rem; border:1px solid #d1fae5; background:#ecfdf5; padding:0.75rem; border-radius:6px;">
                <div style="font-size:0.85rem; color:#047857; margin-bottom:0.5rem; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="user-check" style="width:16px;"></i> 
                    <strong>${waiterName}</strong> asignado
                </div>
                <button class="btn btn--primary" onclick="window.openAuthModal('SERVE', '${group.id}')" style="width:100%; background-color: #10b981; border-color:#059669;">
                    <i data-lucide="check-circle"></i> Marcar Entregado
                </button>
             </div>`;
        }

        const customerInfo = group.customerName ? `<div style="font-size:0.9rem; color:#4b5563; margin-bottom:0.25rem;"><i data-lucide="user" style="width:14px; height:14px; vertical-align:middle;"></i> ${group.customerName}</div>` : '';

        card.innerHTML = `
            <div class="dispatch-item__header">
                <div>
                    <h2 class="dispatch-item__title">${group.displayLabel}</h2>
                    ${customerInfo}
                    <span style="font-size:0.8rem; color:#888;">${group.serviceMode}</span>
                </div>
                <span class="dispatch-item__timer">${timeText}</span>
            </div>
            <div class="dispatch-item__content">
                <span class="dispatch-item__status" style="background:#dbeafe; color:#1e40af; display:inline-block; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:600; margin-bottom:0.5rem;">Listo</span>
                <div class="dispatch-item__description" style="margin-top:0.5rem;">
                    ${itemsHtml}
                </div>
                ${actionButton}
            </div>
        `;
        
        ui.feed.appendChild(card);
    });

    if(window.lucide) window.lucide.createIcons();
}