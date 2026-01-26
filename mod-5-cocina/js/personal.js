/* global KITCHEN_URL, getCommonHeaders, lucide */

document.addEventListener('DOMContentLoaded', () => {
    initPersonal();
});

const EXTERNAL_USERS_URL = 'https://charlotte-seguridad.onrender.com/api/seguridad/users';

async function initPersonal() {
    await loadStaff();
    setupEventListeners();
    if (window.lucide) lucide.createIcons();
}

async function loadStaff() {
    const grid = document.getElementById('staff-grid');
    const loading = document.getElementById('staff-loading');
    
    if (!grid || !loading) return;

    try {
        loading.style.display = 'block';
        grid.style.display = 'none';
        
        const response = await fetch(`${KITCHEN_URL}/api/kitchen/staff`, {
            headers: getCommonHeaders()
        });
        
        if (!response.ok) throw new Error('Error cargando personal');
        
        const staffList = await response.json();
        renderStaffGrid(staffList);
        
    } catch (error) {
        console.error(error);
        loading.textContent = 'Error al cargar personal. Intente nuevamente.';
    } finally {
        loading.style.display = 'none';
        grid.style.display = 'grid'; // grid display
        grid.classList.remove('hidden');
    }
}

function renderStaffGrid(staffList) {
    const grid = document.getElementById('staff-grid');
    grid.innerHTML = '';
    
    if (staffList.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center text-muted">No hay personal asignado.</p>';
        return;
    }

    staffList.forEach(staff => {
        const card = document.createElement('div');
        card.className = 'staff-card-item';
        
        const roleMap = {
            'CHEF': 'Chef',
            'HEAD_CHEF': 'Jefe de Cocina',
            'WAITER': 'Mesero',
            'HEAD_WAITER': 'Jefe de Meseros'
        };

        const isActive = staff.isActive;
        const statusColor = isActive ? 'green' : 'red';
        const statusText = isActive ? 'Activo' : 'Inactivo';

        // Safe check for externalName
        const name = staff.externalName || 'Usuario Desconocido';
        const initial = name.charAt(0);
        console.log('Rendering staff:', staff.id);

        card.innerHTML = `
            <div class="staff-header">
                <div class="staff-info">
                    <h3>${name}</h3>
                    <p class="staff-role-badge">${roleMap[staff.role] || staff.role}</p>
                    <div class="staff-email">${staff.externalEmail || ''}</div>
                </div>
                <div class="staff-avatar">${initial}</div>
            </div>
            
            <div style="font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-top: auto;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; display: inline-block;"></span>
                <span>${statusText}</span>
            </div>

            <div class="staff-actions">
                <button class="staff-btn" onclick="regeneratePin('${staff.id}')" title="Generar Nuevo PIN">
                    <i data-lucide="key"></i> PIN
                </button>
                <button class="staff-btn ${isActive ? 'danger' : ''}" onclick="toggleStatus('${staff.id}', ${isActive})" title="${isActive ? 'Desactivar' : 'Activar'}">
                    <i data-lucide="${isActive ? 'user-x' : 'user-check'}"></i> ${isActive ? 'Baja' : 'Alta'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

async function loadExternalUsers() {
    const select = document.getElementById('user-select');
    select.innerHTML = '<option>Cargando...</option>';
    
    try {
        const response = await fetch(EXTERNAL_USERS_URL, {
            headers: getCommonHeaders()
        });
        const users = await response.json();
        
        select.innerHTML = '<option value="">Seleccione un usuario...</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} ${user.lastName} (${user.email})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        select.innerHTML = '<option>Error al cargar usuarios</option>';
    }
}

function setupEventListeners() {
    const addBtn = document.getElementById('add-staff-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('add-staff-modal').classList.add('active');
            loadExternalUsers();
        });
    }

    const closeAddModal = document.getElementById('close-add-modal');
    if (closeAddModal) closeAddModal.addEventListener('click', () => document.getElementById('add-staff-modal').classList.remove('active'));
    
    const cancelAddModal = document.getElementById('cancel-add-modal');
    if (cancelAddModal) cancelAddModal.addEventListener('click', () => document.getElementById('add-staff-modal').classList.remove('active'));
    
    const form = document.getElementById('add-staff-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('user-select').value;
            const role = document.getElementById('role-select').value;
            
            if (!userId || !role) return;
            
            try {
                const response = await fetch(`${KITCHEN_URL}/api/kitchen/staff`, {
                    method: 'POST',
                    headers: getCommonHeaders(),
                    body: JSON.stringify({ userId, role })
                });
                
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Error al crear personal');
                }
                
                const newStaff = await response.json();
                
                document.getElementById('add-staff-modal').classList.remove('active');
                loadStaff();
                showPinModal(newStaff.workerCode);
                
            } catch (error) {
                alert(error.message);
            }
        });
    }

    const closePinModal = document.getElementById('close-pin-modal');
    if(closePinModal) closePinModal.addEventListener('click', () => document.getElementById('pin-modal').classList.remove('active'));
}

window.regeneratePin = async (id) => {
    if (!confirm('¿Está seguro de generar un nuevo PIN?')) return;
    
    try {
        const response = await fetch(`${KITCHEN_URL}/api/kitchen/staff/${id}/regenerate-pin`, {
            method: 'PATCH',
            headers: getCommonHeaders()
        });
        
        if (!response.ok) throw new Error('Error al generar PIN');
        
        const data = await response.json();
        showPinModal(data.workerCode);
        
    } catch (error) {
        alert(error.message);
    }
};

window.toggleStatus = async (id, currentStatus) => {
    try {
        const response = await fetch(`${KITCHEN_URL}/api/kitchen/staff/${id}`, {
            method: 'PATCH',
            headers: getCommonHeaders(),
            body: JSON.stringify({ isActive: !currentStatus })
        });
        
        if (!response.ok) throw new Error('Error al actualizar estado');
        
        loadStaff();
        
    } catch (error) {
        alert(error.message);
    }
};

function showPinModal(pin) {
    const modal = document.getElementById('pin-modal');
    const display = document.getElementById('pin-display');
    if (display) display.textContent = pin;
    if (modal) modal.classList.add('active');
}