/**
 * site-footer.js
 */

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer" role="contentinfo">
        <div class="container site-footer__inner">
          <p class="site-footer__copy">
            © ${year} Tu nombre — Diseño de producto digital
          </p>
          <ul class="site-footer__links" role="list">
            <li><a href="mailto:hola@tudominio.com">Contacto</a></li>
            <li><a href="https://linkedin.com/in/tu-perfil" rel="noopener noreferrer" target="_blank">LinkedIn</a></li>
          </ul>
          <p class="site-footer__note">
            Alojado en
            <a href="https://pages.cloudflare.com" rel="noopener noreferrer" target="_blank">Cloudflare Pages</a>
            — green hosting
          </p>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);
