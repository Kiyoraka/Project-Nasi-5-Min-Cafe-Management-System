// Add / Edit dish modal for Admin > Menu: name, description, category, station, price, prep
// time (m:ss), the note chips guests see for this dish, a photo picked from the shop's renders
// or uploaded (kept in this tab only), and sold out. Saved dishes reach the guest menu and the
// kitchen at once. While the modal is open the router skips background repaints, so the modal
// repaints itself with refresh({ force: true }).

import { html, fmtClock, toast } from '../../ui.js';
import { STATE, dishById, addDish, updateDish, validateDish } from '../../state.js';
import { categories, stations, notePresets, photoLibrary } from '../../data.js';
import { refresh } from '../../router.js';
import { icon } from '../icons.js';

const MAX_UPLOAD = 2 * 1024 * 1024;

let open = false;
let editingId = null;
let draft = null;
let errors = {};

function blankDraft() {
  return { name: '', description: '', category: 'rice', station: 'rice', price: '', prep: '2:00', notes: [], image: null, soldOut: false };
}

function parsePrep(text) {
  const match = String(text || '').trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (match) return Number(match[1]) * 60 + Number(match[2]);
  const minutes = Number(text);
  return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : NaN;
}

export function isDishModalOpen() {
  return open;
}

export function openDishModal(id) {
  const dish = id ? dishById(id) : null;
  editingId = dish ? dish.id : null;
  draft = dish
    ? { ...dish, price: dish.price.toFixed(2), prep: fmtClock(dish.prepSeconds), notes: [...(dish.notes || [])] }
    : blankDraft();
  errors = {};
  open = true;
  refresh({ force: true });
  document.getElementById('dish-name')?.focus();
}

function close() {
  open = false;
  editingId = null;
  draft = null;
  errors = {};
  refresh({ force: true });
}

// Escape closes the modal from anywhere on the page.
document.addEventListener('keydown', (event) => {
  if (open && event.key === 'Escape') close();
});

function fieldError(name) {
  return errors[name] ? html`<span id="dish-${name}-error" class="field-error">${errors[name]}</span>` : '';
}

function options(list, selected) {
  return list.map((item) => html`<option value="${item.id}" ${item.id === selected ? 'selected' : ''}>${item.name}</option>`);
}

function photoPicker() {
  const uploaded = draft.image && draft.image.startsWith('data:');
  return html`
    <div class="photo-picker" role="radiogroup" aria-label="Dish photo">
      <button type="button" class="photo-choice photo-none ${!draft.image ? 'is-picked' : ''}" role="radio"
              aria-checked="${!draft.image ? 'true' : 'false'}" data-action="pick-photo" data-image="">No photo</button>
      ${photoLibrary.map((photo) => html`
        <button type="button" class="photo-choice ${draft.image === photo.image ? 'is-picked' : ''}" role="radio"
                aria-checked="${draft.image === photo.image ? 'true' : 'false'}" data-action="pick-photo" data-image="${photo.image}"
                title="${photo.label}"><img src="${photo.image}" width="56" height="56" alt="${photo.label}"></button>`)}
      ${uploaded ? html`
        <span class="photo-choice is-picked" title="Uploaded photo"><img src="${draft.image}" width="56" height="56" alt="Uploaded photo"></span>` : ''}
      <label class="btn btn-outline btn-sm photo-upload">${icon('plus', { size: 16 })} Upload
        <input type="file" accept="image/png, image/jpeg, image/webp" data-input="upload" class="sr-only">
      </label>
    </div>
    ${fieldError('image')}
    <p class="muted field-hint">An uploaded photo stays in this browser tab only.</p>`;
}

