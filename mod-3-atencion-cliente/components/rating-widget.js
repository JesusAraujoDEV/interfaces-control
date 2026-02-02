// /mod-3-atencion-cliente/components/rating-widget.js

(function(){
  function updateStars(container, state){
    const starsRow = container.querySelector('[data-stars]');
    const spans = starsRow.querySelectorAll('span[data-index]');
    spans.forEach(span => {
      const i = Number(span.dataset.index);
      span.textContent = (state.hover >= i || state.value >= i) ? 'star' : 'star_outline';
    });
    const scoreLabel = container.querySelector('[data-score-label]');
    if (scoreLabel) scoreLabel.textContent = `${state.value}/5 estrellas`;
  }

  function initStars(container, state){
    const starsRow = container.querySelector('[data-stars]');
    starsRow.innerHTML = '';
    for(let i=1;i<=5;i++){
      const span = document.createElement('span');
      span.className = 'material-icons-outlined text-3xl cursor-pointer select-none';
      span.textContent = 'star_outline';
      span.dataset.index = i;
      span.addEventListener('mouseenter', () => {
        state.hover = i;
        updateStars(container, state);
      });
      span.addEventListener('mouseleave', () => {
        state.hover = 0;
        updateStars(container, state);
      });
      span.addEventListener('click', () => {
        state.value = i;
        updateStars(container, state);
      });
      starsRow.appendChild(span);
    }
    updateStars(container, state);
  }

  window.RatingWidget = {
    mount: (containerId, { onSubmit } = {}) => {
      const container = document.getElementById(containerId);
      if(!container) return;
      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-center gap-2" data-stars></div>
          <div class="text-sm text-gray-600 text-center" data-score-label>0/5 estrellas</div>
          <div id="rating-target" class="space-y-2">
            <label class="flex items-center gap-2 text-sm"><input type="radio" name="rateScope" value="ALL" checked> Calificar a todo el equipo</label>
            <label class="flex items-center gap-2 text-sm"><input type="radio" name="rateScope" value="ONE"> Elegir mesero</label>
            <select id="waiter-select" class="w-full bg-gray-100 px-3 py-2 rounded hidden"></select>
          </div>
          <textarea id="rating-comment" class="w-full bg-gray-100 px-4 py-3 rounded-xl" rows="3" placeholder="Comentario opcional"></textarea>
          <button id="rating-submit" class="w-full bg-primary text-white font-bold py-3 rounded-xl">Enviar calificación</button>
        </div>`;
      const state = { value: 0, hover: 0 };
      initStars(container, state);
      const btn = container.querySelector('#rating-submit');
      const scopeRadios = container.querySelectorAll('input[name="rateScope"]');
      const waiterSelect = container.querySelector('#waiter-select');

      // Poblar select de meseros con nombres si se dispone
      const waiterDetails = (window.__RATING_WAITER_DETAILS__ || []);
      const waiters = waiterDetails.length > 0 ? waiterDetails : (window.__RATING_WAITERS__ || []);
      const toOption = (w) => {
        if (typeof w === 'string') {
          return `<option value="${w}">${w.substring(0,8)}...</option>`;
        }
        const label = w.name || (w.id ? w.id.substring(0,8)+'...' : 'Mesero');
        const val = w.id || '';
        return `<option value="${val}">${label}</option>`;
      };
      if (Array.isArray(waiters) && waiters.length > 1) {
        waiterSelect.innerHTML = `<option value="">Selecciona un mesero...</option>` + waiters.map(toOption).join('');
      } else {
        // Si solo hay uno o ninguno, ocultar opción ONE
        const target = container.querySelector('#rating-target');
        const oneRadio = target.querySelector('input[value="ONE"]');
        if (oneRadio && oneRadio.parentElement) oneRadio.parentElement.style.display = 'none';
      }

      scopeRadios.forEach(r => {
        r.addEventListener('change', () => {
          const val = container.querySelector('input[name="rateScope"]:checked').value;
          waiterSelect.classList.toggle('hidden', val !== 'ONE');
        });
      });
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        try {
          const comment = container.querySelector('#rating-comment').value.trim();
          if(state.value === 0){
            alert('Selecciona una calificación (al menos 1 estrella).');
            btn.disabled = false; btn.textContent = 'Enviar calificación';
            return;
          }
          const scope = container.querySelector('input[name="rateScope"]:checked').value;
          const payload = { score: state.value, comment };
          if (scope === 'ALL') payload.for_all = true;
          else {
            const wid = waiterSelect.value;
            if (!wid) { alert('Selecciona un mesero.'); btn.disabled=false; btn.textContent='Enviar calificación'; return; }
            payload.waiter_id = wid;
          }
          if(onSubmit){
            await onSubmit(payload);
          }
          container.innerHTML = '<div class="text-center text-green-700 font-semibold">¡Gracias por tu calificación!</div>';
        } catch(err){
          alert(err.message || 'No se pudo enviar la calificación');
          btn.disabled = false; btn.textContent = 'Enviar calificación';
        }
      });
    }
  };
})();