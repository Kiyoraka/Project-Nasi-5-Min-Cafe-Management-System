// #/live — order on the phone, watch the kitchen. The phone frame is the real Table 4 page in a
// frame (same site, so the order travels through the same channel as any second tab), and the
// kitchen board beside it is the real one. Desktop only: under 1024 px it opens the kitchen.

import { html, formatTime } from '../ui.js';
import { STATE } from '../state.js';
import { kitchenBoard, kitchenControls, kitchenFooter, kitchenActions, tickTickets, markShown } from './kitchen.js';
import { icon } from './icons.js';

const WIDE = '(min-width: 1024px)';

function kitchenSide() {
  return html`
    <div class="live-kitchen-bar">
      <span class="kds-brand">Kitchen</span>
      <span class="kds-clock tabular" data-clock>${formatTime(Date.now())}</span>
      ${kitchenControls()}
    </div>
    ${kitchenBoard({ compact: true })}`;
}

export const livePage = {
  title: 'See it live',
  surface: 'dark',
  guard: () => (window.matchMedia(WIDE).matches ? null : '/kitchen'),
  render() {
    return html`
      <header class="signboard live-head">
        <div class="signboard-inner live-head-inner">
          <a class="signboard-name" href="#/">${STATE.settings.shopName}</a>
          <p class="live-title">See it live <span>Order on the phone, watch the ticket land in the kitchen</span></p>
          <a class="btn btn-sm btn-outline-light" href="#/">${icon('arrow', { size: 16 })} Shop</a>
        </div>
      </header>
      <main class="live">
        <section class="live-phone" aria-label="Guest phone at Table 4">
          <div class="phone-frame">
            <span class="phone-notch" aria-hidden="true"></span>
            <iframe class="phone-screen" src="./#/table/4" title="Table 4 menu on a guest's phone" loading="eager"></iframe>
          </div>
          <p class="live-hint">${icon('scan', { size: 16 })} Add a dish and place the order.</p>
        </section>
        <section class="live-kitchen" aria-label="Kitchen screen" data-live-kitchen>${kitchenSide()}</section>
      </main>
      <div data-live-foot>${kitchenFooter()}</div>`;
  },
  // State changes repaint only the kitchen side, so the phone frame never reloads.
  update(root) {
    const side = root.querySelector('[data-live-kitchen]');
    const foot = root.querySelector('[data-live-foot]');
    if (side) side.innerHTML = kitchenSide().toString();
    if (foot) foot.innerHTML = kitchenFooter().toString();
    markShown(root);
  },
  mounted(root) {
    markShown(root);
  },
  tick(root) {
    const clock = root.querySelector('[data-clock]');
    if (clock) clock.textContent = formatTime(Date.now());
    tickTickets(root);
  },
  actions: { ...kitchenActions },
};
