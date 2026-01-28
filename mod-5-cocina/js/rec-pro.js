// Usar configuraciones globales de /js/api.js
const getApiBase = () => window.KITCHEN_URL + "/api/kitchen" || 'https://charlotte-cocina.onrender.com/api/kitchen';
const getInventoryUrl = () => `${getApiBase()}/inventory/items`;

let allProducts = [];
let allCategories = [];
let allInventory = [];
let currentRecipeProductId = null;
let activeCategory = 'all';
let searchTerm = '';
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready - initializing rec-pro');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    injectStyles();
    injectDashboard();
    loadCategories();
    loadProducts();
    loadInventory();
});

function getCategoryImage(categoryName) {
    const name = (categoryName || '').toLowerCase();
    let icon = '🍽️';
    let color = '#e5e7eb';

    if (name.includes('pizza')) { icon = '🍕'; color = '#fef3c7'; }
    else if (name.includes('hamburg') || name.includes('burger')) { icon = '🍔'; color = '#fee2e2'; }
    else if (name.includes('bebida') || name.includes('refres') || name.includes('jugo')) { icon = '🥤'; color = '#dbeafe'; }
    else if (name.includes('cafe') || name.includes('café')) { icon = '☕'; color = '#fff7ed'; }
    else if (name.includes('postre') || name.includes('dulce') || name.includes('torta') || name.includes('pastel')) { icon = '🍰'; color = '#fce7f3'; }
    else if (name.includes('ensalada') || name.includes('vege') || name.includes('sana')) { icon = '🥗'; color = '#dcfce7'; }
    else if (name.includes('sushi') || name.includes('pesca') || name.includes('marisco')) { icon = '🍣'; color = '#fae8ff'; }
    else if (name.includes('carne') || name.includes('parri') || name.includes('asado')) { icon = '🥩'; color = '#fecaca'; }
    else if (name.includes('pollo') || name.includes('alas') || name.includes('fry')) { icon = '🍗'; color = '#ffedd5'; }
    else if (name.includes('taco') || name.includes('mexi')) { icon = '🌮'; color = '#fef9c3'; }
    else if (name.includes('pasta') || name.includes('ital')) { icon = '🍝'; color = '#ffedd5'; }
    else if (name.includes('sopa') || name.includes('caldo')) { icon = '🥣'; color = '#e0f2fe'; }
    else if (name.includes('sandw') || name.includes('bocad')) { icon = '🥪'; color = '#f3f4f6'; }
    else if (name.includes('frita') || name.includes('papas')) { icon = '🍟'; color = '#fef3c7'; }

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="Segoe UI, Emoji, Arial" font-size="80" text-anchor="middle" dominant-baseline="middle">${icon}</text>
    </svg>`;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function injectStyles() {
    if (document.getElementById('dynamic-styles')) return;
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.innerHTML = `
        :root { --primary: #2563eb; --success: #22c55e; --danger: #ef4444; --bg-card: #ffffff; --text-main: #1f2937; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .kpi-card { background: var(--bg-card); padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-left: 5px solid var(--primary); }
        .kpi-value { font-size: 2rem; font-weight: 800; color: var(--text-main); margin: 10px 0 5px 0; }
        .kpi-label { color: #6b7280; font-size: 0.9rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Estilos para el toggle */
        .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px; }
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--success); }
        input:checked + .slider:before { transform: translateX(20px); }
        
        .card.inactive { opacity: 0.6; filter: grayscale(0.5); }
        .card.inactive .card-badge { background: #9ca3af; color: white; }
    `;
    document.head.appendChild(style);
}

function injectDashboard() {
    const dash = document.getElementById('dashboard-stats');
    if (!dash) return;
    dash.innerHTML = `
        <div class="kpi-card" style="border-left-color: #2563eb;">
            <div class="kpi-label">Total Productos</div>
            <div class="kpi-value" id="total-products">0</div>
        </div>
        <div class="kpi-card" style="border-left-color: #22c55e;">
            <div class="kpi-label">Activos en Menú</div>
            <div class="kpi-value" id="active-products">0</div>
        </div>
        <div class="kpi-card" style="border-left-color: #f59e0b;">
            <div class="kpi-label">Categorías</div>
            <div class="kpi-value" id="total-categories">0</div>
        </div>
    `;
}

function updateDashboard() {
    const activeProds = allProducts.filter(p => p.isActive !== false);
    const activeCats = allCategories.filter(c => c.isActive !== false);

    const totalProdEl = document.getElementById('total-products');
    const activeProdEl = document.getElementById('active-products');
    const totalCatEl = document.getElementById('total-categories');

    if (totalProdEl) totalProdEl.textContent = allProducts.length;
    if (activeProdEl) activeProdEl.textContent = activeProds.length;
    if (totalCatEl) totalCatEl.textContent = activeCats.length;
}

async function loadProducts() {
    try {
        const res = await fetch(`${getApiBase()}/products`, { headers: getCommonHeaders() });
        const responseData = await res.json();
        const productsList = responseData.data || responseData;

        if (Array.isArray(productsList)) {
            allProducts = productsList;
            updateDashboard();
            renderProducts();
        } else {
            if (allProducts.length === 0) allProducts = [];
        }
    } catch (e) {
        showToast('Error cargando productos', 'error');
    }
}

async function loadCategories() {
    try {
        const res = await fetch(`${getApiBase()}/categories`, { headers: getCommonHeaders() });
        const responseData = await res.json();
        const categoriesList = responseData.data || responseData;

        if (Array.isArray(categoriesList)) {
            allCategories = categoriesList;
            updateSelectors();
            updateDashboard();
            renderCategoriesList();
            renderProducts();
        }
    } catch (e) { console.error(e); }
}

async function loadInventory() {
    try {
        const res = await fetch(getInventoryUrl(), { headers: getCommonHeaders() });
        if (res.ok) {
            const data = await res.json();
            allInventory = data.data || data;
        }
    } catch (e) { console.warn('Inventario offline'); }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Mostramos todos para poder activarlos/desactivarlos, pero filtramos por búsqueda/categoría
    let filtered = allProducts;

    if (activeCategory !== 'all') {
        filtered = filtered.filter(p => p.categoryId === activeCategory);
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc;"></i>
                <h3>Nada por aquí</h3>
                <p>No se encontraron productos.</p>
            </div>`;
        return;
    }

    filtered.forEach(p => {
        const categoryName = allCategories.find(c => c.id === p.categoryId)?.name || 'General';
        const fallbackImage = getCategoryImage(categoryName);
        const imageUrl = p.imageUrl || fallbackImage;
        const isActive = p.isActive !== false;

        const card = document.createElement('div');
        card.className = `card ${isActive ? '' : 'inactive'}`;
        card.innerHTML = `
            <div class="card-badge ${isActive ? 'status-active' : 'status-inactive'}">
                ${isActive ? 'ACTIVO' : 'INACTIVO'}
            </div>
            <img 
                src="${imageUrl}" 
                alt="${p.name}" 
                class="card-img" 
                onerror="this.onerror=null; this.src='${fallbackImage}';"
            >
            <div class="card-body">
                <h3 class="card-title">${p.name}</h3>
                <p class="card-desc">${p.description || ''}</p>
                <div class="card-meta">
                    <span class="price">$${parseFloat(p.basePrice).toFixed(2)}</span>
                    <span class="category-tag">${categoryName}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn" title="Editar" onclick="openEditProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                <div class="action-btn" title="${isActive ? 'Desactivar' : 'Activar'}">
                    <label class="switch">
                        <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleProductStatus('${p.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <button class="action-btn" title="Receta" onclick="openRecipeModal('${p.id}')"><i class="fas fa-scroll"></i></button>
            </div>
             <div style="padding: 10px; border-top: 1px solid #eee;">
                 <button class="action-btn" style="width:100%" onclick="checkAvailability('${p.id}')">
                    <i class="fas fa-check-circle"></i> Verificar Stock
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterByCategory() {
    activeCategory = document.getElementById('categoryFilter').value;
    renderProducts();
}

function filterProducts() {
    searchTerm = document.getElementById('searchInput').value;
    renderProducts();
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prodId').value;

    const formData = new FormData();
    formData.append('name', document.getElementById('prodName').value);
    formData.append('basePrice', document.getElementById('prodPrice').value);
    formData.append('categoryId', document.getElementById('prodCategory').value);
    formData.append('description', document.getElementById('prodDesc').value);

    const imageFile = document.getElementById('prodImage').files[0];

    if (imageFile) {
        formData.append('image', imageFile);
    } else {
        const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
        try {
            const res = await fetch(base64Png);
            const blob = await res.blob();
            const dummyFile = new File([blob], 'default_image.png', { type: 'image/png' });
            formData.append('image', dummyFile);
        } catch (err) {
            console.error(err);
        }
    }

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${getApiBase()}/products/${id}` : `${getApiBase()}/products`;

    try {
        const headers = getCommonHeaders();
        // IMPORTANTE: Para FormData, el navegador debe establecer el Content-Type automáticamente con el boundary.
        // Si lo forzamos a application/json o cualquier otro, el backend fallará al parsear.
        if (headers['Content-Type']) delete headers['Content-Type'];

        const res = await fetch(url, {
            method: method,
            headers: headers,
            body: formData
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Guardado correctamente', 'success');
            closeModal('productModal');
            loadProducts();
        } else {
            showToast(data.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Error de conexión', 'error');
    }
}
window.saveProduct = saveProduct;

function openEditProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Editar Producto';
    document.getElementById('prodId').value = product.id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodPrice').value = product.basePrice;
    document.getElementById('prodCategory').value = product.categoryId;
    document.getElementById('prodDesc').value = product.description || '';

    document.getElementById('productModal').classList.add('active');
}
window.openEditProduct = openEditProduct;

async function saveCategory() {
    const name = document.getElementById('catNameInput').value.trim();
    if (!name) return;

    const method = editingCategoryId ? 'PATCH' : 'POST';
    const url = editingCategoryId ? `${getApiBase()}/categories/${editingCategoryId}` : `${getApiBase()}/categories`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', ...getCommonHeaders() },
            body: JSON.stringify({ name })
        });
        if (res.ok) {
            document.getElementById('catNameInput').value = '';
            editingCategoryId = null;
            document.getElementById('cancelCatEdit').style.display = 'none';
            loadCategories();
        }
    } catch (e) { showToast('Error guardando categoría', 'error'); }
}
window.saveCategory = saveCategory;

