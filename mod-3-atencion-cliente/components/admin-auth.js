// Archivo: mod-3-atencion-cliente/components/admin-auth.js
// Define un handler de logout común para páginas de Admin
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    // Logout robusto: previene navegación inmediata, limpia storage y cookie, luego redirige.
    window.logout = function() {
      const quiereSalir = confirm("¿Cerrar sesión de administrador?");
      if (!quiereSalir) return false; // cancelar navegación

      try {
        // Limpieza local inmediata
        localStorage.removeItem('access_token');
        localStorage.removeItem('administrative_user');

        // Solicitar cierre de sesión en servidor (incluir cookies)
        fetch('/seguridad/logout', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }).finally(() => {
          // Redirigir al login una vez enviada la solicitud
          window.location.href = '/seguridad/login';
        });
      } catch (e) {
        console.warn('Fallo logout no bloqueante:', e);
        window.location.href = '/seguridad/login';
      }

      // Impedir la navegación del enlace para que no cancele el fetch
      return false;
    };

    // Enlaces al login deben invocar logout para asegurar limpieza (por si falta onclick)
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
