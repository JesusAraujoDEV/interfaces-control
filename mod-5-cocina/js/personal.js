/* global KITCHEN_URL, getCommonHeaders, lucide */

let LOCAL_STAFF = [];

document.addEventListener('DOMContentLoaded', () => {
    initPersonal();
    
    // Bind refresh
    document.addEventListener('refreshAttendance', () => {
        const sel = document.getElementById('staff-select');
        loadAttendance(sel ? sel.value : '');
    });
});

const EXTERNAL_USERS_URL = 'https://charlotte-seguridad.onrender.com/api/seguridad/users';

async function initPersonal() {
    await loadStaff();
    setupEventListeners();
    // Load initial attendance (All active)
    loadAttendance('');
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
        LOCAL_STAFF = staffList; // Cache
        renderStaffGrid(staffList);
        populateStaffSelect(staffList);
        
    } catch (error) {
        console.error(error);
        loading.textContent = 'Error al cargar personal. Intente nuevamente.';
    } finally {
        loading.style.display = 'none';
        grid.style.display = 'grid'; // grid display
        grid.classList.remove('hidden');
    }
}

function populateStaffSelect(list) {
    const select = document.getElementById('staff-select');
    if(!select) return;
    
    select.innerHTML = '<option value="">Todos los empleados</option>';
    
    // Sort by name
    const sorted = [...list].sort((a,b) => (a.externalName || '').localeCompare(b.externalName || ''));
    
    sorted.forEach(s => {
         const opt = document.createElement('option');
         opt.value = s.id;
         opt.textContent = `${s.externalName || 'Sin Nombre'} (${s.role})`;
         select.appendChild(opt);
    });
    
    select.onchange = (e) => loadAttendance(e.target.value);
}

async function loadAttendance(staffId) {
    const tbody = document.getElementById('attendance-table-body');
    const loading = document.getElementById('attendance-loading');
    if(!tbody || !loading) return;
    
    tbody.innerHTML = '';
    loading.style.display = 'block';

    try {
        let records = [];
        let targets = [];

        if(staffId) {
             targets = LOCAL_STAFF.filter(s => s.id === staffId);
        } else {
             // If ALL, limit to avoid spam, or parallel fetch all.
             // For MVP, fetch all is acceptable if list is small (< 50).
             targets = LOCAL_STAFF;
        }

        const promises = targets.map(async s => {
            try {
                const res = await fetch(`${KITCHEN_URL}/api/kitchen/staff/${s.id}/shifts`, {
                    headers: getCommonHeaders()
                });
                if(!res.ok) return [];
                const shifts = await res.json();
                return shifts.map(sh => ({ ...sh, staffName: s.externalName, staffRole: s.role }));
            } catch(e) {
                return [];
            }
        });

        const results = await Promise.all(promises);
        records = results.flat();

        // Filter empty or sort
        records.sort((a, b) => new Date(b.shiftStart) - new Date(a.shiftStart));
        
        renderAttendanceTable(records);

    } catch(e) {
        console.error("Attendance load error", e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-red-500">Error cargando datos de asistencia.</td></tr>';
    } finally {
        loading.style.display = 'none';
    }
}

function renderAttendanceTable(records) {
    const tbody = document.getElementById('attendance-table-body');
    if(!tbody) return;
    
    if(records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-500">No hay registros de asistencia encontrados.</td></tr>';
        return;
    }

    tbody.innerHTML = records.map(r => {
        const start = new Date(r.shiftStart);
        const end = r.shiftEnd ? new Date(r.shiftEnd) : null;
        
        const dateStr = start.toLocaleDateString() + ' ' + start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const endStr = end ? end.toLocaleDateString() + ' ' + end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '<span class="text-green-600 font-bold">Activo</span>';
        
        let duration = '-';
        if (start instanceof Date && !isNaN(start)) {
            if (end instanceof Date && !isNaN(end)) {
                const diffMs = Math.max(0, end.getTime() - start.getTime());
                const hours = Math.floor(diffMs / 3600000);
                const mins = Math.floor((diffMs % 3600000) / 60000);
                duration = `${hours}h ${mins}m`;
            } else {
                // Calc current duration
                const now = new Date();
                const diffMs = Math.max(0, now.getTime() - start.getTime());
                const hours = Math.floor(diffMs / 3600000);
                const mins = Math.floor((diffMs % 3600000) / 60000);
                duration = `<span class="text-green-600">${hours}h ${mins}m (Actual)</span>`;
            }
        }

        return `
            <tr class="table__row">
                <td><strong>${r.staffName}</strong></td>
                <td style="color: var(--text-muted);">${r.staffRole}</td>
                <td>${dateStr}</td>
                <td>${endStr}</td>
                <td>${duration}</td>
                <td>
                    <span class="badge ${!end ? 'badge--success' : ''}" style="${!end ? '' : 'background: #f1f5f9; color: #64748b;'}">
                        ${!end ? 'En Turno' : 'Finalizado'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
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