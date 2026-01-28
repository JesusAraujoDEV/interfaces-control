// Archivo: mod-5-cocina/js/admin-auth.js
// Handler de cierre de sesión para todas las vistas del módulo Cocina
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    window.logout = function() {
      const quiereSalir = confirm("¿Cerrar sesión de administrador?");
      if (!quiereSalir) return false;
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('administrative_user');
        fetch('/seguridad/logout', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }).finally(() => {
          window.location.href = '/seguridad/login';
        });
      } catch (e) {
        console.warn('Fallo logout no bloqueante:', e);
        window.location.href = '/seguridad/login';
      }
      return false;
    };

    // Bind automático para enlaces al login
    document.querySelectorAll('a[href="/seguridad/login"]').forEach((a) => {
      if (a.dataset.logoutBound === '1') return;
      a.dataset.logoutBound = '1';
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        window.logout();
      });
    });
  });
})();