    async function cargarStaff() {
    try {
        const response = await fetch(`${KITCHEN_URL}/staff/active`, {
        headers: getCommonHeaders()
        });
        const data = await response.json();
        const staffList = Array.isArray(data) ? data : data.staff || [];
        renderizarStaff(staffList);
    } catch (error) {
        console.error('Error al cargar staff:', error);
    }
}

function renderizarStaff(staff) {
    const staffList = document.querySelector('.staff-list');
    staffList.innerHTML = '';

    staff.forEach(persona => {
        const card = document.createElement('div');
        card.className = 'staff-card';
        card.innerHTML = `
        <div class="staff-card__avatar-wrapper">
            <img src="${persona.avatarUrl || 'avatar.jpg'}" alt="${persona.name}" class="staff-card__img">
            <span class="status-dot ${persona.onShift ? 'status-dot--online' : 'status-dot--offline'}"></span>
        </div>
        <div class="staff-card__info">
            <p class="staff-card__name">${persona.name}</p>
            <p class="staff-card__role">${persona.role}</p>
        </div>
        <div class="staff-card__actions">
            <button class="btn btn--success" onclick="checkIn('${persona.id}')">Check-in</button>
            <button class="btn btn--danger" onclick="checkOut('${persona.id}')">Check-out</button>
        </div>
        `;
        staffList.appendChild(card);
    });
    }

    async function checkIn(staffId) {
    try {
        const res = await fetch(`${KITCHEN_URL}/staff/${staffId}/shift`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ type: "CHECK_IN" })
        });
        const data = await res.json();
        if (res.ok) {
        localStorage.setItem('staff_id', staffId);
        } else {
        alert(data.message || 'Error en check-in');
        }
        cargarStaff();
    } catch (error) {
        console.error('Error en check-in:', error);
    }
    }

    async function checkOut(staffId) {
    try {
        const res = await fetch(`${KITCHEN_URL}/staff/${staffId}/shift`, {
        method: 'POST',
        headers: getCommonHeaders(),
        body: JSON.stringify({ type: "CHECK_OUT" })
        });
        const data = await res.json();
        if (res.ok) {
        localStorage.removeItem('staff_id');
        } else {
        alert(data.message || 'Error en check-out');
        }
        cargarStaff();
    } catch (error) {
        console.error('Error en check-out:', error);
    }
    }

    document.addEventListener('DOMContentLoaded', cargarStaff);
    window.checkIn = checkIn;
    window.checkOut = checkOut;