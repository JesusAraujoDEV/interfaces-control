    async function cargarShifts() {
    try {
        const staffId = localStorage.getItem('staff_id');
        if (!staffId) {
        alert('Debes hacer check-in primero para ver tu historial de turnos');
        return;
        }

        const res = await fetch(`${KITCHEN_URL}/staff/${staffId}/shifts`, {
        headers: getCommonHeaders()
        });
        if (!res.ok) {
        throw new Error(`Error ${res.status}: no se pudo obtener los turnos`);
        }

        const shifts = await res.json();
        console.log('Historial de turnos:', shifts);

        renderizarShifts(shifts);
    } catch (error) {
        console.error('Error al cargar turnos:', error);
    }
    }

    function renderizarShifts(shifts) {
    const historialList = document.querySelector('.historial-list');
    if (!historialList) {
        console.error('No existe el contenedor .historial-list en el HTML');
        return;
    }

    historialList.innerHTML = '';

    shifts.forEach(s => {
        const card = document.createElement('div');
        card.className = 'shift-card';
        card.innerHTML = `
        <p><strong>Turno:</strong> ${s.id}</p>
        <p>Entrada: ${new Date(s.checkInAt).toLocaleString()}</p>
        <p>Salida: ${s.checkOutAt ? new Date(s.checkOutAt).toLocaleString() : 'En curso'}</p>
        <p>Horas trabajadas: ${s.hoursWorked || calcularHoras(s.checkInAt, s.checkOutAt)} </p>
        `;
        historialList.appendChild(card);
    });
    }

    function calcularHoras(checkIn, checkOut) {
    if (!checkOut) return '0';
    const diffMs = new Date(checkOut) - new Date(checkIn);
    return (diffMs / (1000 * 60 * 60)).toFixed(2);
    }

    document.addEventListener('DOMContentLoaded', cargarShifts);