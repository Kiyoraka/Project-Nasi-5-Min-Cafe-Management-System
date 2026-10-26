// #/today — the quotable card: orders today, average ticket time, the share served inside
// the promise, the slowest plate, and orders by hour as CSS bars.

import { html, fmtClock, formatTime } from '../ui.js';
import { STATE, todayStats, ordersByHour } from '../state.js';
import { publicHeader, publicFooter } from './public.js';

export function hourLabel(hour) {
  const suffix = hour < 12 ? 'am' : 'pm';
  return `${hour % 12 || 12}${suffix}`;
}

// Bars for orders per hour; shared with the admin dashboard.
export function hourBars(buckets) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return html`
    <div class="hour-bars" role="img" aria-label="Orders per hour: ${buckets.map((b) => `${hourLabel(b.hour)} ${b.count}`).join(', ')}">
      ${buckets.map((b) => html`
        <div class="hour-bar">
          <span class="hour-count tabular">${b.count}</span>
          <span class="hour-track"><span class="hour-fill" style="height:${Math.max(3, (b.count / max) * 100).toFixed(0)}%"></span></span>
          <span class="hour-label">${hourLabel(b.hour)}</span>
        </div>`)}
    </div>`;
}

export const todayPage = {
  title: 'Today',
  dock: { active: 'today' },
  render() {
    const stats = todayStats();
    const under = Math.round(stats.underRate * 100);
    const promise = fmtClock(STATE.settings.promiseSeconds);
    return html`
      ${publicHeader({ strip: `Today at ${STATE.settings.shopName} · updated ${formatTime(Date.now())}` })}
      <main class="container today-main section">
        <p class="eyebrow">The day so far</p>
        <h1 class="display">Today at the shop</h1>
        <div class="kpi-grid">
          <div class="kpi kpi-hero">
            <span class="kpi-label">Served under ${promise}</span>
            <span class="kpi-value tabular">${under}<small>%</small></span>
            <span class="kpi-note">of ${stats.served} plates served so far</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Orders</span>
            <span class="kpi-value tabular">${stats.orders}</span>
            <span class="kpi-note">since ${STATE.settings.opens}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Average ticket</span>
            <span class="kpi-value tabular">${fmtClock(stats.avgSeconds)}</span>
            <span class="kpi-note">scan to plate</span>
          </div>
          <div class="kpi kpi-wide">
            <span class="kpi-label">Slowest plate</span>
            <span class="kpi-value kpi-text">${stats.slowest?.name || '—'}</span>
            <span class="kpi-note tabular">${stats.slowest ? `${fmtClock(stats.slowest.avgSeconds)} on average` : ''}</span>
          </div>
        </div>
        <section class="card hours-card">
          <h2 class="sign-title">Orders by hour</h2>
          ${hourBars(ordersByHour())}
        </section>
        <div class="row">
          <a class="btn btn-primary" href="#/table/4">Order at Table 4</a>
          <a class="btn btn-outline" href="#/kitchen">Open the kitchen screen</a>
        </div>
      </main>
      ${publicFooter()}`;
  },
};
