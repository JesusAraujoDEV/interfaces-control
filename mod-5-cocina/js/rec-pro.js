const API_BASE = 'http://localhost:3000/api/kitchen';

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    loadInventory();
});

let allProducts = [];
let allCategories = [];
let allInventory = [];
let currentRecipeProductId = null;

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (data.success) {
            allCategories = data.data;
            renderCategorySelect();
        }
    } catch (error) {
        console.error(error);
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`, { headers: getAuthHeaders() });
        const result = await response.json();
        if (result.success) {
            allProducts = result.data;
            renderProducts(allProducts);
        }
    } catch (error) {
        console.error(error);
    }
}

async function loadInventory() {
    try {
        const response = await fetch(`${API_BASE}/inventory/items`, { headers: getAuthHeaders() });
        const result = await response.json();
        if (result.success) {
            allInventory = result.data;
            renderIngredientSelect();
        }
    } catch (error) {
        console.error(error);
    }
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

    products.forEach(prod => {
        const tr = document.createElement('tr');
        
        const cost = calculateProductCost(prod._id);
        const categoryName = prod.category ? prod.category.name : 'Sin Categoría';

        tr.innerHTML = `
            <td>${prod.name}</td>
            <td>${categoryName}</td>
            <td>$${prod.price.toFixed(2)}</td>
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
        alert('Complete todos los campos básicos');
        return;
    }

    const localData = getLocalRecipes();
    const ingredients = localData[currentRecipeProductId] || [];

    const productPayload = {
        name,
        price,
        category,
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

        alert('Producto guardado correctamente');
        closeModal();
        loadProducts();

    } catch (error) {
        alert('Error al guardar: ' + error.message);
        console.error(error);
    }
}

window.addIngredient = function() {
    const select = document.getElementById('ingredientSelect');
    const quantity = parseFloat(document.getElementById('ingQuantity').value);
    
    if (!select.value || !quantity) {
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