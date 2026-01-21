document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnBuscar').addEventListener('click', buscarHistorial);
});

async function buscarHistorial() {
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;

    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    try {
        const response = await fetch(`${KITCHEN_URL}/kitchen/kds/history?${params.toString()}`, {
        headers: getCommonHeaders()
    });
        const data = await response.json();
        renderTabla(data);
    } catch (error) {
        console.error('Error consultando historial:', error);
    }
}

function renderTabla(rows = []) {
    const tbody = document.getElementById('historyBody');
    tbody.innerHTML = '';

    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.displayLabel || r.externalOrderId}</td>
            <td>${r.product?.name || 'Producto'}</td>
            <td>${r.quantity ?? 1}</td>
            <td>${formatDate(r.createdAt)}</td>
            <td>${formatDate(r.servedAt)}</td>
            <td>${r.servedBy?.name || '—'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString();
}