// The admin shell, app style: a top bar (shop nameplate, page title, signed-in email, Sign out)
// and a bottom navigation dock — floating and centred from 768 px, a full-width tab bar below.
// There is no sidebar anywhere.

import { html } from '../../ui.js';
import { STATE, openOrderCount } from '../../state.js';
import { signedInEmail, logout } from '../../auth.js';
import { navigate } from '../../router.js';
import { icon } from '../icons.js';
import { requireAdmin } from '../login.js';

const DOCK = [
  { id: 'dashboard', href: '#/admin', label: 'Dashboard', short: 'Dash', icon: 'dashboard' },
  { id: 'orders', href: '#/admin/orders', label: 'Orders', short: 'Orders', icon: 'orders' },
  { id: 'menu', href: '#/admin/menu', label: 'Menu', short: 'Menu', icon: 'menu' },
  { id: 'tables', href: '#/admin/tables', label: 'Tables', short: 'Tables', icon: 'tables' },
  { id: 'settings', href: '#/admin/settings', label: 'Settings', short: 'Settings', icon: 'settings' },
];

function dock(active) {
  const open = openOrderCount();
  return html`
    <nav class="dock" aria-label="Admin">
      ${DOCK.map((item) => html`
        <a class="dock-item ${active === item.id ? 'is-active' : ''}" href="${item.href}"
           aria-current="${active === item.id ? 'page' : 'false'}">
          <span class="dock-icon">${icon(item.icon, { size: 22 })}
            ${item.id === 'orders' && open ? html`<span class="dock-badge tabular" aria-label="${open} open orders">${open}</span>` : ''}
          </span>
          <span class="dock-label"><span class="dock-long">${item.label}</span><span class="dock-short">${item.short}</span></span>
        </a>`)}
    </nav>`;
}

export function adminLayout({ active, title, body }) {
  return html`
    <div class="admin">
      <header class="admin-top">
        <div class="admin-top-inner">
          <a class="signboard-name admin-brand" href="#/">${STATE.settings.shopName}</a>
          <h1 class="admin-title"><span class="admin-kicker">Admin ·</span> ${title}</h1>
          <span class="admin-user" title="Signed in">${signedInEmail()}</span>
          <button class="btn btn-sm admin-signout" data-action="sign-out" aria-label="Sign out">${icon('signOut', { size: 18 })}<span>Sign out</span></button>
        </div>
      </header>
      <main class="admin-main">${body}</main>
      ${dock(active)}
    </div>`;
}

// Every admin page: guarded, titled, and able to sign out.
export function adminPage({ active, title, render, actions = {}, inputs = {}, submits = {}, tick, mounted }) {
  return {
    title,
    guard: requireAdmin,
    render: (params) => adminLayout({ active, title, body: render(params) }),
    actions: {
      'sign-out'() {
        logout();
        navigate('/login');
      },
      ...actions,
    },
    inputs,
    submits,
    tick,
    mounted,
  };
}