export function dishModal() {
  return html`
    <div class="modal-backdrop" data-self data-action="close-dish">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="dish-modal-title">
        <form data-submit="save-dish" novalidate>
          <div class="modal-head">
            <h2 id="dish-modal-title" class="sign-title">${editingId ? 'Edit dish' : 'Add dish'}</h2>
            <button type="button" class="btn btn-ghost btn-sm" data-action="close-dish" aria-label="Close">${icon('close')}</button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label for="dish-name">Name</label>
              <input id="dish-name" class="input" name="name" maxlength="60" value="${draft.name}" data-input="dish-field"
                     aria-invalid="${errors.name ? 'true' : 'false'}" aria-describedby="${errors.name ? 'dish-name-error' : ''}">
              ${fieldError('name')}
            </div>
            <div class="field">
              <label for="dish-description">Description</label>
              <input id="dish-description" class="input" name="description" maxlength="120" value="${draft.description}" data-input="dish-field">
            </div>
            <div class="field-row">
              <div class="field">
                <label for="dish-category">Category</label>
                <select id="dish-category" class="select" name="category" data-input="dish-field">${options(categories, draft.category)}</select>
                ${fieldError('category')}
              </div>
              <div class="field">
                <label for="dish-station">Station</label>
                <select id="dish-station" class="select" name="station" data-input="dish-field">${options(stations, draft.station)}</select>
                ${fieldError('station')}
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="dish-price">Price (RM)</label>
                <input id="dish-price" class="input" name="price" inputmode="decimal" value="${draft.price}" data-input="dish-field"
                       aria-invalid="${errors.price ? 'true' : 'false'}" aria-describedby="${errors.price ? 'dish-price-error' : ''}">
                ${fieldError('price')}
              </div>
              <div class="field">
                <label for="dish-prep">Prep time (m:ss)</label>
                <input id="dish-prep" class="input" name="prep" inputmode="numeric" value="${draft.prep}" data-input="dish-field"
                       aria-invalid="${errors.prep ? 'true' : 'false'}" aria-describedby="${errors.prep ? 'dish-prep-error' : ''}">
                ${fieldError('prep')}
              </div>
            </div>
            <fieldset class="field fieldset">
              <legend>Notes guests can pick</legend>
              <div class="chips">
                ${notePresets.map((note) => html`
                  <button type="button" class="chip chip-sm" aria-pressed="${draft.notes.includes(note) ? 'true' : 'false'}"
                          data-action="toggle-note" data-note="${note}">${note}</button>`)}
              </div>
              <p class="muted field-hint">None picked: guests see the usual notes for its category.</p>
            </fieldset>
            <fieldset class="field fieldset">
              <legend>Photo</legend>
              ${photoPicker()}
            </fieldset>
            <label class="switch">
              <input type="checkbox" name="soldOut" data-input="dish-field" ${draft.soldOut ? 'checked' : ''}>
              <span class="switch-track" aria-hidden="true"></span>
              <span class="switch-text">Sold out (shows as Habis)</span>
            </label>
          </div>
          <div class="modal-foot">
            <button type="button" class="btn btn-ghost" data-action="close-dish">Cancel</button>
            <button type="submit" class="btn btn-primary">${editingId ? 'Save dish' : 'Add to menu'}</button>
          </div>
        </form>
      </section>
    </div>`;
}

export const dishModalHandlers = {
  actions: {
    'close-dish'() {
      close();
    },
    'toggle-note'(el) {
      const note = el.dataset.note;
      draft.notes = draft.notes.includes(note) ? draft.notes.filter((n) => n !== note) : [...draft.notes, note];
      refresh({ force: true });
    },
    'pick-photo'(el) {
      draft.image = el.dataset.image || null;
      delete errors.image;
      refresh({ force: true });
    },
  },
  inputs: {
    'dish-field'(el) {
      if (!draft) return;      // a late change event after the modal closed
      draft[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      // Fixing a field clears its message straight away, without a repaint.
      if (errors[el.name]) {
        delete errors[el.name];
        el.setAttribute('aria-invalid', 'false');
        el.removeAttribute('aria-describedby');
        document.getElementById(`dish-${el.name}-error`)?.remove();
      }
    },
    upload(el) {
      const file = el.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        errors.image = 'Choose a PNG, JPEG or WebP picture.';
        refresh({ force: true });
        return;
      }
      if (file.size > MAX_UPLOAD) {
        errors.image = 'That picture is over 2 MB. Choose a smaller one.';
        refresh({ force: true });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        draft.image = String(reader.result);
        delete errors.image;
        refresh({ force: true });
      };
      reader.readAsDataURL(file);
    },
  },
  submits: {
    'save-dish'() {
      const prepSeconds = parsePrep(draft.prep);
      errors = validateDish(draft);
      if (!(prepSeconds >= 15 && prepSeconds <= 1800)) errors.prep = 'Use m:ss between 0:15 and 30:00, like 2:30.';
      if (Object.keys(errors).length) {
        refresh({ force: true });
        document.querySelector('.modal [aria-invalid="true"]')?.focus();
        return;
      }
      const fields = { ...draft, prepSeconds };
      const saved = editingId ? updateDish(editingId, fields) : addDish(fields);
      toast(editingId ? `${saved.name} saved` : `${saved.name} added to the menu`);
      close();
    },
  },
};
