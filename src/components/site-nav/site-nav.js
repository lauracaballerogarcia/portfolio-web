/**
 * site-nav.js — Navegación principal
 * Gestiona el menú móvil con accesibilidad completa (ARIA, foco).
 */

class SiteNav extends HTMLElement {
  connectedCallback() {
    this.render();
    this._bindEvents();
  }

  render() {
    this.innerHTML = `
      <header class="site-nav" role="banner">
        <div class="container site-nav__inner">
          <a href="/" class="site-nav__logo" aria-label="Inicio — Portfolio">
            <span aria-hidden="true">◆</span> Tu nombre
          </a>

          <button
            class="site-nav__toggle"
            aria-expanded="false"
            aria-controls="nav-menu"
            aria-label="Abrir menú"
          >
            <span class="site-nav__toggle-icon" aria-hidden="true"></span>
          </button>

          <nav id="nav-menu" class="site-nav__menu" aria-label="Navegación principal">
            <ul class="site-nav__list" role="list">
              <li><a href="/"          class="site-nav__link">Trabajo</a></li>
              <li><a href="/sobre-mi"  class="site-nav__link">Sobre mí</a></li>
              <li><a href="/contacto" class="site-nav__link">Contacto</a></li>
            </ul>
          </nav>
        </div>
      </header>
    `;
  }

  _bindEvents() {
    const toggle = this.querySelector('.site-nav__toggle');
    const menu   = this.querySelector('.site-nav__menu');

    toggle?.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
      menu?.classList.toggle('is-open', !isOpen);
    });

    // Cierra el menú al hacer clic fuera
    document.addEventListener('click', e => {
      if (!this.contains(e.target)) {
        toggle?.setAttribute('aria-expanded', 'false');
        menu?.classList.remove('is-open');
      }
    });

    // Marca el enlace activo
    const currentPath = window.location.pathname;
    this.querySelectorAll('.site-nav__link').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }
}

customElements.define('site-nav', SiteNav);