function renderCategoriesList() {
    const tbody = document.getElementById('categoryListBody');
    if (!tbody) return;

    tbody.innerHTML = allCategories.map(c => {
        const isActive = c.isActive !== false;
        return `
            <tr style="${isActive ? '' : 'opacity:0.6; background:#f9fafb'}">
                <td>${c.name} ${isActive ? '' : '<small>(Inactiva)</small>'}</td>
                <td style="text-align:right; display:flex; gap:10px; justify-content:flex-end; align-items:center">
                    <label class="switch" style="transform: scale(0.7)">
                        <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleCategoryStatus('${c.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                    <button class="action-btn" onclick="editCategory('${c.id}', '${c.name}')"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

async function toggleCategoryStatus(id, isActive) {
    try {
        const res = await fetch(`${getApiBase()}/categories/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getCommonHeaders() },
            body: JSON.stringify({ isActive })
        });
        if (res.ok) {
            const cat = allCategories.find(c => c.id === id);
            if (cat) cat.isActive = isActive;
            // No llamamos a loadCategories para evitar cerrar el modal si se refresca la UI drásticamente, 
            // pero necesitamos actualizar los selectores de la página principal.
            renderCategoriesList();
            updateSelectors();
            showToast(isActive ? 'Categoría activada' : 'Categoría desactivada', 'success');
        }
    } catch (e) { showToast('Error al cambiar estado', 'error'); }
}
window.toggleCategoryStatus = toggleCategoryStatus;

