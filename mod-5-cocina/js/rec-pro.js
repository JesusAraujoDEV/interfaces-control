const API_BASE = 'http://localhost:3000/api/kitchen';

let allProducts = [];
let allCategories = [];
let allInventory = [];
let currentRecipeProductId = null;
let activeCategory = 'all';
let searchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    injectDashboard();
    injectControls(); 
    loadCategories();
    loadProducts();
    loadInventory();
});

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        #toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; }
        .toast { min-width: 250px; margin-bottom: 10px; padding: 15px; border-radius: 4px; color: white; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideIn 0.3s ease-out forwards, fadeOut 0.5s ease-in 2.5s forwards; opacity: 0; }
        .toast.success { background-color: #28a745; border-left: 5px solid #1e7e34; }
        .toast.error { background-color: #dc3545; border-left: 5px solid #bd2130; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        
        .controls-toolbar { margin-bottom: 20px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; }
        .search-box { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; }
        .filter-btn { padding: 6px 12px; border: 1px solid #ced4da; background: white; border-radius: 20px; cursor: pointer; transition: all 0.2s; font-size: 0.9em; }
        .filter-btn:hover { background: #e2e6ea; }
        .filter-btn.active { background: #007bff; color: white; border-color: #0056b3; }
        .filters-container { display: flex; gap: 8px; flex-wrap: wrap; }

        .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid #007bff; }
        .stat-card h3 { margin: 0; font-size: 2em; color: #333; }
        .stat-card p { margin: 5px 0 0; color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .stat-card.green { border-left-color: #28a745; }
        .stat-card.orange { border-left-color: #fd7e14; }
        .stat-card.purple { border-left-color: #6f42c1; }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
}

function injectDashboard() {
    const tableContainer = document.querySelector('.table-responsive') || document.querySelector('table').parentNode;
    
    const dashboard = document.createElement('div');
    dashboard.className = 'stats-container';
    dashboard.innerHTML = `
        <div class="stat-card">
            <h3 id="stat-products">0</h3>
            <p>Total Platos</p>
        </div>
        <div class="stat-card green">
            <h3 id="stat-categories">0</h3>
            <p>Categorías</p>
        </div>
        <div class="stat-card orange">
            <h3 id="stat-avg-price">$0.00</h3>
            <p>Precio Promedio</p>
        </div>
        <div class="stat-card purple">
            <h3 id="stat-inventory">0</h3>
            <p>Items en Despensa</p>
        </div>
    `;

    tableContainer.parentNode.insertBefore(dashboard, tableContainer);
}

function updateDashboard() {
    document.getElementById('stat-products').textContent = allProducts.length;
    document.getElementById('stat-categories').textContent = allCategories.length;
    document.getElementById('stat-inventory').textContent = allInventory.length;

    if (allProducts.length > 0) {
        const total = allProducts.reduce((sum, p) => sum + (p.price || p.basePrice || 0), 0);
        const avg = total / allProducts.length;
        document.getElementById('stat-avg-price').textContent = `$${avg.toFixed(2)}`;
    }
}

function injectControls() {
    const tableContainer = document.querySelector('.table-responsive') || document.querySelector('table').parentNode;
    
    const toolbar = document.createElement('div');
    toolbar.className = 'controls-toolbar';
    toolbar.innerHTML = `
        <input type="text" id="searchInput" class="search-box" placeholder="🔍 Buscar producto...">
        <div id="categoryFilters" class="filters-container"></div>
    `;

    tableContainer.parentNode.insertBefore(toolbar, tableContainer);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        applyFilters();
    });
}

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (data.success) {
            allCategories = data.data;
            renderCategoryFilters();
            renderCategorySelect();
            updateDashboard();
        }
    } catch (error) {
        console.error(error);
        showToast('Error cargando categorías', 'error');
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`, { headers: getAuthHeaders() });
        const result = await response.json();
        if (result.success) {
            allProducts = result.data;
            applyFilters(); 
            updateDashboard();
        }
    } catch (error) {
        console.error(error);
        showToast('Error cargando productos', 'error');
    }
}

async function loadInventory() {
    try {
        const response = await fetch(`${API_BASE}/inventory/items`, { headers: getAuthHeaders() });
        const result = await response.json();
        if (result.success) {
            allInventory = result.data;
            renderIngredientSelect();
            updateDashboard();
        }
    } catch (error) {
        console.error(error);
    }
}

function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    container.innerHTML = `<button class="filter-btn active" onclick="setFilter('all', this)">Todos</button>`;
    
    allCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = cat.name;
        btn.onclick = () => setFilter(cat._id, btn);
        container.appendChild(btn);
    });
}

window.setFilter = function(catId, btnElement) {
    activeCategory = catId;
    
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    
    applyFilters();
}

function applyFilters() {
    let filtered = allProducts;

    if (activeCategory !== 'all') {
        filtered = filtered.filter(p => p.category && p.category._id === activeCategory);
    }

    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    renderProducts(filtered);
}

function renderCategorySelect() {
    const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione una categoría</option>';
    allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat._id; 
        opt.textContent = cat.name;
        select.appendChild(opt);
    });
}

function renderIngredientSelect() {
    const select = document.getElementById('ingredientSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar ingrediente...</option>';
    allInventory.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item._id;
        
        const nombre = item.nombre || item.name || 'Ingrediente';
        const costo = item.costoUnitario || item.unitCost || 0;
        const unidad = item.unidadMedida || item.unit || 'ud';
        
        opt.textContent = `${nombre} ($${costo}/${unidad})`;
        opt.dataset.cost = costo;
        opt.dataset.unit = unidad;
        select.appendChild(opt);
    });
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No se encontraron productos</td></tr>';
        return;
    }

    products.forEach(prod => {
        const tr = document.createElement('tr');
        
        const cost = calculateProductCost(prod._id);
        const categoryName = prod.category ? prod.category.name : 'Sin Categoría';
        const priceVal = prod.price || prod.basePrice || 0;

        tr.innerHTML = `
            <td>${prod.name}</td>
            <td>${categoryName}</td>
            <td id="price-cell-${prod._id}" 
                ondblclick="enablePriceEdit('${prod._id}', ${priceVal})" 
                style="cursor: pointer;" 
                title="Doble click para editar">
                $${parseFloat(priceVal).toFixed(2)}
            </td>
            <td>$${cost.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="editProduct('${prod._id}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${prod._id}')">X</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateProductCost(productId) {
    const localData = getLocalRecipes();
    const ingredients = localData[productId] || [];
    return ingredients.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
}

function getLocalRecipes() {
    return JSON.parse(localStorage.getItem('temp_recipes')) || {};
}

function saveLocalRecipes(data) {
    localStorage.setItem('temp_recipes', JSON.stringify(data));
}

window.openModal = function() {
    currentRecipeProductId = 'new_' + Date.now();
    document.getElementById('recipeModal').style.display = 'block';
    
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('recipeList').innerHTML = '';
    document.getElementById('totalCost').textContent = '0.00';
    document.getElementById('ingQuantity').value = ''; 
    
    const localData = getLocalRecipes();
    localData[currentRecipeProductId] = [];
    saveLocalRecipes(localData);
}

window.closeModal = function() {
    document.getElementById('recipeModal').style.display = 'none';
    currentRecipeProductId = null;
}

window.editProduct = function(id) {
    const prod = allProducts.find(p => p._id === id);
    if (!prod) return;

    currentRecipeProductId = id;
    document.getElementById('recipeModal').style.display = 'block';
    document.getElementById('productName').value = prod.name;
    document.getElementById('productPrice').value = prod.price;
    document.getElementById('productCategory').value = prod.category ? prod.category._id : '';

    loadRecipeIngredients();
}

async function loadRecipeIngredients() {
    const list = document.getElementById('recipeList');
    list.innerHTML = '';
    let total = 0;

    const localData = getLocalRecipes();
    let ingredients = [];

    if (localData[currentRecipeProductId]) {
        ingredients = localData[currentRecipeProductId];
    } else if (!currentRecipeProductId.startsWith('new_')) {
        try {
            const res = await fetch(`${API_BASE}/recipes/product/${currentRecipeProductId}`, {
                headers: getAuthHeaders()
            });
            const json = await res.json();
            if (json.success && json.data) {
                ingredients = json.data.ingredients.map(i => ({
                    id: i._id,
                    inventoryItem: i.inventoryItem._id,
                    name: i.inventoryItem.nombre || i.inventoryItem.name,
                    quantity: i.quantity,
                    unitCost: i.inventoryItem.costoUnitario || i.inventoryItem.unitCost,
                    unit: i.inventoryItem.unidadMedida || i.inventoryItem.unit
                }));
                localData[currentRecipeProductId] = ingredients;
                saveLocalRecipes(localData);
            }
        } catch (e) {
            console.error(e);
        }
    }

    ingredients.forEach(ing => {
        addIngredientToDOM(ing);
        total += (ing.quantity * ing.unitCost);
    });

    document.getElementById('totalCost').textContent = total.toFixed(2);
}

function addIngredientToDOM(ing) {
    const list = document.getElementById('recipeList');
    const li = document.createElement('li');
    li.id = `ing-${ing.id || ing.inventoryItem}`;
    li.innerHTML = `
        <span>${ing.name} (${ing.quantity} ${ing.unit})</span>
        <span>$${(ing.quantity * ing.unitCost).toFixed(2)}</span>
        <button onclick="removeIngredient('${ing.id || ing.inventoryItem}')" style="color:red; margin-left:10px;">&times;</button>
    `;
    list.appendChild(li);
}

window.saveProduct = async function() {
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;

    if (!name || !price || !category) {
        showToast('Complete todos los campos básicos', 'error');
        return;
    }

    const localData = getLocalRecipes();
    const ingredients = localData[currentRecipeProductId] || [];

    const productPayload = {
        name,
        basePrice: price, 
        categoryId: category,
        description: 'Creado desde Kitchen OS'
    };

    try {
        let savedProduct;
        
        if (currentRecipeProductId.startsWith('new_')) {
            const res = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(productPayload)
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            savedProduct = json.data;
        } else {
            const res = await fetch(`${API_BASE}/products/${currentRecipeProductId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(productPayload)
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            savedProduct = json.data;
        }

        if (ingredients.length > 0) {
            const recipePayload = {
                product: savedProduct._id,
                ingredients: ingredients.map(i => ({
                    inventoryItem: i.inventoryItem,
                    quantity: i.quantity
                }))
            };

            await fetch(`${API_BASE}/recipes`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(recipePayload)
            });
        }

        showToast('Producto guardado correctamente', 'success');
        closeModal();
        loadProducts();

    } catch (error) {
        showToast('Error al guardar: ' + error.message, 'error');
        console.error(error);
    }
}

window.addIngredient = function() {
    const select = document.getElementById('ingredientSelect');
    const quantity = parseFloat(document.getElementById('ingQuantity').value);
    
    if (!select.value || !quantity) {
        showToast('Seleccione ingrediente y cantidad', 'error');
        return;
    }

    const option = select.options[select.selectedIndex];
    
    const fakeItem = {
        id: 'local-' + Date.now(),
        inventoryItem: select.value,
        name: option.text.split(' ($')[0],
        quantity: quantity,
        unitCost: parseFloat(option.dataset.cost),
        unit: option.dataset.unit
    };

    const localData = getLocalRecipes();
    if (!localData[currentRecipeProductId]) {
        localData[currentRecipeProductId] = [];
    }
    localData[currentRecipeProductId].push(fakeItem);
    saveLocalRecipes(localData);

    addIngredientToDOM(fakeItem);
    
    let currentIngredients = localData[currentRecipeProductId];
    calculateTotalCost(currentIngredients);

    document.getElementById('ingQuantity').value = ''; 
}

function calculateTotalCost(ingredients) {
    const total = ingredients.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    document.getElementById('totalCost').textContent = total.toFixed(2);
}

window.removeIngredient = async function(id) {
    const localData = getLocalRecipes();
    if (localData[currentRecipeProductId]) {
        localData[currentRecipeProductId] = localData[currentRecipeProductId].filter(i => (i.id !== id && i.inventoryItem !== id));
        saveLocalRecipes(localData);
    }

    const element = document.getElementById(`ing-${id}`);
    if(element) element.remove();
    
    if (localData[currentRecipeProductId]) {
        calculateTotalCost(localData[currentRecipeProductId]);
    }
}

window.onclick = function(event) {
    const rModal = document.getElementById('recipeModal');
    if (event.target == rModal) {
        closeModal();
    }
}

window.enablePriceEdit = function(id, currentPrice) {
    const cell = document.getElementById(`price-cell-${id}`);
    if (!cell || cell.querySelector('input')) return;

    cell.innerHTML = `
        <input type="number" 
               id="input-price-${id}" 
               value="${currentPrice}" 
               style="width: 80px;"
               onblur="saveQuickPrice('${id}', this.value, ${currentPrice})"
               onkeydown="if(event.key === 'Enter') this.blur()">
    `;
    setTimeout(() => document.getElementById(`input-price-${id}`).focus(), 50);
}

window.saveQuickPrice = async function(id, newPrice, oldPrice) {
    const val = parseFloat(newPrice);
    if (isNaN(val) || val === oldPrice) {
        document.getElementById(`price-cell-${id}`).innerHTML = `$${parseFloat(oldPrice).toFixed(2)}`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ basePrice: val })
        });
        
        if (res.ok) {
            showToast('Precio actualizado', 'success');
            loadProducts();
        } else {
            showToast('Error al actualizar precio', 'error');
            loadProducts(); 
        }
    } catch (e) {
        console.error(e);
        showToast('Error de conexión', 'error');
    }
}