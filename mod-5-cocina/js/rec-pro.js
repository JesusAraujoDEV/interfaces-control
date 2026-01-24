// Usar configuraciones globales de /js/api.js
const API_BASE = window.KITCHEN_URL || 'https://charlotte-cocina.onrender.com/api/kitchen';
const INVENTORY_URL = `${window.KITCHEN_URL}/inventory/items`;

let allProducts = [];
let allCategories = [];
let allInventory = [];
let currentRecipeProductId = null;
let activeCategory = 'all';
let searchTerm = '';
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
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
    document.getElementById('total-products').textContent = activeProds.length;
    document.getElementById('active-products').textContent = activeProds.length;
    document.getElementById('total-categories').textContent = allCategories.length;
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`, { headers: getCommonHeaders() });
        const responseData = await res.json();
        const productsList = responseData.data || responseData;

        if (Array.isArray(productsList)) {
            allProducts = productsList;
            updateDashboard();
            renderProducts();
        } else {
            if(allProducts.length === 0) allProducts = []; 
        }
    } catch (e) {
        showToast('Error cargando productos', 'error');
    }
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/categories`, { headers: getCommonHeaders() });
        const responseData = await res.json();
        const categoriesList = responseData.data || responseData;

        if (Array.isArray(categoriesList)) {
            allCategories = categoriesList;
            
            const filterSelect = document.getElementById('categoryFilter');
            const formSelect = document.getElementById('prodCategory');
            
            if(filterSelect) {
                filterSelect.innerHTML = '<option value="all">Todas las Categorías</option>' + 
                    allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            }
            if(formSelect) {
                formSelect.innerHTML = '<option value="">Seleccione...</option>' + 
                    allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            }
            updateDashboard();
            renderCategoriesList();
            renderProducts(); 
        }
    } catch (e) { console.error(e); }
}

