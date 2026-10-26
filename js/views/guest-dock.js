// The guest's bottom navigation dock: Home · Menu · Order · Kitchen · Today. Same dock as the
// admin (styles in base.css), light on guest pages and dark on the kitchen and live screens.
// Order points at this tab's latest order: greyed out before the first one, a red dot while it
// cooks (its title says the time left), a green check once it is ready.

import { html, fmtClock } from '../ui.js';
import { STATE, orderStatus } from '../state.js';
import { icon } from './icons.js';

function latestOrder() {
  const id = STATE.myOrders.at(-1);
  return id ? orderStatus(id) : null;
}

function orderTitle(status) {
  if (!status) return 'No order yet';
  if (status.state === 'ready') return `Order #${status.order.id} is ready`;
  return status.remaining >= 0
    ? `Order #${status.order.id}, ready in ${fmtClock(status.remaining)}`
    : `Order #${status.order.id}, almost there`;
}

function item({ id, href, label, iconName, active, extra = '', title = '', disabled = false }) {
  const inner = html`
    <span class="dock-icon">${icon(iconName, { size: 22 })}${extra}</span>
    <span class="dock-label">${label}</span>`;
  if (disabled) {
    return html`<span class="dock-item is-disabled" aria-disabled="true" title="${title}">${inner}</span>`;
  }
  return html`
    <a class="dock-item ${active === id ? 'is-active' : ''}" href="${href}" title="${title}"
       aria-current="${active === id ? 'page' : 'false'}">${inner}</a>`;
}

export function guestDock({ active = '', dark = false } = {}) {
  const status = latestOrder();
  const orderExtra = !status ? ''
    : status.state === 'ready' ? html`<span class="dock-check" aria-hidden="true">${icon('check', { size: 10 })}</span>`
    : html`<span class="dock-dot" aria-hidden="true"></span>`;
  return html`
    <nav class="dock ${dark ? 'dock-dark' : ''}" aria-label="Main">
      ${item({ id: 'home', href: '#/', label: 'Home', iconName: 'plate', active })}
      ${item({ id: 'menu', href: `#/table/${STATE.cart.table || 4}`, label: 'Menu', iconName: 'menu', active })}
      ${item({
        id: 'order', href: status ? `#/order/${status.order.id}` : '', label: 'Order', iconName: 'clock', active,
        extra: orderExtra, title: orderTitle(status), disabled: !status,
      })}
      ${item({ id: 'kitchen', href: '#/kitchen', label: 'Kitchen', iconName: 'kitchen', active })}
      ${item({ id: 'today', href: '#/today', label: 'Today', iconName: 'chart', active })}
    </nav>`;
}

// Every second: keep the Order item's title (its tooltip and spoken name) in step with the countdown.
export function tickGuestDock(root) {
  const el = root.querySelector('.dock a.dock-item[href^="#/order/"]');
  if (el) el.title = orderTitle(latestOrder());
}
