document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnCargar').addEventListener('click', cargarShifts);
});

async function cargarShifts() {
    const staffId = document.getElementById('staffId').value || localStorage.getItem('staff_id');
    if (!staffId) {
        alert('Debes indicar un ID de staff');
        return;
    }

    try {
        const response = await fetch(`${KITCHEN_URL}/staff/${staffId}/shifts`, {
            headers: getCommonHeaders()
    });
        const shifts = await response.json();
        renderShifts(shifts);
    } catch (error) {
        console.error('Error cargando shifts:', error);
    }
}

function renderShifts(shifts = []) {
    const tbody = document.getElementById('shiftsBody');
    tbody.innerHTML = '';

    shifts.forEach(s => {
        const start = new Date(s.start);
        const end = s.end ? new Date(s.end) : null;
        const hours = end ? ((end - start) / 3600000) : 0;

        const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${formatDate(start)}</td>
        <td>${end ? formatDate(end) : '—'}</td>
        <td>${hours.toFixed(2)}</td>
    `;
        tbody.appendChild(tr);
    });
}

function formatDate(d) {
    return new Date(d).toLocaleString();
}