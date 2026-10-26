// #/admin/orders — today's orders, newest first: a status filter (All / Cooking / Ready),
// a search by table or dish that filters in place (so typing never loses focus), and a LATE
// marker on any ticket time past the promise. Long days show the first rows with Show more.

import { html, fmtClock, fmtRM, formatTime } from '../../ui.js';
import { STATE, dishById, orderTotal } from '../../state.js';
import { refresh } from '../../router.js';
import { adminPage } from './layout.js';

const PAGE = 40;
let filter = 'all';
let shown = PAGE;
let query = '';

function itemsText(order) {
  return order.lines.map((line) => `${line.qty}× ${dishById(line.dishId)?.name || line.dishId}`).join(', ');
}

function searchText(order) {
  return `t${order.table} table ${order.table} #${order.id} ${itemsText(order)}`.toLowerCase();
}

function matches(order) {
  return !query || searchText(order).includes(query);
}

function orderRow(order) {
  const ticket = order.readyAt ? (order.readyAt - order.placedAt) / 1000 : null;
  const late = ticket !== null && ticket >= STATE.settings.promiseSeconds;
  return html`
    <tr data-search="${searchText(order)}" ${matches(order) ? '' : 'hidden'}>
      <td data-label="Order" class="tabular">#${String(order.id).padStart(4, '0')}</td>
      <td data-label="Table"><b>T${order.table}</b></td>
      <td data-label="Time" class="tabular">${formatTime(order.placedAt)}</td>
      <td data-label="Items" class="orders-items">${itemsText(order)}</td>
      <td data-label="Total" class="tabular num">${fmtRM(orderTotal(order))}</td>
      <td data-label="Ticket" class="tabular num ${late ? 'is-late' : ''}">${ticket === null ? '—' : fmtClock(ticket)}${late ? html` <span class="late-tag">Late</span>` : ''}</td>
      <td data-label="Status"><span class="status ${order.readyAt ? 'status-ready' : 'status-cooking'}">${order.readyAt ? 'Ready' : 'Cooking'}</span></td>
    </tr>`;
}

export const ordersPage = adminPage({
  active: 'orders',
  title: 'Orders',
  render() {
    const all = [...STATE.orders].reverse();
    const list = all.filter((o) => (filter === 'all' ? true : filter === 'ready' ? o.readyAt : !o.readyAt));
    const counts = { all: all.length, cooking: all.filter((o) => !o.readyAt).length, ready: all.filter((o) => o.readyAt).length };
    return html`
      <section class="card">
        <div class="toolbar">
          <h2 class="sign-title">Orders today</h2>
          <div class="chips" role="group" aria-label="Filter by status">
            ${['all', 'cooking', 'ready'].map((f) => html`
              <button class="chip" aria-pressed="${filter === f ? 'true' : 'false'}" data-action="filter" data-filter="${f}">
                ${f[0].toUpperCase() + f.slice(1)} <span class="tabular">${counts[f]}</span>
              </button>`)}
          </div>
          <input class="input toolbar-search" type="search" placeholder="Search table or dish" aria-label="Search orders by table or dish"
                 value="${query}" data-input="search">
        </div>
        <div class="table-wrap">
          <table class="data-table orders-table">
            <thead><tr><th>#</th><th>Table</th><th>Time</th><th>Items</th><th class="num">Total</th><th class="num">Ticket</th><th>Status</th></tr></thead>
            <tbody>${(query ? list : list.slice(0, shown)).map(orderRow)}</tbody>
          </table>
        </div>
        <p class="muted table-empty" data-empty ${(query ? list : list.slice(0, shown)).some(matches) ? 'hidden' : ''}>No orders match.</p>
        ${!query && list.length > shown ? html`<button class="btn btn-outline btn-block" data-action="more">Show more (${list.length - shown} left)</button>` : ''}
      </section>`;
  },
  actions: {
    filter(el) {
      filter = el.dataset.filter;
      shown = PAGE;
      refresh({ force: true });
    },
    more() {
      shown += PAGE * 2;
      refresh({ force: true });
    },
  },
  inputs: {
    search(el) {
      const hadQuery = Boolean(query);
      query = el.value.trim().toLowerCase();
      // Starting or clearing a search changes which rows exist: repaint once, keep the caret.
      if (hadQuery !== Boolean(query)) {
        const caret = el.selectionStart;
        refresh({ force: true });
        const box = document.querySelector('[data-input="search"]');
        box?.focus();
        box?.setSelectionRange(caret, caret);
        return;
      }
      let any = false;
      el.closest('.card').querySelectorAll('tbody tr').forEach((row) => {
        const hit = !query || row.dataset.search.includes(query);
        row.hidden = !hit;
        any = any || hit;
      });
      el.closest('.card').querySelector('[data-empty]').hidden = any;
    },
  },
});
