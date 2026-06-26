/**
 * site-footer.js
 */

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer" role="contentinfo">
        <div class="container site-footer__inner">
          <div>
            <p class="site-footer__copy">
              Copyright® ${year}
            </p>
            <p> | </p>
            <p><a href="mailto:lauracaballer19@gmail.com">lauracaballer19@gmail.com</a></p>

            <p class="site-footer__note">
                Alojado en
                <a href="https://pages.cloudflare.com" rel="noopener noreferrer" target="_blank">Cloudflare Pages</a>
                — green hosting
              </p>
          </div>
          
          <nav class="site-footer__nav" role="navigation" aria-label="Footer">
            <ul class="site-footer__links" role="list">
              <li><a href="https://linkedin.com/in/tu-perfil" rel="noopener noreferrer" target="_blank">LinkedIn</a></li>
              <li><a href="https://linkedin.com/in/tu-perfil" rel="noopener noreferrer" target="_blank">Behance</a></li>
              <li><a href="https://linkedin.com/in/tu-perfil" rel="noopener noreferrer" target="_blank">GitHub</a></li>
            </ul>
            <a class="site-footer__up" href="#top">Up</a>
          </nav>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);