async function loadInventory() {
    try {
        const res = await fetch(INVENTORY_URL, { headers: getCommonHeaders() });
        if(res.ok) {
            const data = await res.json();
            allInventory = data.data || data;
        }
    } catch (e) { console.warn('Inventario offline'); }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    let filtered = allProducts.filter(p => p.isActive === true);
    
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
                <p>No hay productos visibles en esta categoría.</p>
            </div>`;
        return;
    }

    filtered.forEach(p => {
        const categoryName = allCategories.find(c => c.id === p.categoryId)?.name || 'General';
        const fallbackImage = getCategoryImage(categoryName);
        const imageUrl = p.imageUrl || fallbackImage;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-badge status-active">ACTIVO</div>
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
                <button class="action-btn" onclick="openEditProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn btn-delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                <button class="action-btn" onclick="openRecipeModal('${p.id}')"><i class="fas fa-scroll"></i></button>
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
    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: getCommonHeaders(),
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
    } catch (error) { showToast('Error de conexión', 'error'); }
}

async function deleteProduct(id) {
    if(!confirm('¿Estás seguro de ELIMINAR este producto?')) return;
    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: getCommonHeaders()
        });
        if(res.ok) {
            showToast('Producto eliminado', 'success');
            allProducts = allProducts.filter(p => p.id !== id);
            renderProducts();
            updateDashboard();
            loadProducts();
        } else {
            showToast('No se pudo eliminar', 'error');
        }
    } catch (e) { showToast('Error de conexión', 'error'); }
}

function openEditProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Editar Producto';
    document.getElementById('prodId').value = product.id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodPrice').value = product.basePrice;
    document.getElementById('prodCategory').value = product.categoryId;
    document.getElementById('prodDesc').value = product.description || '';
    
    document.getElementById('productModal').style.display = 'block';
}

async function saveCategory() {
    const name = document.getElementById('catNameInput').value.trim();
    if(!name) return;

    const method = editingCategoryId ? 'PATCH' : 'POST';
    const url = editingCategoryId ? `${API_BASE}/categories/${editingCategoryId}` : `${API_BASE}/categories`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', ...getCommonHeaders() },
            body: JSON.stringify({ name })
        });
        if(res.ok) {
            document.getElementById('catNameInput').value = '';
            editingCategoryId = null;
            document.getElementById('cancelCatEdit').style.display = 'none';
            loadCategories();
        }
    } catch(e) { showToast('Error guardando categoría', 'error'); }
}

function renderCategoriesList() {
    const tbody = document.getElementById('categoryListBody');
    if(!tbody) return;
    
    tbody.innerHTML = allCategories.map(c => `
        <tr>
            <td>${c.name}</td>
            <td style="text-align:right">
                <button onclick="editCategory('${c.id}', '${c.name}')"><i class="fas fa-edit"></i></button>
                <button onclick="deleteCategory('${c.id}')" style="color:red"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function editCategory(id, name) {
    editingCategoryId = id;
    document.getElementById('catNameInput').value = name;
    document.getElementById('cancelCatEdit').style.display = 'block';
}

function resetCategoryForm() {
    editingCategoryId = null;
    document.getElementById('catNameInput').value = '';
    document.getElementById('cancelCatEdit').style.display = 'none';
}

async function deleteCategory(id) {
    if(!confirm('¿Borrar categoría?')) return;
    try {
        await fetch(`${API_BASE}/categories/${id}`, { method:'DELETE', headers: getCommonHeaders() });
        loadCategories();
    } catch(e) {}
}

async function openRecipeModal(id) {
    currentRecipeProductId = id;
    document.getElementById('recipeModal').style.display = 'block';
    
    const select = document.getElementById('ingredientSelect');
    if(allInventory.length === 0) await loadInventory();
    
    select.innerHTML = '<option value="">Seleccione...</option>' + 
        allInventory.map(i => `<option value="${i.id}">${i.name} (${i.unit})</option>`).join('');

    loadRecipeIngredients(id);
}

async function loadRecipeIngredients(prodId) {
    const tbody = document.getElementById('recipeListBody');
    tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/recipes?productId=${prodId}`, { headers: getCommonHeaders() });
        const data = await res.json();
        const recipes = data.data || data; 

        tbody.innerHTML = '';
        if(Array.isArray(recipes) && recipes.length > 0) {
            recipes.forEach(r => {
                const item = allInventory.find(i => i.id === r.inventoryItemId);
                tbody.innerHTML += `
                    <tr>
                        <td>${item ? item.name : 'Item Inventario'}</td>
                        <td>${r.quantityRequired} ${item ? item.unit : ''}</td>
                        <td><button onclick="deleteRecipeItem('${r.id}')" style="color:red">X</button></td>
                    </tr>`;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">Sin ingredientes asignados</td></tr>';
        }
    } catch(e) { tbody.innerHTML = ''; }
}

async function addIngredientToRecipe() {
    const invId = document.getElementById('ingredientSelect').value;
    const qty = document.getElementById('ingredientQty').value;
    if(!invId || !qty) return;

    try {
        await fetch(`${API_BASE}/recipes`, {
            method: 'POST',
            headers: {'Content-Type':'application/json', ...getCommonHeaders()},
            body: JSON.stringify({
                productId: currentRecipeProductId,
                inventoryItemId: invId,
                quantityRequired: Number(qty),
                applyOn: 'ALL'
            })
        });
        loadRecipeIngredients(currentRecipeProductId);
    } catch(e) { showToast('Error agregando', 'error'); }
}

window.deleteRecipeItem = async function(id) {
    try {
        await fetch(`${API_BASE}/recipes/${id}`, { method:'DELETE', headers: getCommonHeaders() });
        loadRecipeIngredients(currentRecipeProductId);
    } catch(e) {}
};

window.checkAvailability = async function(productId) {
    try {
        showToast('Consultando almacén...', 'info');
        const res = await fetch(`${API_BASE}/products/${productId}/availability`, { headers: getCommonHeaders() });
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

window.openCreateProductModal = function() {
    document.getElementById('productModal').style.display = 'block';
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('modalTitle').textContent = 'Nuevo Producto';
}
window.openCategoryModal = function() {
    document.getElementById('categoryModal').style.display = 'block';
}
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; }
window.closeCategoryModal = function() { document.getElementById('categoryModal').style.display = 'none'; }

function showToast(msg, type) {
    const t = document.getElementById('toast');
    if(t) {
        t.textContent = msg;
        t.className = `toast show ${type}`;
        setTimeout(() => t.className = t.className.replace('show',''), 3000);
    }
}