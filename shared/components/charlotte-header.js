/**
 * Charlotte Header Web Component
 * Componente reutilizable del header con navegación y menú móvil
 */
class CharlotteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="site-header" data-header>
        <div class="container header__row">
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
            <a href="#location">Ubicación</a>
            <a href="#contact">Contacto</a>
            <span class="nav__pill" title="Standort">Carne Smash</span>
          </nav>

          <!-- header badge removed -->

          <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-nav">
            <span class="menu-toggle__label">Menú</span>
            <span class="menu-toggle__icon" aria-hidden="true"></span>
          </button>
        </div>

        <nav id="mobile-nav" class="nav nav--mobile" data-mobile-nav hidden aria-label="Navegación móvil">
          <div class="container nav__mobile-inner">
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
