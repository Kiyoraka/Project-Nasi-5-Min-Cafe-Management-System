// #/admin/tables — the floor's tables: each card shows its QR (opening that table's menu), what
// is cooking for it, a link to its menu and Remove (refused inline while it has an open order).
// Add table numbers the next one; Print QR sheet prints the codes on A4 without the admin chrome.

import { html, toast } from '../../ui.js';
import { STATE, addTable, removeTable, openOrdersForTable } from '../../state.js';
import { refresh } from '../../router.js';
import { icon } from '../icons.js';
import { adminPage } from './layout.js';

const PRINTED_QR = 12;     // assets/qr holds codes for tables 1-12
let refusal = null;        // { id, open } when a remove was refused

function tableCard(table) {
  const open = openOrdersForTable(table.id);
  return html`
    <article class="table-card ${open ? 'is-busy' : ''}">
      <header class="table-card-head">
        <span class="table-card-name">${table.name}</span>
        <span class="status ${open ? 'status-cooking' : 'status-ready'}">${open ? `${open} open` : 'Free'}</span>
      </header>
      ${table.id <= PRINTED_QR
        ? html`<img class="table-qr" src="assets/qr/table-${table.id}.svg" width="140" height="140" loading="lazy" alt="QR code for table ${table.id}">`
        : html`<span class="table-qr table-qr-missing">QR printed when the shop goes live</span>`}
      <p class="table-print-label">Scan to order · ${STATE.settings.shopName} · Table ${table.id}</p>
      ${refusal?.id === table.id ? html`<p class="refusal" role="alert">${table.name} has ${refusal.open} open ${refusal.open === 1 ? 'order' : 'orders'} — clear ${refusal.open === 1 ? 'it' : 'them'} first.</p>` : ''}
      <footer class="table-card-foot">
        <a class="btn btn-ghost btn-sm" href="#/table/${table.id}">Open menu</a>
        <button class="btn btn-ghost btn-sm btn-danger" data-action="remove-table" data-id="${table.id}">Remove</button>
      </footer>
    </article>`;
}

export const tablesPage = adminPage({
  active: 'tables',
  title: 'Tables',
  render() {
    return html`
      <section class="card">
        <div class="toolbar">
          <h2 class="sign-title">Tables <span class="muted tabular">${STATE.tables.length}</span></h2>
          <button class="btn btn-outline" data-action="print-qr">${icon('tables', { size: 18 })} Print QR sheet</button>
          <button class="btn btn-primary" data-action="add-table">${icon('plus', { size: 18 })} Add table</button>
        </div>
        <div class="table-grid">${STATE.tables.map(tableCard)}</div>
        <p class="muted admin-note">Each code opens that table's menu, so the kitchen knows where to bring the plate.</p>
      </section>`;
  },
  actions: {
    'add-table'() {
      const id = addTable();
      refusal = null;
      toast(`Table ${id} added`);
    },
    'remove-table'(el) {
      const id = Number(el.dataset.id);
      const result = removeTable(id);
      refusal = result.ok ? null : { id, open: result.open };
      if (result.ok) toast(`Table ${id} removed`);
      refresh({ force: true });
    },
    'print-qr'() {
      window.print();
    },
  },
});
