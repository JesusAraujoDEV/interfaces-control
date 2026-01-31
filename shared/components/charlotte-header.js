/**
 * Charlotte Header Web Component v2.0
 * Componente reutilizable del header con navegación y menú móvil
 * IMPORTANTE: El header usa la clase 'container' para centrarse y tener ancho máximo
 */
class CharlotteHeader extends HTMLElement {
  connectedCallback() {
    // Renderizar el header con container centrado
    this.innerHTML = `
      <header class="site-header" data-header style="font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
        <div class="header__inner header__row" style="width: min(var(--container,1120px), calc(100% - 32px)); margin-inline: auto; padding-inline: 16px;">
          <a class="brand" href="/" aria-label="Charlotte Bistró">
            <img
              class="brand__logo"
              src="/assets/charlotte_logo.png"
              alt="Charlotte Bistró"
              width="64"
              height="64"
              loading="eager"
            />
            <span class="brand__text">
              <span class="brand__name">Charlotte Bistró</span>
              <span class="brand__tagline">DONDE EL SABOR TOMA LA RUTA</span>
            </span>
          </a>

          <nav class="nav nav--desktop" aria-label="Navegación principal">
            <a href="/menu">Menú</a>
            <a href="/#location">Ubicación</a>
            <a href="/#contact">Contacto</a>
            <span class="nav__pill" title="Standort">Carne Smash</span>
          </nav>

          <!-- header badge removed -->

          <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-nav">
            <span class="menu-toggle__label">Menú</span>
            <span class="menu-toggle__icon" aria-hidden="true"></span>
          </button>
        </div>

        <nav id="mobile-nav" class="nav nav--mobile" data-mobile-nav hidden aria-label="Navegación móvil">
          <div class="nav__mobile-inner header__inner" style="width: min(var(--container,1120px), calc(100% - 32px)); margin-inline: auto; padding-inline: 16px;">
            <a href="/menu" data-close-menu>Menú</a>
            <a href="#location" data-close-menu>Ubicación</a>
            <a href="#contact" data-close-menu>Contacto</a>
            <div class="nav__mobile-footer">
              <span class="nav__pill" title="Ubicación">Quinta CHARLOTTE</span>
              <img
                src="https://foodiewagon.de/graphics/aura%20logo.svg"
                alt="100% aura"
                width="48"
                height="48"
                loading="lazy"
              />
            </div>
          </div>
        </nav>
      </header>
    `;
  }
}

// Registrar el componente
customElements.define('charlotte-header', CharlotteHeader);
