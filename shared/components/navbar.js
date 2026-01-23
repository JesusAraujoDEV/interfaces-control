// Archivo: mod-3-atencion-cliente/components/navbar.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Detectar página actual
    const path = window.location.pathname;
    let currentPage = 'home'; 

    if (path.includes('cart')) currentPage = 'cart';
    if (path.includes('support')) currentPage = 'support';

    // 2. Definir Enlaces (Ajusta 'url' según dónde tengas tus HTMLs)
    // Si tus HTML están en la raíz del módulo 3:
    const navLinks = [
        { id: 'home', name: 'Menu', url: 'menu.html', icon: 'restaurant_menu' },
        { id: 'cart', name: 'Cart', url: 'cart.html', icon: 'shopping_bag' },
        { id: 'support', name: 'Support', url: 'support.html', icon: 'support_agent' }
    ];

    // 3. Renderizar Menú Móvil
    const mobileContainer = document.getElementById('mobile-nav-container');
    if (mobileContainer) {
        mobileContainer.className = "md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-between items-center z-40 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]";
        
        mobileContainer.innerHTML = navLinks.map(link => {
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
    }
    
    // 4. Renderizar Menú Desktop (Opcional si usas el placeholder)
    const desktopContainer = document.getElementById('desktop-nav-container');
    if (desktopContainer) {
        desktopContainer.innerHTML = navLinks.map(link => {
             const isActive = currentPage === link.id;
             const activeClass = "text-primary font-bold";
             const inactiveClass = "text-gray-500 hover:text-primary font-medium transition";
             return `<a href="${link.url}" class="${isActive ? activeClass : inactiveClass} flex items-center gap-1"><span class="material-icons-outlined">${link.icon}</span> ${link.name}</a>`;
        }).join('');
    }
});