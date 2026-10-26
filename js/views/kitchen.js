// #/kitchen — the kitchen display: a dark screen with the clock, the "all day" counts, station
// tabs with live counts, tickets in arrival order and the day's numbers along the bottom.
// Open to everyone (no sign-in) so a restaurant owner reaches it in one tap.

import { html, fmtClock, formatTime } from '../ui.js';
import { STATE, ticketsByStation, allDayCounts, todayStats, ticketAge, dishById } from '../state.js';
import { stations } from '../data.js';
import { icon } from './icons.js';
import { refresh } from '../router.js';

let activeStation = 'all';

export function stationTabs() {
  const tabs = [{ id: 'all', name: 'All' }, ...stations];
  return html`
    <div class="kds-tabs" role="tablist" aria-label="Stations">
      ${tabs.map((tab) => html`
        <button class="kds-tab ${activeStation === tab.id ? 'is-active' : ''}" role="tab"
                aria-selected="${activeStation === tab.id ? 'true' : 'false'}"
                data-action="station" data-station="${tab.id}">
          ${tab.name} <span class="kds-tab-count tabular">${ticketsByStation(tab.id).length}</span>
        </button>`)}
    </div>`;
}

export function allDayStrip() {
  const counts = allDayCounts();
  return html`
    <div class="kds-allday" aria-label="All day counts">
      <span class="kds-allday-label">All day</span>
      ${counts.length
        ? counts.map((c) => html`<span class="kds-allday-item"><b class="tabular">${c.qty}</b> ${c.name}</span>`)
        : html`<span class="kds-muted">Nothing on the pass</span>`}
    </div>`;
}

export function ticketCard(ticket, now = Date.now()) {
  const age = ticketAge(ticket, now);
  return html`
    <article class="ticket" data-key="${ticket.key}">
      <header class="ticket-head">
        <span class="ticket-table">T${ticket.order.table}</span>
        <span class="ticket-no tabular">#${String(ticket.order.id).padStart(4, '0')}</span>
        <span class="ticket-age tabular" data-age>${fmtClock(age)}</span>
      </header>
      <ul class="ticket-lines">
        ${ticket.lines.map((line) => html`
          <li><b class="tabular">${line.qty}×</b> ${dishById(line.dishId)?.name || line.dishId}
            ${line.note ? html`<span class="ticket-note">${line.note}</span>` : ''}</li>`)}
      </ul>
    </article>`;
}

export function kitchenBoard({ compact = false } = {}) {
  const tickets = ticketsByStation(activeStation);
  const now = Date.now();
  return html`
    <div class="kds ${compact ? 'kds-compact' : ''}">
      ${allDayStrip()}
      ${stationTabs()}
      <div class="ticket-grid">
        ${tickets.length
          ? tickets.map((t) => ticketCard(t, now))
          : html`<p class="kds-empty">All clear. New tickets appear here the moment a table orders.</p>`}
      </div>
    </div>`;
}

export function kitchenFooter() {
  const stats = todayStats();
  return html`
    <footer class="kds-foot tabular">
      Served under ${fmtClock(STATE.settings.promiseSeconds)} today: <b>${Math.round(stats.underRate * 100)} %</b>
      · average <b>${fmtClock(stats.avgSeconds)}</b> · orders <b>${stats.orders}</b>
    </footer>`;
}

export function tickTickets(root, now = Date.now()) {
  root.querySelectorAll('.ticket[data-key]').forEach((el) => {
    const ticket = ticketsByStation('all').find((t) => t.key === el.dataset.key);
    if (!ticket) return;
    const ageEl = el.querySelector('[data-age]');
    if (ageEl) ageEl.textContent = fmtClock(ticketAge(ticket, now));
  });
}

export const kitchenActions = {
  station(el) {
    activeStation = el.dataset.station;
    refresh({ force: true });
  },
};

export const kitchenPage = {
  title: 'Kitchen',
  surface: 'dark',
  render() {
    return html`
      <header class="kds-header">
        <a class="kds-brand" href="#/">${STATE.settings.shopName} <span>· Kitchen</span></a>
        <span class="kds-clock tabular" data-clock>${formatTime(Date.now())}</span>
        <a class="btn btn-sm btn-kds" href="#/">${icon('arrow', { size: 16 })} Shop</a>
      </header>
      <main class="kds-main">
        ${kitchenBoard()}
      </main>
      ${kitchenFooter()}`;
  },
  tick(root) {
    const clock = root.querySelector('[data-clock]');
    if (clock) clock.textContent = formatTime(Date.now());
    tickTickets(root);
  },
  actions: { ...kitchenActions },
};
