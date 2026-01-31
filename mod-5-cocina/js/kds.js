let kdsState = {
    pendingAction: null // { type, taskId, nextStatus }
};

const KDS_CONFIG = {
    POLL_MS: 30000 
};

// UI REFS
const kdsUi = {
    modal: document.getElementById('kdsAuthModal'),
    form: document.getElementById('kdsAuthForm'),
    code: document.getElementById('kdsWorkerCode'),
    closeBtn: document.getElementById('closeKdsAuthModal'),
    cancelBtn: document.getElementById('cancelKdsAuthBtn')
};

async function cargarColaKDS() {
    try {
        const response = await fetch(`${KITCHEN_URL}/api/kitchen/kds/queue`, {
            headers: getCommonHeaders()
        });
        const tareas = await response.json();
        renderizarTareas(tareas);
    } catch (error) {
        console.log(error)
        console.error('Error al cargar la cola KDS:', error);
    }
}

function renderizarTareas(tareas) {
    const nuevoCol = document.querySelector('.kds-column:nth-child(1) .kds-column__list');
    const cocinandoCol = document.querySelector('.kds-column:nth-child(2) .kds-column__list');
    const listoCol = document.querySelector('.kds-column:nth-child(3) .kds-column__list');

    if (nuevoCol) nuevoCol.innerHTML = '';
    if (cocinandoCol) cocinandoCol.innerHTML = '';
    if (listoCol) listoCol.innerHTML = '';

    if (!Array.isArray(tareas)) return;

    tareas.forEach(tarea => {
        const card = document.createElement('article');
        card.className = 'order-card';
        card.setAttribute('data-id', tarea.id);
        card.setAttribute('data-created', tarea.createdAt);

        let actionsHtml = '';

        if (tarea.status === 'PENDING') {
            actionsHtml = `
                <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                    <button class="btn btn--secondary" onclick="window.kdsAuth('REJECT', '${tarea.id}')" style="flex:1; border:1px solid #ef4444; color:#ef4444;">
                         <i data-lucide="x-circle"></i> Cancelar
                    </button>
                    <button class="btn btn--primary" onclick="window.kdsAuth('START', '${tarea.id}')" style="flex:2;">
                         <i data-lucide="flame"></i> COCINAR
                    </button>
                </div>
            `;
        } else if (tarea.status === 'COOKING') {
             actionsHtml = `
                <button class="btn btn--primary btn--full" onclick="window.kdsAuth('FINISH', '${tarea.id}')" style="margin-top:1rem; background-color:#10b981; border-color:#059669;">
                    <i data-lucide="check"></i> LISTO
                </button>
            `;
        } else if (tarea.status === 'READY') {
             actionsHtml = `
                <div style="margin-top:1rem; text-align:center; padding:0.5rem; background:#f0fdf4; color:#15803d; border-radius:4px; font-weight:600;">
                    <i data-lucide="check-circle" style="width:16px; height:16px; vertical-align:middle;"></i> Esperando despacho
                </div>
            `;
        }

        // Timer HTML
        const timeDiff = Math.floor((new Date() - new Date(tarea.createdAt)) / 60000);
        
        const modoIcon = {
            'DINE_IN': '<i data-lucide="utensils"></i> Mesa',
            'DELIVERY': '<i data-lucide="truck"></i> Delivery',
            'TAKEOUT': '<i data-lucide="shopping-bag"></i> Para Llevar'
        }[tarea.serviceMode] || tarea.serviceMode;

        const customerInfo = tarea.customerName ? `<div style="font-size:0.9rem; margin-bottom:0.4rem; color:#334155; font-weight:500; display:flex; align-items:center; gap:4px;">
                <i data-lucide="user" style="width:14px; height:14px;"></i> ${tarea.customerName}
            </div>` : '';

        // GENERATE INGREDIENTS LIST
        let ingredientsHtml = '';
        if (tarea.recipeList && tarea.recipeList.length > 0) {
            const items = tarea.recipeList.map(ing => {
                if (ing.isExcluded) {
                    return `<span style="text-decoration: line-through; color: #ef4444; opacity: 0.7; margin-right: 6px; font-size: 0.85em;">${ing.name}</span>`;
                }
                // Only show significant ingredients if desired, or all. For now showing all active ingredients normally
                return `<span style="color: #475569; margin-right: 6px; font-size: 0.85em;">${ing.name}</span>`;
            }).join(' • ');
            
            ingredientsHtml = `<div style="margin-top:0.3rem; padding: 4px; background: #f8fafc; border-radius: 4px; font-size: 0.85rem; line-height: 1.4;">
                ${items}
            </div>`;
        }

        card.innerHTML = `
        <div class="order-card__header">
            <div class="order-card__meta">
                <span class="order-card__id">${tarea.displayLabel || '#' + tarea.externalOrderId}</span>
                <span class="order-card__timer js-timer">Hace ${timeDiff}m</span>
            </div>
            <span class="order-type">${modoIcon}</span>
        </div>
        ${customerInfo}
        <ul class="order-card__items">
            <li style="font-size:1.05rem;"><strong>${tarea.quantity}x</strong> ${tarea.product?.name || 'Producto'}</li>
            ${tarea.preparationNotes ? `<li style="color:#b45309; background-color:#fffbeb; padding:4px 8px; border-radius:4px; margin-top:4px; font-style:italic; border:1px solid #fcd34d;">
                <i data-lucide="clipboard-list" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i>${tarea.preparationNotes}
            </li>` : ''}
        </ul>
        ${ingredientsHtml}
        <div style="margin-top:0.5rem; font-size:0.85rem; color:#64748b; border-top:1px solid #f1f5f9; padding-top:0.5rem;">
           ${tarea.waiter ? `<i data-lucide="user-check" style="width:14px; height:14px; vertical-align:middle;"></i> Mesero: ${tarea.waiter.name}` : ''}
        </div>
        ${actionsHtml}
        `;

        // Columna solo acepta ciertos estados por lógica UI
        if (tarea.status === 'PENDING' && nuevoCol) nuevoCol.appendChild(card);
        else if (tarea.status === 'COOKING' && cocinandoCol) cocinandoCol.appendChild(card);
        else if (tarea.status === 'READY' && listoCol) listoCol.appendChild(card);
    });

    if(window.lucide) window.lucide.createIcons();
    actualizarTimers();
}

