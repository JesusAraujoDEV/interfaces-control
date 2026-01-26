// Archivo: mod-3-atencion-cliente/components/toast.js
(function(){
  const TOAST_CONTAINER_ID = 'toast-container';
  const TYPES = {
    info: { bg: 'bg-gray-800', text: 'text-white', icon: 'info' },
    success: { bg: 'bg-green-600', text: 'text-white', icon: 'check_circle' },
    error: { bg: 'bg-red-600', text: 'text-white', icon: 'error_outline' },
    warning: { bg: 'bg-orange-600', text: 'text-white', icon: 'warning' }
  };

  function ensureContainer(){
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = TOAST_CONTAINER_ID;
      container.className = 'fixed top-4 right-4 z-[1000] flex flex-col gap-2';
      document.body.appendChild(container);
    }
    return container;
  }

  function createToast(message, type='info'){
    const cfg = TYPES[type] || TYPES.info;
    const toast = document.createElement('div');
    toast.className = `${cfg.bg} ${cfg.text} shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm transform transition-all duration-300 translate-y-[-10px] opacity-0`;
    toast.innerHTML = `
      <span class="material-icons-outlined">${cfg.icon}</span>
      <div class="text-sm">${message}</div>
      <button aria-label="Cerrar" class="ml-auto opacity-80 hover:opacity-100">
        <span class="material-icons-outlined text-sm">close</span>
      </button>
    `;
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => removeToast(toast));
    return toast;
  }

  function showToast(message, type='info', duration=3000){
    const container = ensureContainer();
    const toast = createToast(message, type);
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-[-10px]', 'opacity-0');
      toast.classList.add('translate-y-[0]', 'opacity-100');
    });
    const timer = setTimeout(() => removeToast(toast), duration);
    toast._timer = timer;
  }

  function removeToast(toast){
    if (!toast) return;
    clearTimeout(toast._timer);
    toast.classList.remove('translate-y-[0]', 'opacity-100');
    toast.classList.add('translate-y-[-10px]', 'opacity-0');
    setTimeout(() => { toast.remove(); }, 200);
  }

  window.showToast = showToast;
})();
