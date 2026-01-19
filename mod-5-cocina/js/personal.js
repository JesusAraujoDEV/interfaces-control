import { apiFetch } from './api.js';

function renderStaffCards(staffList) {
    const container = document.getElementById('staff-container');
    container.innerHTML = '';

    staffList.forEach(staff => {
        const card = document.createElement('div');
        card.className = 'staff-card';

        card.innerHTML = `
        <h3>${staff.name}</h3>
        <p>Rol: ${staff.role}</p>
        <p>Status: ${staff.online ? 'Online ✅' : 'Offline ❌'}</p>
        <button data-id="${staff.id}" data-online="${staff.online}">
            ${staff.online ? 'Check-out' : 'Check-in'}
        </button>
    `;

    container.appendChild(card);
    });

    document.querySelectorAll('.staff-card button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
        const staffId = e.target.dataset.id;
        const isOnline = e.target.dataset.online === 'true';
        await toggleShift(staffId, isOnline);
    });
    });
}

async function cargarStaff() {
    try {
        const staffList = await apiFetch('/kitchen/staff/active');
        renderStaffCards(staffList);
    } catch (error) {
    console.error('Error cargando staff:', error);
    }
}

async function toggleShift(staffId, isOnline) {
    try {
        const action = isOnline ? 'checkout' : 'checkin';
        const result = await apiFetch(`/kitchen/staff/${staffId}/shift`, {
        method: 'POST',
        body: JSON.stringify({ action })
    });

    alert(`Shift actualizado: ${result.message}`);
    cargarStaff();
    } catch (error) {
    console.error('Error actualizando shift:', error);
    }
}

document.addEventListener('DOMContentLoaded', cargarStaff);