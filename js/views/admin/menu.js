// #/admin/menu — the owner's menu: a category filter and search, every dish with its photo,
// category, station, price and prep time, a sold-out switch, Edit, and Delete — refused inline
// while the dish is on an open kitchen ticket. Changes reach the guest menu at once.

import { html, fmtRM, fmtClock, toast } from '../../ui.js';
import { STATE, toggleSoldOut, removeDish, stationName } from '../../state.js';
import { categories } from '../../data.js';
import { refresh } from '../../router.js';
import { dishPhoto } from '../menu.js';
import { icon } from '../icons.js';
import { adminPage } from './layout.js';
import { dishModal, dishModalHandlers, openDishModal, isDishModalOpen } from './dish-modal.js';

let category = 'all';
let query = '';
let refusal = null;     // { dishId, count } when a delete was refused

function categoryName(id) {
  return categories.find((c) => c.id === id)?.name || id;
}

function dishRow(dish) {
  const hidden = query && !`${dish.name} ${dish.description}`.toLowerCase().includes(query);
  return html`
    <tr data-search="${`${dish.name} ${dish.description}`.toLowerCase()}" ${hidden ? 'hidden' : ''}>
      <td data-label="Photo" class="cell-photo">${dishPhoto(dish, 48)}</td>
      <td data-label="Name" class="wide"><b>${dish.name}</b><span class="muted cell-sub">${dish.description}</span></td>
      <td data-label="Category">${categoryName(dish.category)}</td>
      <td data-label="Station">${stationName(dish.station)}</td>
      <td data-label="Price" class="num tabular">${fmtRM(dish.price)}</td>
      <td data-label="Prep" class="num tabular">${fmtClock(dish.prepSeconds)}</td>
      <td data-label="Sold out">
        <label class="switch">
          <input type="checkbox" data-input="sold-out" data-id="${dish.id}" ${dish.soldOut ? 'checked' : ''} aria-label="${dish.name} sold out">
          <span class="switch-track" aria-hidden="true"></span>
          <span class="switch-text">${dish.soldOut ? 'Habis' : 'On menu'}</span>
        </label>
      </td>
      <td data-label="" class="cell-actions wide">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${dish.id}">Edit</button>
        <button class="btn btn-ghost btn-sm btn-danger" data-action="delete" data-id="${dish.id}">Delete</button>
      </td>
    </tr>
    ${refusal?.dishId === dish.id ? html`
      <tr class="refusal-row"><td colspan="8" class="wide">
        <p class="refusal" role="alert">${icon('clock', { size: 16 })} ${dish.name} is on ${refusal.count} open ${refusal.count === 1 ? 'ticket' : 'tickets'} — bump ${refusal.count === 1 ? 'it' : 'them'} on the kitchen screen first, or mark the dish sold out.</p>
      </td></tr>` : ''}`;
}

export const adminMenuPage = adminPage({
  active: 'menu',
  title: 'Menu',
  render() {
    const dishes = STATE.menu.filter((dish) => category === 'all' || dish.category === category);
    return html`
      <section class="card">
        <div class="toolbar">
          <h2 class="sign-title">Menu</h2>
          <div class="chips" role="group" aria-label="Filter by category">
            ${[{ id: 'all', name: 'All' }, ...categories].map((c) => html`
              <button class="chip" aria-pressed="${category === c.id ? 'true' : 'false'}" data-action="category" data-category="${c.id}">${c.name}</button>`)}
          </div>
          <input class="input toolbar-search" type="search" placeholder="Search dishes" aria-label="Search dishes"
                 value="${query}" data-input="search">
          <button class="btn btn-primary" data-action="add">${icon('plus', { size: 18 })} Add dish</button>
        </div>
        <div class="table-wrap">
          <table class="data-table menu-table">
            <thead><tr><th>Photo</th><th>Name</th><th>Category</th><th>Station</th><th class="num">RM</th><th class="num">Prep</th><th>Sold out</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>${dishes.map(dishRow)}</tbody>
          </table>
        </div>
        <p class="muted table-empty" data-empty ${dishes.length ? 'hidden' : ''}>No dishes in this category yet.</p>
        <p class="muted admin-note">Changes show on the guest menu straight away. Sold-out dishes stay on the menu as Habis.</p>
      </section>
      ${isDishModalOpen() ? dishModal() : ''}`;
  },
  actions: {
    category(el) {
      category = el.dataset.category;
      refusal = null;
      refresh({ force: true });
    },
    add() {
      openDishModal(null);
    },
    edit(el) {
      openDishModal(el.dataset.id);
    },
    delete(el) {
      const dish = STATE.menu.find((d) => d.id === el.dataset.id);
      const result = removeDish(el.dataset.id);
      refusal = result.ok ? null : { dishId: el.dataset.id, count: result.count };
      if (result.ok) toast(`${dish?.name} removed from the menu`);
      refresh({ force: true });
    },
    ...dishModalHandlers.actions,
  },
  inputs: {
    'sold-out'(el) {
      toggleSoldOut(el.dataset.id);
      const dish = STATE.menu.find((d) => d.id === el.dataset.id);
      toast(dish.soldOut ? `${dish.name} marked Habis` : `${dish.name} back on the menu`);
      refresh({ force: true });
    },
    search(el) {
      query = el.value.trim().toLowerCase();
      let any = false;
      el.closest('.card').querySelectorAll('tbody tr[data-search]').forEach((row) => {
        const hit = !query || row.dataset.search.includes(query);
        row.hidden = !hit;
        any = any || hit;
      });
      el.closest('.card').querySelector('[data-empty]').hidden = any;
    },
    ...dishModalHandlers.inputs,
  },
  submits: { ...dishModalHandlers.submits },
});
