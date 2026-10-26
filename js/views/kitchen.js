// #/kitchen — the kitchen display: a dark screen with the clock, the "all day" counts, station
// tabs with live counts, tickets in arrival order and the day's numbers along the bottom.
// Open to everyone (no sign-in) so a restaurant owner reaches it in one tap.

import { html, fmtClock, formatTime, toast, announce, chime } from '../ui.js';
import {
  STATE, ticketsByStation, allDayCounts, todayStats, ticketAge, ticketState, dishById, stationName,
  orderById, bump, recall, markSeen, saveSettings,
} from '../state.js';
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

const STATE_WORDS = { ok: 'OK', hurry: 'Hurry', late: 'Late' };

// Share of the promise still left, 1 at the scan down to 0 at the LATE line.
function barFraction(age) {
  return Math.max(0, Math.min(1, 1 - age / STATE.settings.promiseSeconds));
}

// The whole card is one button: tap (or Enter / Space) bumps it off the screen.
export function ticketCard(ticket, now = Date.now()) {
  const age = ticketAge(ticket, now);
  const state = ticketState(age);
  const label = `Table ${ticket.order.table}, order ${ticket.order.id}, ${stationName(ticket.station)}, ${STATE_WORDS[state]}. Tap to bump.`;
  return html`
    <article class="ticket is-${state} ${ticket.order.fresh ? 'is-new' : ''}" data-key="${ticket.key}"
             data-action="bump" data-order="${ticket.order.id}" data-station="${ticket.station}"
             role="button" tabindex="0" aria-label="${label}">
      <header class="ticket-head">
        <span class="ticket-table">T${ticket.order.table}</span>
        <span class="ticket-no tabular">#${String(ticket.order.id).padStart(4, '0')}</span>
        ${ticket.order.fresh ? html`<span class="ticket-new">New</span>` : ''}
        <span class="ticket-age tabular" data-age>${fmtClock(age)}</span>
      </header>
      <div class="ticket-meter">
        <span class="ticket-bar"><span data-bar style="width:${(barFraction(age) * 100).toFixed(1)}%"></span></span>
        <span class="ticket-word" data-word>${STATE_WORDS[state]}</span>
      </div>
      <p class="ticket-station">${stationName(ticket.station)}</p>
      <ul class="ticket-lines">
        ${ticket.lines.map((line) => html`
          <li><b class="tabular">${line.qty}×</b> ${dishById(line.dishId)?.name || line.dishId}
            ${line.note ? html`<span class="ticket-note">${line.note}</span>` : ''}</li>`)}
      </ul>
      <p class="ticket-hint">Tap to bump</p>
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

// Every second: ages, bars, and the OK / HURRY / LATE class and word as a ticket crosses a line.
export function tickTickets(root, now = Date.now()) {
  const open = new Map(ticketsByStation('all').map((t) => [t.key, t]));
  root.querySelectorAll('.ticket[data-key]').forEach((el) => {
    const ticket = open.get(el.dataset.key);
    if (!ticket) return;
    const age = ticketAge(ticket, now);
    const state = ticketState(age);
    el.querySelector('[data-age]').textContent = fmtClock(age);
    el.querySelector('[data-bar]').style.width = `${(barFraction(age) * 100).toFixed(1)}%`;
    if (!el.classList.contains(`is-${state}`)) {
      el.classList.remove('is-ok', 'is-hurry', 'is-late');
      el.classList.add(`is-${state}`);
      el.querySelector('[data-word]').textContent = STATE_WORDS[state];
    }
  });
}

// New tickets flash once: after their first paint they are no longer new. Each new order is
// announced to screen readers and, when the chime is on, rings once.
export function markShown(root) {
  const fresh = [...new Set([...root.querySelectorAll('.ticket.is-new')].map((el) => Number(el.dataset.order)))];
  fresh.forEach((id) => {
    const order = orderById(id);
    markSeen(id);
    if (!order) return;
    const items = order.lines.map((line) => `${line.qty} ${dishById(line.dishId)?.name || line.dishId}`).join(', ');
    announce(`New ticket, table ${order.table}: ${items}`);
  });
  if (fresh.length && STATE.settings.chime) chime();
}

export function kitchenControls() {
  const canRecall = STATE.bumpStack.length > 0;
  return html`
    <button class="btn btn-sm btn-kds" data-action="toggle-chime" aria-pressed="${STATE.settings.chime ? 'true' : 'false'}"
            title="Chime on new tickets">${icon(STATE.settings.chime ? 'bell' : 'bellOff', { size: 16 })} ${STATE.settings.chime ? 'Chime on' : 'Chime off'}</button>
    <button class="btn btn-sm btn-kds" data-action="recall" ${canRecall ? '' : 'disabled'}
            title="Bring back the last bumped ticket">${icon('recall', { size: 16 })} Recall</button>`;
}

export const kitchenActions = {
  station(el) {
    activeStation = el.dataset.station;
    refresh({ force: true });
  },
  bump(el) {
    bump(Number(el.dataset.order), el.dataset.station);
  },
  recall() {
    const order = recall();
    if (order) toast(`Ticket #${order.id} for table ${order.table} is back on the screen`);
  },
  'toggle-chime'() {
    const on = !STATE.settings.chime;
    saveSettings({ chime: on });
    if (on) chime();     // the click starts the audio, and the cook hears what it sounds like
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
        ${kitchenControls()}
        <a class="btn btn-sm btn-kds" href="#/">${icon('arrow', { size: 16 })} Shop</a>
      </header>
      <main class="kds-main">
        ${kitchenBoard()}
      </main>
      ${kitchenFooter()}`;
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
