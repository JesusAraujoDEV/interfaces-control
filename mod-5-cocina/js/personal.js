async function cargarStaff() {
    try {
        const response = await fetch(`${KITCHEN_URL}/staff/active`, {
            headers: getCommonHeaders()
    });
        const data = await response.json();
        console.log('Respuesta staff:', data);

        if (Array.isArray(data)) {
            renderizarStaff(data);
        } else if (Array.isArray(data.staff)) {
            renderizarStaff(data.staff);
        } else {
        console.error('Respuesta inesperada del backend:', data);
        }
    } catch (error) {
        console.error('Error al cargar staff:', error);
    }
}

function renderizarStaff(staff = []) {
    if (!Array.isArray(staff)) {
        console.error('La respuesta no es un array:', staff);
        return;
    }

    const staffList = document.querySelector('.staff-list');
    staffList.innerHTML = '';

    staff.forEach(persona => {
        const card = document.createElement('div');
        card.className = 'staff-card';
        card.innerHTML = `
        <div class="staff-card__avatar-wrapper">
        <img src="${persona.avatarUrl}" alt="${persona.name}" class="staff-card__img">
        <span class="status-dot ${persona.online ? 'status-dot--online' : 'status-dot--offline'}"></span>
        </div>
        <div class="staff-card__info">
        <p class="staff-card__name">${persona.name}</p>
        <p class="staff-card__role">${persona.role}</p>
        </div>
        <button class="btn btn--primary" onclick="toggleShift('${persona.id}')">
        ${persona.onShift ? 'Check-out' : 'Check-in'}
        </button>
    `;
    staffList.appendChild(card);
    });
}

async function toggleShift(staffId) {
    try {
        await fetch(`${KITCHEN_URL}/staff/${staffId}/shift`, {
        method: 'POST',
        headers: getCommonHeaders()
    });
    cargarStaff();
    } catch (error) {
    console.error('Error al cambiar turno:', error);
    }
}

document.addEventListener('DOMContentLoaded', cargarStaff);