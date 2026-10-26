// #/admin — the owner's dashboard: five KPI tiles, orders by hour, the kitchen right now and
// the day's best-selling plates.

import { html, fmtClock, fmtRM } from '../../ui.js';
import { STATE, todayStats, ordersByHour, kitchenNow, topDishes } from '../../state.js';
import { hourBars } from '../today.js';
import { icon } from '../icons.js';
import { adminPage } from './layout.js';

function kitchenNowCard() {
  const now = kitchenNow();
  return html`
    <section class="card kitchen-now">
      <h2 class="sign-title">Kitchen now</h2>
      <div class="kitchen-now-row tabular" data-kitchen-now>
        <span><b data-k="open">${now.open}</b> open</span>
        <span class="is-late"><b data-k="late">${now.late}</b> late</span>
        <span class="is-hurry"><b data-k="hurry">${now.hurry}</b> hurry</span>
      </div>
      <a class="btn btn-blue" href="#/kitchen">${icon('kitchen')} Open kitchen screen</a>
    </section>`;
}

export const dashboardPage = adminPage({
  active: 'dashboard',
  title: 'Dashboard',
  render() {
    const stats = todayStats();
    const promise = fmtClock(STATE.settings.promiseSeconds);
    return html`
      <div class="kpi-grid kpi-grid-5">
        <div class="kpi"><span class="kpi-label">Orders</span><span class="kpi-value tabular">${stats.orders}</span><span class="kpi-note">since ${STATE.settings.opens}</span></div>
        <div class="kpi"><span class="kpi-label">Avg ticket</span><span class="kpi-value tabular">${fmtClock(stats.avgSeconds)}</span><span class="kpi-note">scan to plate</span></div>
        <div class="kpi kpi-hero"><span class="kpi-label">Under ${promise}</span><span class="kpi-value tabular">${Math.round(stats.underRate * 100)}<small>%</small></span><span class="kpi-note">${stats.served} plates served</span></div>
        <div class="kpi"><span class="kpi-label">Sales</span><span class="kpi-value kpi-money tabular">${fmtRM(stats.sales)}</span><span class="kpi-note">all orders today</span></div>
        <div class="kpi"><span class="kpi-label">Slowest</span><span class="kpi-value kpi-text">${stats.slowest?.name || '—'}</span><span class="kpi-note tabular">${stats.slowest ? `${fmtClock(stats.slowest.avgSeconds)} on average` : ''}</span></div>
      </div>
      <div class="dash-row">
        <section class="card hours-card">
          <h2 class="sign-title">Orders by hour</h2>
          ${hourBars(ordersByHour())}
        </section>
        ${kitchenNowCard()}
      </div>
      <section class="card">
        <h2 class="sign-title">Top dishes today</h2>
        <ol class="top-dishes">
          ${topDishes(3).map((dish, i) => html`<li><span class="top-rank">${i + 1}</span> ${dish.name} <b class="tabular">${dish.qty}</b></li>`)}
        </ol>
      </section>`;
  },
  // The kitchen card's counts change as tickets age, so they tick in place.
  tick(root) {
    const now = kitchenNow();
    root.querySelectorAll('[data-k]').forEach((el) => { el.textContent = now[el.dataset.k]; });
  },
});
