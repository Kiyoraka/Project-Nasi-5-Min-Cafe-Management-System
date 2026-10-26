// #/order/:id — the guest's order after Place order: a three-step tracker, the READY IN
// countdown with a draining bar (ticked every second without a repaint), which station has
// finished, and "Ready! Served in m:ss" once the kitchen bumps the last ticket.

import { html, fmtClock, fmtRM } from '../ui.js';
import { orderById, orderStatus, dishById, stationName, orderTotal } from '../state.js';
import { publicHeader, publicFooter } from './public.js';
import { icon } from './icons.js';

function step(label, done, current) {
  return html`
    <li class="track-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}" aria-current="${current ? 'step' : 'false'}">
      <span class="track-dot">${done ? icon('check', { size: 16 }) : ''}</span>
      <span class="track-label">${label}</span>
    </li>`;
}

function countdownText(status) {
  if (status.remaining >= 0) return fmtClock(status.remaining);
  return `+${fmtClock(-status.remaining)}`;
}

function minuteAnnouncement(status) {
  const minutes = Math.ceil(Math.max(0, status.remaining) / 60);
  return status.remaining > 0 ? `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to go` : 'Any moment now';
}

export const orderPage = {
  title: 'Your order',
  guard: (params) => (orderById(params.id) ? null : '/'),
  render(params) {
    const status = orderStatus(params.id);
    const { order } = status;
    const ready = status.state === 'ready';
    const fraction = Math.max(0, Math.min(1, status.remaining / status.promise));
    return html`
      ${publicHeader({ strip: `Order #${order.id} · Table ${order.table}`, back: { href: `#/table/${order.table}`, label: 'Menu' } })}
      <main class="container order-main">
        <ol class="tracker" aria-label="Order progress">
          ${step('Reached the kitchen', true, status.state === 'received')}
          ${step('Cooking', ready, status.state === 'cooking')}
          ${step('Ready', ready, ready)}
        </ol>

        ${ready ? html`
          <section class="ready-card">
            <span class="ready-icon">${icon('check', { size: 40 })}</span>
            <h1 class="display">Ready!</h1>
            <p class="ready-line">Served in <strong class="tabular">${fmtClock(status.servedSeconds)}</strong>${status.servedSeconds <= status.promise ? ' — inside the five-minute promise.' : '.'}</p>
            <p class="muted">Collect at the counter, or wait at Table ${order.table} and we bring it over.</p>
          </section>` : html`
          <section class="countdown-card ${status.remaining < 0 ? 'is-over' : ''}" data-countdown>
            <p class="eyebrow">${status.remaining < 0 ? 'Almost there' : 'Ready in'}</p>
            <p class="countdown tabular" data-left>${countdownText(status)}</p>
            <div class="promise-bar" role="presentation"><span data-bar style="width:${(fraction * 100).toFixed(1)}%"></span></div>
            <p class="sr-only" aria-live="polite" data-announce>${minuteAnnouncement(status)}</p>
            <ul class="station-progress">
              ${order.tickets.map((ticket) => html`
                <li class="${ticket.bumpedAt ? 'is-done' : ''}">
                  ${ticket.bumpedAt ? icon('check', { size: 16 }) : icon('clock', { size: 16 })}
                  ${stationName(ticket.station)} ${ticket.bumpedAt ? 'done' : 'cooking'}
                </li>`)}
            </ul>
          </section>`}

        <section class="card order-lines">
          <h2 class="sign-title">Your plates</h2>
          <ul>
            ${order.lines.map((line) => html`
              <li><span><b>${line.qty}×</b> ${dishById(line.dishId)?.name || line.dishId}${line.note ? html` <span class="muted">· ${line.note}</span>` : ''}</span></li>`)}
          </ul>
          <div class="cart-total"><span>Total, pay at the counter</span><strong class="tabular">${fmtRM(orderTotal(order))}</strong></div>
        </section>

        <a class="btn btn-outline btn-block" href="#/table/${order.table}">${icon('plus')} Order more</a>
      </main>
      ${publicFooter()}`;
  },
  tick(root, params) {
    const status = orderStatus(params.id);
    if (!status || status.state === 'ready') return;
    const left = root.querySelector('[data-left]');
    const bar = root.querySelector('[data-bar]');
    const card = root.querySelector('[data-countdown]');
    const announce = root.querySelector('[data-announce]');
    if (left) left.textContent = countdownText(status);
    if (bar) bar.style.width = `${(Math.max(0, Math.min(1, status.remaining / status.promise)) * 100).toFixed(1)}%`;
    if (card) card.classList.toggle('is-over', status.remaining < 0);
    const text = minuteAnnouncement(status);
    if (announce && announce.textContent !== text) announce.textContent = text;
  },
};
