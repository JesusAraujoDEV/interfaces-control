// Archivo: mod-3-atencion-cliente/components/navbar.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 0. FUNCIÓN DE LOGOUT (Integrada aquí para no depender de otros archivos)
    window.handleLogout = async function() {
        if(!confirm("Are you sure you want to exit?")) return;

        // A. Intentar obtener el ID del cliente del localStorage
        // (Asumo que cuando haces Login guardas el objeto 'client_info' o el 'id')
        const storedClient = localStorage.getItem('user_client'); // O como hayas llamado a la variable donde guardas al user
        let clientId = null;

        if (storedClient) {
            try {
                const clientData = JSON.parse(storedClient);

                if (clientData && clientData.id){
                    clientId = clientData.id;
                } else {
                    console.warn("El objeto del cliente no tiene un ID válido.");
                }
                
            } catch (e) {
                console.warn("No se pudo leer el ID del cliente localmente");
            }
        }

        // B. Si tenemos ID, avisamos al servidor que el cliente está CLOSED
        if (clientId) {
            // Mostrar un pequeño indicador de carga en el botón (opcional, pero buena UX)
            // Como es muy rápido, a veces no hace falta, pero el try/catch es vital.
            try {
                await window.ClientApi.updateClient(clientId, { status: "CLOSED" });
                console.log("Estado del cliente actualizado a CLOSED en el servidor.");
            } catch (error) {
                console.error("Error al cerrar sesión en el servidor:", error);
                // Aún si falla el servidor, procedemos a cerrar localmente para no bloquear al usuario
            }
        }

        // Limpiar carritos y sesión
        localStorage.removeItem('charlotte_cart');
        localStorage.removeItem('charlotte_active_orders');
        localStorage.removeItem('user_client');
        localStorage.removeItem('my_service_requests');
        localStorage.removeItem('restaurant_service_requests');
        localStorage.removeItem('access_token');

        const storedQrUuid = localStorage.getItem('current_qr_uuid');

        window.location.href = `/mod-3-atencion-cliente/pages/login/scan.html?qr_uuid=${storedQrUuid}`;
    };

    // 1. Detectar página actual
    const path = window.location.pathname;
    let currentPage = 'home'; 

    if (path.includes('cart')) currentPage = 'cart';
    if (path.includes('support')) currentPage = 'support';

    // 2. Definir Enlaces Principales
    const navLinks = [
        { id: 'home', name: 'Menu', url: 'menu.html', icon: 'restaurant_menu' },
        { id: 'cart', name: 'Cart', url: 'cart.html', icon: 'shopping_bag' },
        { id: 'support', name: 'Support', url: 'support.html', icon: 'support_agent' }
    ];

    // ============================================================
    // 3. RENDERIZAR MENÚ MÓVIL (Bottom Bar) + BOTÓN LOGOUT
    // ============================================================
    const mobileContainer = document.getElementById('mobile-nav-container');
    if (mobileContainer) {
        mobileContainer.className = "md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-between items-center z-40 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]";
        
        // Generamos los links normales
        const linksHtml = navLinks.map(link => {
            const isActive = currentPage === link.id;
            const activeClass = "text-primary font-bold";
            const inactiveClass = "text-gray-400 hover:text-gray-600 font-medium";
            const indicator = isActive ? `<div class="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full"></div>` : '';

            return `
                <a href="${link.url}" class="flex-1 py-3 flex flex-col items-center justify-center relative transition-colors ${isActive ? activeClass : inactiveClass}">
                    <span class="material-icons-outlined text-2xl mb-0.5">${link.icon}</span>
                    <span class="text-[10px]">${link.name}</span>
                    ${indicator}
                </a>
            `;
        }).join('');

        // Agregamos el botón de Logout al final (Como un 4to ícono rojo)
        const logoutHtml = `
            <button onclick="handleLogout()" class="flex-1 py-3 flex flex-col items-center justify-center relative transition-colors text-red-400 hover:text-red-600 font-medium">
                <span class="material-icons-outlined text-2xl mb-0.5">logout</span>
                <span class="text-[10px]">Exit</span>
            </button>
        `;

        mobileContainer.innerHTML = linksHtml + logoutHtml;
    }
    
    // ============================================================
    // 4. RENDERIZAR MENÚ DESKTOP (Top Bar) + BOTÓN LOGOUT
    // ============================================================
    const desktopContainer = document.getElementById('desktop-nav-container');
    if (desktopContainer) {
        // Generamos los links normales
        const linksHtml = navLinks.map(link => {
             const isActive = currentPage === link.id;
             const activeClass = "text-primary font-bold bg-green-50 px-3 py-2 rounded-lg";
             const inactiveClass = "text-gray-500 hover:text-primary font-medium transition px-3 py-2";
             
             return `
                <a href="${link.url}" class="${isActive ? activeClass : inactiveClass} flex items-center gap-2">
                    <span class="material-icons-outlined">${link.icon}</span> 
                    ${link.name}
                </a>`;
        }).join('');

        // Agregamos el botón de Logout al final (Estilo botón separado)
        const logoutHtml = `
            <div class="h-6 w-px bg-gray-200 mx-2"></div> <button onclick="handleLogout()" class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-100 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm">
                <span class="material-icons-outlined text-lg">logout</span>
                Exit
            </button>
        `;

        desktopContainer.innerHTML = linksHtml + logoutHtml;
    }
});