// #/table/:n — the menu a guest opens from the table QR: category chips, dish cards with
// + ADD, sold-out dishes greyed as "Habis", and a sticky cart bar.

import { html, fmtRM, fmtClock, toast } from '../ui.js';
import { STATE, setCartTable, addToCart, cartCount, cartTotal, orderStatus } from '../state.js';
import { categories } from '../data.js';
import { publicHeader } from './public.js';
import { icon } from './icons.js';
import { cartSheet, cartSheetHandlers, isCartOpen } from './cart.js';

function tableExists(n) {
  return STATE.tables.some((table) => table.id === Number(n));
}

export function dishPhoto(dish, size = 96) {
  if (dish.image) {
    return html`<img class="dish-photo" src="${dish.image}" width="${size}" height="${size}" loading="lazy" alt="${dish.name}">`;
  }
  // No photo yet: a small enamel tile with the dish's initials.
  const initials = dish.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 3).toUpperCase();
  return html`<span class="dish-photo dish-tile" style="width:${size}px;height:${size}px" aria-hidden="true">${initials}</span>`;
}

function qtyInCart(dishId) {
  return STATE.cart.lines.filter((line) => line.dishId === dishId).reduce((sum, line) => sum + line.qty, 0);
}

function dishCard(dish) {
  const inCart = qtyInCart(dish.id);
  return html`
    <article class="dish-card ${dish.soldOut ? 'is-sold-out' : ''}">
      ${dishPhoto(dish)}
      <div class="dish-info">
        <h3 class="dish-name">${dish.name}</h3>
        <p class="dish-desc">${dish.description}</p>
        <div class="dish-foot">
          <span class="dish-price tabular">${fmtRM(dish.price)}</span>
          ${dish.soldOut
            ? html`<span class="habis">Habis</span>`
            : html`<button class="btn btn-primary btn-sm add-btn" data-action="add" data-id="${dish.id}" aria-label="Add ${dish.name}">
                ${icon('plus', { size: 16 })} ${inCart ? `Add · ${inCart}` : 'Add'}
              </button>`}
        </div>
      </div>
    </article>`;
}

// The guest's latest order from this tab, as a banner back to its status page.
function activeOrderBanner() {
  const id = STATE.myOrders.at(-1);
  const status = id && orderStatus(id);
  if (!status) return '';
  const ready = status.state === 'ready';
  return html`
    <a class="order-banner ${ready ? 'is-ready' : ''}" href="#/order/${status.order.id}">
      ${icon(ready ? 'check' : 'clock')}
      <span>Order #${status.order.id} · ${ready ? 'ready, collect at the counter' : html`ready in <b class="tabular" data-banner-left>${fmtClock(status.remaining)}</b>`}</span>
      ${icon('arrow', { size: 16 })}
    </a>`;
}

export const menuPage = {
  title: 'Menu',
  guard: (params) => (tableExists(params.n) ? null : '/'),
  render(params) {
    setCartTable(params.n);
    const count = cartCount();
    return html`
      ${publicHeader({ strip: `Table ${params.n} · ready in ${Math.round(STATE.settings.promiseSeconds / 60)} min`, back: { href: '#/', label: 'Shop' } })}
      <nav class="category-chips" aria-label="Menu sections">
        <div class="container chips">
          ${categories.map((c) => html`<button class="chip" data-action="jump" data-target="cat-${c.id}">${c.name}</button>`)}
        </div>
      </nav>
      <main class="container menu-main ${count ? 'has-cart' : ''}">
        <h1 class="sr-only">Table ${params.n} menu</h1>
        ${activeOrderBanner()}
        ${categories.map((c) => {
          const dishes = STATE.menu.filter((dish) => dish.category === c.id);
          if (!dishes.length) return '';
          return html`
            <section class="menu-section" id="cat-${c.id}">
              <h2 class="sign-title">${c.name}</h2>
              <div class="dish-grid">${dishes.map(dishCard)}</div>
            </section>`;
        })}
      </main>
      ${count ? html`
        <div class="cart-bar-wrap">
          <button class="cart-bar container" data-action="open-cart">
            <span class="cart-bar-count">${icon('cart')} ${count} ${count === 1 ? 'item' : 'items'}</span>
            <span class="tabular">${fmtRM(cartTotal())}</span>
            <span class="cart-bar-go">View order ${icon('arrow', { size: 18 })}</span>
          </button>
        </div>` : ''}
      ${isCartOpen() ? cartSheet() : ''}`;
  },
  tick(root) {
    const left = root.querySelector('[data-banner-left]');
    const id = STATE.myOrders.at(-1);
    if (left && id) left.textContent = fmtClock(orderStatus(id)?.remaining ?? 0);
  },
  actions: {
    add(el) {
      const dish = STATE.menu.find((d) => d.id === el.dataset.id);
      if (addToCart(el.dataset.id)) toast(`${dish.name} added`);
    },
    jump(el) {
      const target = document.getElementById(el.dataset.target);
      if (!target) return;
      const offset = document.querySelector('.category-chips')?.offsetHeight || 0;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset - 8, behavior: 'smooth' });
    },
    ...cartSheetHandlers.actions,
  },
  inputs: { ...cartSheetHandlers.inputs },
};
