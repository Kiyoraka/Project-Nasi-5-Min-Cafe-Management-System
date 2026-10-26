// #/admin/settings — the shop name, opening hours, the promise (the customer countdown and the
// LATE line), the HURRY line and the kitchen chime. Saved values recolour the kitchen screen at
// once and reach every open tab.

import { html, fmtClock, toast } from '../../ui.js';
import { STATE, saveSettings, validateSettings } from '../../state.js';
import { refresh } from '../../router.js';
import { adminPage } from './layout.js';

let draft = null;
let errors = {};
let saved = false;

function freshDraft() {
  const s = STATE.settings;
  return { shopName: s.shopName, opens: s.opens, closes: s.closes, promise: fmtClock(s.promiseSeconds), hurry: fmtClock(s.hurrySeconds), chime: s.chime };
}

function parseClock(text) {
  const match = String(text || '').trim().match(/^(\d{1,2}):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
}

function errorFor(name) {
  return errors[name] ? html`<span id="set-${name}-error" class="field-error">${errors[name]}</span>` : '';
}

function invalid(name) {
  return errors[name] ? 'true' : 'false';
}

export const settingsPage = adminPage({
  active: 'settings',
  title: 'Settings',
  render() {
    draft = draft || freshDraft();
    return html`
      <section class="card settings-card">
        <h2 class="sign-title">Settings</h2>
        <form class="settings-form" data-submit="save-settings" novalidate>
          <div class="field">
            <label for="set-shopName">Shop name</label>
            <input id="set-shopName" class="input" name="shopName" maxlength="40" value="${draft.shopName}" data-input="setting"
                   aria-invalid="${invalid('shopName')}" aria-describedby="${errors.shopName ? 'set-shopName-error' : ''}">
            ${errorFor('shopName')}
          </div>
          <div class="field-row">
            <div class="field">
              <label for="set-opens">Opens</label>
              <input id="set-opens" class="input" type="time" name="opens" value="${draft.opens}" data-input="setting">
            </div>
            <div class="field">
              <label for="set-closes">Closes</label>
              <input id="set-closes" class="input" type="time" name="closes" value="${draft.closes}" data-input="setting">
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="set-promise">Promise (m:ss)</label>
              <input id="set-promise" class="input" name="promise" inputmode="numeric" value="${draft.promise}" data-input="setting"
                     aria-invalid="${invalid('promiseSeconds')}" aria-describedby="set-promise-hint ${errors.promiseSeconds ? 'set-promiseSeconds-error' : ''}">
              <span id="set-promise-hint" class="muted field-hint">The customer countdown and the red LATE line.</span>
              ${errorFor('promiseSeconds')}
            </div>
            <div class="field">
              <label for="set-hurry">HURRY at (m:ss)</label>
              <input id="set-hurry" class="input" name="hurry" inputmode="numeric" value="${draft.hurry}" data-input="setting"
                     aria-invalid="${invalid('hurrySeconds')}" aria-describedby="set-hurry-hint ${errors.hurrySeconds ? 'set-hurrySeconds-error' : ''}">
              <span id="set-hurry-hint" class="muted field-hint">The amber line on the kitchen screen.</span>
              ${errorFor('hurrySeconds')}
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" name="chime" data-input="setting" ${draft.chime ? 'checked' : ''}>
            <span class="switch-track" aria-hidden="true"></span>
            <span class="switch-text">Chime on new kitchen tickets</span>
          </label>
          <div class="row settings-actions">
            <button class="btn btn-primary" type="submit">Save settings</button>
            <button class="btn btn-ghost" type="button" data-action="reset-settings">Undo changes</button>
          </div>
          ${saved ? html`<p class="saved-line" role="status">Saved — the kitchen screen uses the new times now.</p>` : ''}
        </form>
      </section>`;
  },
  inputs: {
    setting(el) {
      draft[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      saved = false;
    },
  },
  actions: {
    'reset-settings'() {
      draft = freshDraft();
      errors = {};
      saved = false;
      refresh({ force: true });
    },
  },
  submits: {
    'save-settings'() {
      const fields = {
        shopName: String(draft.shopName || '').trim(),
        opens: draft.opens,
        closes: draft.closes,
        promiseSeconds: parseClock(draft.promise),
        hurrySeconds: parseClock(draft.hurry),
        chime: Boolean(draft.chime),
      };
      errors = validateSettings(fields);
      if (Number.isNaN(fields.promiseSeconds)) errors.promiseSeconds = 'Use m:ss, like 5:00.';
      if (Number.isNaN(fields.hurrySeconds)) errors.hurrySeconds = 'Use m:ss, like 3:00.';
      saved = false;
      if (Object.keys(errors).length) {
        refresh({ force: true });
        document.querySelector('.settings-form [aria-invalid="true"]')?.focus();
        return;
      }
      saveSettings(fields);
      draft = freshDraft();
      saved = true;
      toast('Settings saved');
      refresh({ force: true });
    },
  },
});
