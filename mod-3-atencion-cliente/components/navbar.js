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
    
    // 0. FUNCIÓN DE LOGOUT (Integrada aquí para no depender de otros archivos)
    window.handleLogout = async function() {
        if(!confirm("¿Estás seguro de que quieres salir?")) return;

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

        if (clientId) {
            try {
                // Nota: Esto usa el token del localStorage que AÚN existe en este punto
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
        localStorage.removeItem('access_token'); // Borramos el token visual

        const storedQrUuid = localStorage.getItem('current_qr_uuid');
        
        // Redirigir al scan con el UUID si existe
        if (storedQrUuid) {
            window.location.href = `/mod-3-atencion-cliente/pages/login/scan.html?qr_uuid=${storedQrUuid}`;
        } else {
            window.location.href = `/mod-3-atencion-cliente/pages/login/scan.html`;
        }
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
            const activeClass = "text-primary font-bold bg-primary/10 rounded-xl ring-1 ring-primary/20";
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
});