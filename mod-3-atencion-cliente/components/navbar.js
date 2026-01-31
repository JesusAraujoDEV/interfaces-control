// Archivo: mod-3-atencion-cliente/components/navbar.js

document.addEventListener("DOMContentLoaded", () => {
    // --- Estilos para transiciones de página y variables de color de marca ---
    (function injectPageTransitionStyles(){
        if (document.getElementById('page-transition-style')) return;
        const style = document.createElement('style');
        style.id = 'page-transition-style';
        style.textContent = `
            :root {
                --brand-name-color: #0f4a22;
                --brand-tagline-base: #1F2937;
            }
            body.page-transition { transition: opacity 120ms ease; }
            .page-fade-in { opacity: 1; }
            .page-fade-out { opacity: 0.92; }
            @media (prefers-reduced-motion: reduce) {
                body.page-transition { transition: none; }
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('page-transition', 'page-fade-in');
    })();
    
    // --- Helpers Guard de Logout ---
    function evaluateLogoutGuard() {
        let orders = [];
        try {
            const saved = localStorage.getItem('charlotte_active_orders');
            orders = saved ? JSON.parse(saved) : [];
        } catch (e) { orders = []; }

        const hasOrders = orders.length > 0;
        const hasNonTerminal = orders.some(o => o && !['DELIVERED','CANCELLED'].includes(o.status));
        const hasDelivered = orders.some(o => o && o.status === 'DELIVERED');

        // Resumen por estado
        const counts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status]||0)+1; return acc; }, {});
        return { hasOrders, hasNonTerminal, hasDelivered, counts };
    }

    function ensureLogoutModalContainer() {
        let overlay = document.getElementById('logoutGuardOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'logoutGuardOverlay';
            overlay.className = 'fixed inset-0 z-50 hidden';
            overlay.innerHTML = `
                <div class="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm"></div>
                <div class="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[520px] bg-white md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
                    <div class="p-6" id="logoutGuardContent"></div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('.bg-opacity-60').addEventListener('click', closeLogoutGuardModal);
        }
        return overlay;
    }

    function openLogoutGuardModal(guard) {
        const overlay = ensureLogoutModalContainer();
        const content = overlay.querySelector('#logoutGuardContent');
        if (!content) return;

        if (guard.hasNonTerminal) {
            const p = guard.counts;
            const hasCooking = !!p.COOKING;
            if (hasCooking) {
                // Caso: hay órdenes en preparación -> solo permitir ir a ver pedido
                content.innerHTML = `
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                            <span class="material-icons-outlined text-xl text-yellow-600">warning</span>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-gray-900">Órdenes en preparación</h2>
                            <p class="text-xs text-gray-500">Tienes órdenes en cocina. No es posible cancelar ni salir hasta que se entreguen y se pague.</p>
                        </div>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                        ${p.PENDING ? `<div class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Pending: ${p.PENDING}</div>` : ''}
                        ${p.COOKING ? `<div class="px-2 py-1 bg-blue-100 text-blue-800 rounded">Cooking: ${p.COOKING}</div>` : ''}
                        ${p.DELIVERED ? `<div class="px-2 py-1 bg-green-100 text-green-800 rounded">Delivered: ${p.DELIVERED}</div>` : ''}
                    </div>
                    <div class="mt-6">
                        <button id="btn-go-orders" class="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md hover:bg-green-800 transition flex items-center justify-center gap-2">
                            <span class="material-icons-outlined text-sm">receipt_long</span> Ir a ver mi pedido
                        </button>
                    </div>`;
                content.querySelector('#btn-go-orders').onclick = () => { window.location.href = '/mod-3-atencion-cliente/pages/pedidos/cart.html'; };
            } else {
                // Caso: solo pendientes (sin cooking) -> permitir cancelar pendientes
                content.innerHTML = `
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                            <span class="material-icons-outlined text-xl text-yellow-600">warning</span>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-gray-900">Órdenes en curso</h2>
                            <p class="text-xs text-gray-500">Tienes órdenes sin finalizar. Puedes cancelar las pendientes.</p>
                        </div>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                        ${p.PENDING ? `<div class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Pending: ${p.PENDING}</div>` : ''}
                        ${p.DELIVERED ? `<div class="px-2 py-1 bg-green-100 text-green-800 rounded">Delivered: ${p.DELIVERED}</div>` : ''}
                    </div>
                    <div class="mt-6 grid grid-cols-2 gap-3">
                        <button id="btn-cancel-pending" class="w-full bg-red-50 text-red-700 font-bold py-3 rounded-xl border border-red-200 hover:bg-red-100 transition flex items-center justify-center gap-2">
                            <span class="material-icons-outlined text-sm">cancel</span> Cancelar pendientes
                        </button>
                        <button id="btn-back" class="w-full bg-white text-gray-700 font-bold py-3 rounded-xl border border-gray-200 transition flex items-center justify-center gap-2">
                            <span class="material-icons-outlined text-sm">arrow_back</span> Volver
                        </button>
                    </div>`;
                content.querySelector('#btn-cancel-pending').onclick = cancelPendingAndLogout;
                content.querySelector('#btn-back').onclick = closeLogoutGuardModal;
            }
        } else if (guard.hasDelivered) {
            content.innerHTML = `
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                        <span class="material-icons-outlined text-xl text-green-600">payments</span>
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-gray-900">Órdenes entregadas sin pago</h2>
                        <p class="text-xs text-gray-500">Debes solicitar la cuenta y pagar antes de salir.</p>
                    </div>
                </div>
                <div class="mt-6 grid grid-cols-2 gap-3">
                    <button id="btn-go-pay" class="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md hover:bg-green-800 transition flex items-center justify-center gap-2">
                        <span class="material-icons-outlined text-sm">payments</span> Ir a pagar
                    </button>
                    <button id="btn-back" class="w-full bg-white text-gray-700 font-bold py-3 rounded-xl border border-gray-200 transition flex items-center justify-center gap-2">
                        <span class="material-icons-outlined text-sm">arrow_back</span> Volver
                    </button>
                </div>`;
            content.querySelector('#btn-go-pay').onclick = () => { window.location.href = '/mod-3-atencion-cliente/pages/pedidos/cart.html'; };
            content.querySelector('#btn-back').onclick = closeLogoutGuardModal;
        } else {
            // No bloqueos: salir directo
            proceedLogout();
            return;
        }

        overlay.classList.remove('hidden');
    }

    function closeLogoutGuardModal() {
        const overlay = document.getElementById('logoutGuardOverlay');
        if (overlay) overlay.classList.add('hidden');
    }

    async function cancelPendingAndLogout() {
        // Cancelar localmente y en servidor si es posible
        let orders = [];
        try {
            const saved = localStorage.getItem('charlotte_active_orders');
            orders = saved ? JSON.parse(saved) : [];
        } catch (e) { orders = []; }

        const pendingIds = orders.filter(o => o.status === 'PENDING').map(o => o.id);
        if (pendingIds.length) {
            for (const id of pendingIds) {
                try {
                    if (window.ClientApi && window.ClientApi.cancelOrder) {
                        await window.ClientApi.cancelOrder(id);
                    }
                } catch (e) { console.warn('Error cancelando pendiente', e); }
            }
            // Actualizar local
            orders = orders.map(o => (o.status === 'PENDING' ? { ...o, status: 'CANCELLED' } : o));
            localStorage.setItem('charlotte_active_orders', JSON.stringify(orders));
        }
        // Re-evaluar guard tras cancelar
        const guard = evaluateLogoutGuard();
        if (guard.hasNonTerminal || guard.hasDelivered) {
            // Aún quedan órdenes en curso o entregadas: mantener modal y bloquear salida
            openLogoutGuardModal(guard);
        } else {
            closeLogoutGuardModal();
            proceedLogout();
        }
    }

    // 0. FUNCIÓN DE LOGOUT con guard
    window.handleLogout = async function() {
        if(!confirm("¿Estás seguro de que quieres salir?")) return;
        const guard = evaluateLogoutGuard();
        if (guard.hasNonTerminal || guard.hasDelivered) {
            openLogoutGuardModal(guard);
            return; // Bloquear flujo normal hasta resolver en modal
        }
        // Sin bloqueos
        proceedLogout();
    };

    async function proceedLogout() {
        // --- PASO 1: Obtener ID y poner status CLOSED en Render ---
        const storedClient = localStorage.getItem('user_client'); 
        let clientId = null;

        if (storedClient) {
            try {
                const clientData = JSON.parse(storedClient);
                if (clientData && clientData.id) clientId = clientData.id;
            } catch (e) {
                console.warn("No se pudo leer el ID del cliente localmente");
            }
        }

        if (clientId && window.ClientApi && window.ClientApi.updateClient) {
            try {
                await window.ClientApi.updateClient(clientId, { status: "CLOSED" });
                console.log("Estado del cliente actualizado a CLOSED.");
            } catch (error) {
                console.error("Error al actualizar estado (no bloqueante):", error);
            }
        }

        // --- PASO 2: Llamar a Vercel para borrar la Cookie HttpOnly ---
        try {
            await fetch('/api/atencion-cliente/logout', { method: 'POST' });
            console.log("Cookie de sesión eliminada.");
        } catch (e) { 
            console.error("Error contactando endpoint de logout", e); 
        }

        // --- PASO 3: Limpiar LocalStorage y Redirigir ---
        localStorage.removeItem('charlotte_cart');
        localStorage.removeItem('charlotte_active_orders');
        localStorage.removeItem('user_client');
        localStorage.removeItem('my_service_requests');
        localStorage.removeItem('restaurant_service_requests');
        localStorage.removeItem('access_token_atc');

        const storedQrUuid = localStorage.getItem('current_qr_uuid');
        if (storedQrUuid) {
            window.location.href = `/mod-3-atencion-cliente/pages/login/scan.html?qr_uuid=${storedQrUuid}`;
        } else {
            window.location.href = `/mod-3-atencion-cliente/pages/login/scan.html`;
        }
    }

    // 1. Detectar página actual
    const path = window.location.pathname;
    let currentPage = 'home'; 

    if (path.includes('cart')) currentPage = 'cart';
    if (path.includes('support')) currentPage = 'support';

    // 2. Definir Enlaces Principales
    const navLinks = [
        { id: 'home', name: 'Menu', url: 'menu.html', icon: 'restaurant_menu' },
        { id: 'cart', name: 'Carrito', url: 'cart.html', icon: 'shopping_bag' },
        { id: 'support', name: 'Soporte', url: 'support.html', icon: 'support_agent' }
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
            const activeClass = "text-primary font-bold bg-primary/10 rounded-xl ring-1 ring-primary/20";
            const inactiveClass = "text-gray-400 hover:text-gray-600 font-medium";
            const indicator = isActive ? `<div class="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full"></div>` : '';

            const badge = link.id === 'cart' 
                ? `<span id="cart-badge-mobile" class="absolute top-1 right-4 min-w-[18px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center hidden">0</span>`
                : '';

            return `
                <a href="${link.url}" class="flex-1 py-3 flex flex-col items-center justify-center relative transition-colors ${isActive ? activeClass : inactiveClass}">
                    <span class="material-icons-outlined text-2xl mb-0.5">${link.icon}</span>
                    <span class="text-[10px]">${link.name}</span>
                    ${badge}
                    ${indicator}
                </a>
            `;
        }).join('');

        // Agregamos el botón de Logout al final (Como un 4to ícono rojo)
        const logoutHtml = `
            <button onclick="handleLogout()" class="flex-1 py-3 flex flex-col items-center justify-center relative transition-colors text-red-400 hover:text-red-600 font-medium">
                <span class="material-icons-outlined text-2xl mb-0.5">logout</span>
                <span class="text-[10px]">Salir</span>
            </button>
        `;

        mobileContainer.innerHTML = linksHtml + logoutHtml;
    }
    
    // Inyectar bloque de marca si existe `brand-container`
    const brandContainer = document.getElementById('brand-container');
    // Mostrar marca en desktop en todas las vistas (brand-container está oculto en mobile via clases)
    if (brandContainer) {
        const menuLink = { id: 'home', name: 'Menu', url: 'menu.html', icon: 'restaurant_menu' };
        const menuHref = menuLink.url;
        brandContainer.innerHTML = `
            <a class="brand flex items-center gap-3 w-[280px] shrink-0" href="${menuHref}" aria-label="Charlotte Bistró">
                <img class="brand__logo w-10 h-10 md:w-16 md:h-16" src="/assets/charlotte_logo.png" alt="Charlotte Bistró" width="64" height="64" loading="eager">
                <span class="brand__text flex flex-col whitespace-nowrap">
                    <span class="brand__name text-[16px] leading-[19.2px] font-bold tracking-[1.3px] uppercase" style="font-family: 'Inter', sans-serif; color: var(--brand-name-color, #0f4a22);">Charlotte Bistró</span>
                    <span class="brand__tagline text-[11px] leading-[16.5px] tracking-[2px] font-semibold" style="color: var(--brand-tagline-base, #1F2937); opacity: 0.55;">DONDE EL SABOR TOMA LA RUTA</span>
                </span>
            </a>`;
    }

    // Mostrar marca en mobile SOLO en menú si existe el contenedor específico
    const brandContainerMobile = document.getElementById('brand-container-mobile');
    if (brandContainerMobile && currentPage === 'home') {
        const menuHref = 'menu.html';
        brandContainerMobile.innerHTML = `
            <a class="brand flex items-center gap-3" href="${menuHref}" aria-label="Charlotte Bistró">
                <img class="brand__logo w-10 h-10" src="/assets/charlotte_logo.png" alt="Charlotte Bistró" width="40" height="40" loading="eager">
                <span class="brand__text flex flex-col whitespace-nowrap">
                    <span class="brand__name text-[15px] leading-[18px] font-bold tracking-[1.1px] uppercase" style="font-family: 'Inter', sans-serif; color: var(--brand-name-color, #0f4a22);">Charlotte Bistró</span>
                    <span class="brand__tagline text-[10px] leading-[15px] tracking-[2px] font-semibold" style="color: var(--brand-tagline-base, #1F2937); opacity: 0.65;">DONDE EL SABOR TOMA LA RUTA</span>
                </span>
            </a>`;
    }

    // ============================================================
    // 4. RENDERIZAR MENÚ DESKTOP (Top Bar) + BOTÓN LOGOUT
    // ============================================================
    const desktopContainer = document.getElementById('desktop-nav-container');
    if (desktopContainer) {
        // Generamos los links normales
        const linksHtml = navLinks.map(link => {
             const isActive = currentPage === link.id;
             const activeClass = "text-white bg-primary px-3 py-2 rounded-lg shadow-sm";
             const inactiveClass = "text-gray-600 hover:text-primary font-medium transition px-3 py-2";
             
             const badge = link.id === 'cart' 
                ? `<span id="cart-badge-desktop" class="ml-1 min-w-[18px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center hidden">0</span>`
                : '';

             return `
                <a href="${link.url}" class="${isActive ? activeClass : inactiveClass} flex items-center gap-2 relative">
                    <span class="material-icons-outlined">${link.icon}</span> 
                    ${link.name}
                    ${badge}
                </a>`;
        }).join('');

        // Agregamos el botón de Logout al final (Estilo botón separado)
        const logoutHtml = `
            <div class="h-6 w-px bg-gray-200 mx-2"></div> <button onclick="handleLogout()" class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-100 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm">
                <span class="material-icons-outlined text-lg">logout</span>
                Salir
            </button>
        `;

        desktopContainer.innerHTML = linksHtml + logoutHtml;
    }

    // --- Navegación suave: interceptar clicks en enlaces del navbar ---
    function initSmoothNav(container) {
        if (!container) return;
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const canAnimate = isDesktop && !reduceMotion;
        container.querySelectorAll('a[href]')?.forEach(a => {
            a.addEventListener('click', (e) => {
                if (!canAnimate) return; // En mobile o reduce motion, no interceptar
                const url = a.getAttribute('href');
                if (!url) return;
                e.preventDefault();
                document.body.classList.remove('page-fade-in');
                document.body.classList.add('page-fade-out');
                setTimeout(() => { window.location.href = url; }, 120);
            });
        });
    }

    initSmoothNav(mobileContainer);
    initSmoothNav(document.getElementById('desktop-nav-container'));

    // =============================
    // Cart Badge - actualización
    // =============================
    function getCartCount() {
        try {
            const saved = localStorage.getItem('charlotte_cart');
            const items = saved ? JSON.parse(saved) : [];
            // Contar cantidad total (sumar quantity)
            return items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
        } catch (e) { return 0; }
    }

    function renderCartBadge() {
        const count = getCartCount();
        const mobileBadge = document.getElementById('cart-badge-mobile');
        const desktopBadge = document.getElementById('cart-badge-desktop');
        const apply = (el) => {
            if (!el) return;
            if (count > 0) {
                el.textContent = String(count > 99 ? '99+' : count);
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        };
        apply(mobileBadge);
        apply(desktopBadge);
    }

    // Exponer método público
    window.Navbar = window.Navbar || {};
    window.Navbar.updateCartBadge = renderCartBadge;
    // Render inicial
    renderCartBadge();

    // =============================
    // Heartbeat de sesión del cliente
    // =============================
    let __hbTimer = null;
    let __logoutInProgress = false;

    async function checkClientSession() {
        if (__logoutInProgress) return;
        try {
            const storedClient = localStorage.getItem('user_client');
            if (!storedClient) return;
            const client = JSON.parse(storedClient);
            const clientId = client?.id;
            if (!clientId || !window.ClientApi || !window.ClientApi.getClient) return;

            const resp = await window.ClientApi.getClient(clientId);
            // Soportar ambas formas de respuesta
            const status = (resp && resp.success && resp.data && resp.data.status)
                ? resp.data.status
                : (resp && resp.status && typeof resp.status === 'string')
                    ? resp.status
                    : null;

            if (status && status.toUpperCase() === 'CLOSED') {
                __logoutInProgress = true;
                // Cierre forzado detectado: salir sin guard/confirm
                try { await proceedLogout(); } catch (_) {}
            }
        } catch (e) {
            // Si el backend respondió 401, HttpClient ya limpia cookie y puede redirigir.
            // No duplicamos acción aquí.
        }
    }

    function startHeartbeat() {
        // Solo aplicar en vistas de pedidos
        if (!['home','cart','support'].includes(currentPage)) return;
        if (__hbTimer) return;
        __hbTimer = setInterval(() => {
            if (document.hidden) return;
            if (window.__ATCHeartbeatPause) return;
            checkClientSession();
        }, 15000);
    }

    startHeartbeat();
});