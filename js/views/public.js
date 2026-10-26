// Shared pieces of the customer-facing pages: the signboard header and the footer.

import { html } from '../ui.js';
import { STATE } from '../state.js';

// Navigation lives in the bottom dock; the signboard keeps the shop name and the staff door.
export function publicHeader({ strip = '' } = {}) {
  return html`
    <header class="site-head">
     <div class="signboard">
      <div class="signboard-inner container">
        <a class="signboard-name" href="#/">${STATE.settings.shopName}</a>
        <a class="public-staff" href="#/login">Staff sign in</a>
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