// ---------------------------
// AUTH & LOGIC
// ---------------------------

function initKdsAuth() {
    const closeModal = () => {
        if(kdsUi.modal) {
            kdsUi.modal.classList.remove('modal--active');
            setTimeout(() => kdsUi.modal.style.display = 'none', 300);
        }
        kdsState.pendingAction = null;
        if(kdsUi.form) kdsUi.form.reset();
    };

    if(kdsUi.closeBtn) kdsUi.closeBtn.addEventListener('click', closeModal);
    if(kdsUi.cancelBtn) kdsUi.cancelBtn.addEventListener('click', closeModal);

    const inputs = document.querySelectorAll('.code-input input');
    if(inputs.length > 0) {
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1) {
                    if (index < inputs.length - 1) inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
    }

    if(kdsUi.form) {
        kdsUi.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Handle split inputs if they exist, else simple input
            let code = '';
            if(inputs.length > 0) {
                inputs.forEach(i => code += i.value);
            } else if(kdsUi.code) {
                code = kdsUi.code.value.trim();
            }

            if(!code) return;

            try {
                // 1. Verify Worker
                const staff = await validateWorker(code);
                if(!staff) {
                    alert('Código inválido o inactivo');
                    // Reset inputs
                     if(inputs.length > 0) inputs.forEach(i => i.value = '');
                     else if(kdsUi.code) kdsUi.code.value = '';
                     if(inputs.length > 0) inputs[0].focus();
                    return;
                }

                // 2. Validate Role for Kitchen Actions
                const actionType = kdsState.pendingAction ? kdsState.pendingAction.type : null;
                const isKitchenAction = ['START', 'DONE', 'REJECT', 'UNDO'].includes(actionType);
                const allowedKitchenRoles = ['CHEF', 'HEAD_CHEF', 'KITCHEN_PORTER'];

                if (isKitchenAction && !allowedKitchenRoles.includes(staff.role)) {
                    alert(`⛔ ACCESO DENEGADO\n\nEl usuario ${staff.name} tiene el rol "${staff.role}".\nSolo personal de Cocina puede gestionar la producción.`);
                    return;
                }

                // 3. Validate Shift
                const isClockedIn = !!staff.currentShift;

                if (isKitchenAction) {
                     // NOTE: START/DONE usually imply work.
                     if (!isClockedIn) {
                         alert(`⚠️ ACCESO DENEGADO\n\n${staff.name} no tiene turno activo.\nFiche entrada primero.`);
                         return;
                     }
                }

                if (actionType === 'ATTENDANCE_OUT' && !isClockedIn) {
                     alert('No tiene turno activo para cerrar.');
                     return;
                }
                
                if (actionType === 'ATTENDANCE_IN' && isClockedIn) {
                     alert('Ya tiene un turno activo.');
                     return;
                }

                // 3. Execute Action
                if(kdsState.pendingAction) {
                    await executeKdsAction(kdsState.pendingAction, staff);
                }

                closeModal();
                setTimeout(cargarColaKDS, 500);

            } catch (error) {
                console.error(error);
                alert('Error: ' + error.message);
            }
        });
    }

    // Public Trigger
    window.kdsAuth = (actionType, taskId) => {
        kdsState.pendingAction = { type: actionType, taskId };
        if(kdsUi.modal) {
            kdsUi.modal.style.display = 'flex'; // Changed to flex for centering if CSS supports it
            setTimeout(() => kdsUi.modal.classList.add('modal--active'), 10);
            
            const firstInput = kdsUi.form.querySelector('input');
            if(firstInput) {
                firstInput.value = '';
                firstInput.focus();
            }
            // Update Title Context (Optional)
            const titleEl = kdsUi.modal.querySelector('.modal__header h2');
            if (titleEl) {
                if (actionType.startsWith('ATTENDANCE')) {
                    titleEl.textContent = actionType === 'ATTENDANCE_IN' ? 'Fichar Entrada' : 'Fichar Salida';
                } else {
                    titleEl.textContent = 'Identificación Cocina';
                }
            }
        }
    }
}