function updateSelectors() {
    const filterSelect = document.getElementById('categoryFilter');
    const formSelect = document.getElementById('prodCategory');
    const activeCategories = allCategories.filter(c => c.isActive !== false);

    if (filterSelect) {
        const currentFilter = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">Todas las Categorías</option>' +
            activeCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        filterSelect.value = currentFilter;
    }
    if (formSelect) {
        const currentVal = formSelect.value;
        formSelect.innerHTML = '<option value="">Seleccione...</option>' +
            activeCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        formSelect.value = currentVal;
    }
}

async function toggleProductStatus(id, isActive) {
    try {
        const res = await fetch(`${getApiBase()}/products/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getCommonHeaders() },
            body: JSON.stringify({ isActive })
        });
        if (res.ok) {
            const prod = allProducts.find(p => p.id === id);
            if (prod) prod.isActive = isActive;
            renderProducts();
            showToast(isActive ? 'Producto activado' : 'Producto desactivado', 'success');
        }
    } catch (error) {
        console.error(error);
        showToast('Error de conexión', 'error');
    }
}
window.toggleProductStatus = toggleProductStatus;

function editCategory(id, name) {
    editingCategoryId = id;
    document.getElementById('catNameInput').value = name;
    document.getElementById('cancelCatEdit').style.display = 'block';
}
window.editCategory = editCategory;

function resetCategoryForm() {
    editingCategoryId = null;
    document.getElementById('catNameInput').value = '';
    document.getElementById('cancelCatEdit').style.display = 'none';
}
window.resetCategoryForm = resetCategoryForm;

async function deleteCategory(id) {
    if (!confirm('¿Borrar categoría?')) return;
    try {
        await fetch(`${getApiBase()}/categories/${id}`, { method: 'DELETE', headers: getCommonHeaders() });
        loadCategories();
    } catch (e) { }
}
window.deleteCategory = deleteCategory;

async function openRecipeModal(id) {
    currentRecipeProductId = id;
    document.getElementById('recipeModal').classList.add('active');

    const select = document.getElementById('ingredientSelect');
    if (allInventory.length === 0) await loadInventory();

    select.innerHTML = '<option value="">Seleccione...</option>' +
        allInventory.map(i => `<option value="${i.id}">${i.name} (${i.unitMeasure})</option>`).join('');

    loadRecipeIngredients(id);
}
window.openRecipeModal = openRecipeModal;

async function loadRecipeIngredients(prodId) {
    const tbody = document.getElementById('recipeListBody');
    tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';

    try {
        const res = await fetch(`${getApiBase()}/products/${prodId}/recipe`, { headers: getCommonHeaders() });
        const data = await res.json();
        const recipes = data.data || data;

        tbody.innerHTML = '';
        if (Array.isArray(recipes) && recipes.length > 0) {
            recipes.forEach(r => {
                const isMandatory = (r.isMandatory === undefined || r.isMandatory === true);
                // Switch HTML
                const switchHtml = `
                    <label class="switch" style="transform: scale(0.8);">
                        <input type="checkbox" ${isMandatory ? 'checked' : ''} onchange="toggleRecipeMandatory('${r.id}', this.checked)">
                        <span class="slider round"></span>
                    </label>
                    <span style="font-size: 0.8em; margin-left: 5px; vertical-align: middle;">
                        ${isMandatory ? '(Obligatorio)' : '(Opcional)'}
                    </span>
                `;

                tbody.innerHTML += `
                    <tr>
                        <td>
                            ${r ? r.ingredientName : 'Item Inventario'}
                            <div style="margin-top: 5px;">${switchHtml}</div>
                        </td>
                        <td>${r.qty} ${r ? r.unit : ''}</td>
                        <td><button onclick="deleteRecipeItem('${r.id}')" style="color:red">X</button></td>
                    </tr>`;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">Sin ingredientes asignados</td></tr>';
        }
    } catch (e) { tbody.innerHTML = ''; }
}
window.loadRecipeIngredients = loadRecipeIngredients;

async function addIngredientToRecipe() {
    const invId = document.getElementById('ingredientSelect').value;
    const qty = document.getElementById('ingredientQty').value;
    const isMandatory = document.getElementById('ingredientMandatory').checked;

    if (!invId || !qty) return;

    try {
        await fetch(`${getApiBase()}/recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getCommonHeaders() },
            body: JSON.stringify({
                productId: currentRecipeProductId,
                inventoryItemId: invId,
                quantityRequired: Number(qty),
                isMandatory: isMandatory,
                applyOn: 'ALL'
            })
        });

        document.getElementById('ingredientQty').value = '';
        document.getElementById('ingredientMandatory').checked = true;
        loadRecipeIngredients(currentRecipeProductId);
    } catch (e) { showToast('Error agregando', 'error'); }
}
window.addIngredientToRecipe = addIngredientToRecipe;

