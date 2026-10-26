// Shared pieces of the customer-facing pages: the signboard header and the footer.

import { html } from '../ui.js';
import { STATE } from '../state.js';

export function publicHeader({ strip = '', back = null } = {}) {
  return html`
    <header class="site-head">
     <div class="signboard">
      <div class="signboard-inner container">
        <a class="signboard-name" href="#/">${STATE.settings.shopName}</a>
        <nav class="public-nav" aria-label="Main">
          ${back ? html`<a href="${back.href}">${back.label}</a>` : html`
            <a href="#/table/4">Menu</a>
            <a href="#/kitchen">Kitchen</a>
            <a href="#/today">Today</a>`}
        </nav>
      </div>
     </div>
     ${strip ? html`<div class="strip">${strip}</div>` : ''}
    </header>`;
}

export function publicFooter() {
  return html`
    <footer class="public-footer">
      <div class="container footer-inner">
        <p>${STATE.settings.shopName} is a fictional rice shop made for this demo. Every order, dish and table lives only in this browser tab; a refresh starts a fresh service.</p>
        <a class="btn btn-ghost btn-sm" href="#/login">Staff sign in</a>
      </div>
    </footer>`;
}