async function validateWorker(code) {
    const res = await fetch(`${KITCHEN_URL}/api/kitchen/staff/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerCode: code })
    });
    if(!res.ok) return null;
    return await res.json();
}

async function executeKdsAction(action, staff) {
    const { type, taskId } = action;
    const headers = { 
        'Content-Type': 'application/json',
        ...getCommonHeaders() 
    };
    
    // START -> PENDING to COOKING (Assign Chef)
    if(type === 'START') {
        // First assign chef
        await fetch(`${KITCHEN_URL}/api/kitchen/kds/${taskId}/assign`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ staffId: staff.id, role: 'CHEF' })
        });
        // Then update status
        await fetch(`${KITCHEN_URL}/api/kitchen/kds/${taskId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ newStatus: 'COOKING' })
        });
    }
    // FINISH -> COOKING to READY
    else if(type === 'FINISH') {
        const newStatus = 'READY';
        await fetch(`${KITCHEN_URL}/api/kitchen/kds/${taskId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ newStatus })
        });
    }
    // REJECT -> Cancel
    else if(type === 'REJECT') {
        await fetch(`${KITCHEN_URL}/api/kitchen/kds/${taskId}/reject`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ reason: 'Rechazado desde KDS pantalla' })
        });
    }
    // ATTENDANCE -> Check In/Out
    else if(type === 'ATTENDANCE_IN' || type === 'ATTENDANCE_OUT') {
        const bodyType = type === 'ATTENDANCE_IN' ? 'CHECK_IN' : 'CHECK_OUT';
        const res = await fetch(`${KITCHEN_URL}/api/kitchen/staff/${staff.id}/shift`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ type: bodyType })
        });
        
        if (res.ok) {
            alert(`${bodyType === 'CHECK_IN' ? 'Entrada' : 'Salida'} registrada correctamente`);
        } else {
            const data = await res.json();
            throw new Error(data.message || 'Error registrando asistencia');
        }
    }
}

// ---------------------------
// TIMERS
// ---------------------------
function actualizarTimers() {
    const cards = document.querySelectorAll('.order-card');
    const now = Date.now();

    cards.forEach(card => {
        const createdMs = new Date(card.getAttribute('data-created')).getTime();
        if(isNaN(createdMs)) return;

        const diff = now - createdMs;
        const minutes = Math.floor(diff / 60000);
        
        const timerEl = card.querySelector('.js-timer');
        if (timerEl) timerEl.textContent = `${minutes} min`;

        if (diff > 20 * 60 * 1000) {
           card.classList.add('border-red-500'); 
           card.style.border = '2px solid #ef4444';
        } else {
           card.classList.remove('border-red-500');
           card.style.border = '1px solid #e2e8f0';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initKdsAuth();
    cargarColaKDS();
    setInterval(cargarColaKDS, KDS_CONFIG.POLL_MS);
    setInterval(actualizarTimers, 60000);
});