window.toggleRecipeMandatory = async function (recipeId, isChecked) {
    try {
        const res = await fetch(`${getApiBase()}/recipes/${recipeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getCommonHeaders() },
            body: JSON.stringify({ isMandatory: isChecked })
        });
        if (res.ok) {
            showToast('Actualizado correctamente', 'success');
            loadRecipeIngredients(currentRecipeProductId); // Recargar para actualizar etiquetas si es necesario
        } else {
            showToast('Error al actualizar', 'error');
            // Revertir el toggle si falló (opcional, requeriría lógica más compleja de UI o simplemente recargar)
            loadRecipeIngredients(currentRecipeProductId);
        }
    } catch (e) {
        console.error(e);
        showToast('Error de conexión', 'error');
        loadRecipeIngredients(currentRecipeProductId);
    }
};

window.deleteRecipeItem = async function (id) {
    try {
        await fetch(`${getApiBase()}/recipes/${id}`, { method: 'DELETE', headers: getCommonHeaders() });
        loadRecipeIngredients(currentRecipeProductId);
    } catch (e) { }
};

window.checkAvailability = async function (productId) {
    try {
        showToast('Consultando almacén...', 'info');
        const res = await fetch(`${getApiBase()}/products/${productId}/availability`, { headers: getCommonHeaders() });
        const data = await res.json();

        if (res.ok) {
            alert('✅ STOCK DISPONIBLE\n¡A cocinar!');
        } else {
            const reason = data.reason || 'Faltan ingredientes';
            const missing = data.missingItems ? `\nFalta: ${data.missingItems.join(', ')}` : '';
            alert(`❌ NO DISPONIBLE\n${reason}${missing}`);
        }
    } catch (e) { showToast('Error verificando disponibilidad', 'error'); }
}

window.openCreateProductModal = function () {
    document.getElementById('productModal').classList.add('active');
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('modalTitle').textContent = 'Nuevo Producto';
}
window.openCategoryModal = function () {
    document.getElementById('categoryModal').classList.add('active');
}
window.closeModal = function (id) { document.getElementById(id).classList.remove('active'); }
window.closeCategoryModal = function () { document.getElementById('categoryModal').classList.remove('active'); }

function showToast(msg, type) {
    const t = document.getElementById('toast');
    if (t) {
        t.textContent = msg;
        t.className = `toast show ${type}`;
        setTimeout(() => t.className = t.className.replace('show', ''), 3000);
    }
}