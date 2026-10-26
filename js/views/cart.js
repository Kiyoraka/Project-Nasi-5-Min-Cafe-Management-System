// The cart bottom sheet over the menu: quantities, note chips and a free note per line, the
// total, "pay at the counter" and Place order. While the sheet is open the router skips
// background re-renders, so the sheet's own changes repaint with refresh({ force: true }).

import { html, fmtRM, toast } from '../ui.js';
import { STATE, dishById, cartTotal, setQty, setNote, toggleNotePreset, placeOrder, lineTotal } from '../state.js';
import { refresh, navigate } from '../router.js';
import { icon } from './icons.js';

let open = false;

const FOOD_NOTES = ['no sambal', 'extra sambal', 'extra telur', 'less rice', 'bungkus'];
const DRINK_NOTES = ['kurang manis', 'no ice', 'bungkus'];

export function isCartOpen() {
  return open && STATE.cart.lines.length > 0;
}

function noteChips(line, index) {
  const presets = dishById(line.dishId)?.category === 'drinks' ? DRINK_NOTES : FOOD_NOTES;
  const chosen = line.note.split(',').map((part) => part.trim());
  return presets.map((preset) => html`
    <button class="chip chip-sm" aria-pressed="${chosen.includes(preset) ? 'true' : 'false'}"
            data-action="note-preset" data-index="${index}" data-preset="${preset}">${preset}</button>`);
}

function cartLine(line, index) {
  const dish = dishById(line.dishId);
  if (!dish) return '';
  return html`
    <li class="cart-line">
      <div class="cart-line-head">
        <strong>${dish.name}</strong>
        <span class="tabular">${fmtRM(lineTotal(line))}</span>
      </div>
      <div class="chips">${noteChips(line, index)}</div>
      <input class="input input-sm" type="text" maxlength="80" placeholder="Other note for the kitchen"
             value="${line.note}" data-input="note" data-index="${index}" aria-label="Note for ${dish.name}">
      <div class="stepper" role="group" aria-label="Quantity of ${dish.name}">
        <button class="btn btn-ghost btn-sm" data-action="qty" data-index="${index}" data-delta="-1" aria-label="One less">${icon(line.qty === 1 ? 'close' : 'minus', { size: 16 })}</button>
        <span class="tabular" aria-live="polite">${line.qty}</span>
        <button class="btn btn-ghost btn-sm" data-action="qty" data-index="${index}" data-delta="1" aria-label="One more">${icon('plus', { size: 16 })}</button>
      </div>
    </li>`;
}

export function cartSheet() {
  return html`
    <div class="sheet-backdrop" data-action="close-cart">
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div class="modal-head">
          <h2 id="cart-title" class="sign-title cart-title">Your order · Table ${STATE.cart.table}</h2>
          <button class="btn btn-ghost btn-sm" data-action="close-cart" aria-label="Close">${icon('close')}</button>
        </div>
        <ul class="cart-lines">${STATE.cart.lines.map(cartLine)}</ul>
        <div class="cart-foot">
          <div class="cart-total"><span>Total</span><strong class="tabular">${fmtRM(cartTotal())}</strong></div>
          <p class="muted">Pay at the counter when you collect. Your plate is promised within five minutes.</p>
          <button class="btn btn-primary btn-block" data-action="place-order">Place order</button>
        </div>
      </section>
    </div>`;
}

export const cartSheetHandlers = {
  actions: {
    'open-cart'() {
      open = true;
      refresh({ force: true });
      document.querySelector('.sheet [data-action="place-order"]')?.focus();
    },
    'close-cart'(el, event) {
      // The backdrop closes only on a click outside the sheet itself.
      if (el.classList.contains('sheet-backdrop') && event.target !== el) return;
      open = false;
      refresh({ force: true });
    },
    qty(el) {
      const line = STATE.cart.lines[Number(el.dataset.index)];
      if (line) setQty(Number(el.dataset.index), line.qty + Number(el.dataset.delta));
      if (STATE.cart.lines.length === 0) open = false;
      refresh({ force: true });
    },
    'note-preset'(el) {
      toggleNotePreset(Number(el.dataset.index), el.dataset.preset);
      refresh({ force: true });
    },
    'place-order'() {
      const order = placeOrder();
      open = false;
      if (!order) { refresh({ force: true }); return; }
      toast(`Order #${order.id} sent to the kitchen`);
      navigate(`/order/${order.id}`);
    },
  },
  inputs: {
    note(el) {
      setNote(Number(el.dataset.index), el.value);
    },
  },
};
