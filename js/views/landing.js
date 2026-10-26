// #/ — the shop's front: the promise, the two doors (order at a table / the kitchen screen),
// how it works, a real QR to scan, and the day's five-minute rate.

import { html, fmtClock } from '../ui.js';
import { STATE, todayStats, kitchenNow } from '../state.js';
import { publicHeader, publicFooter } from './public.js';
import { icon } from './icons.js';

function promiseBadge() {
  return html`
    <div class="promise-badge" aria-hidden="true">
      <span class="promise-time">${fmtClock(STATE.settings.promiseSeconds)}</span>
      <span class="promise-label">scan to plate</span>
    </div>`;
}

export const landing = {
  render() {
    const stats = todayStats();
    const kitchen = kitchenNow();
    const under = Math.round(stats.underRate * 100);
    return html`
      ${publicHeader({ strip: `Every plate within ${fmtClock(STATE.settings.promiseSeconds)} of your scan` })}
      <main>
        <section class="hero container">
          <div class="hero-copy">
            <p class="eyebrow">Kedai nasi · QR ordering</p>
            <h1 class="display">Scan. Eat.<br><span class="red">Five minutes.</span></h1>
            <p class="lead">Scan the code on your table, order from your phone, and the kitchen sees your ticket at once with a five-minute clock on it.</p>
            <div class="row">
              <a class="btn btn-primary" href="#/table/4">${icon('scan')} Order at Table 4</a>
              <a class="btn btn-outline" href="#/kitchen">${icon('kitchen')} Open the kitchen screen</a>
            </div>
            <p class="hero-live tabular">
              <span class="dot" aria-hidden="true"></span>
              Kitchen now: ${kitchen.open} cooking · ${under} % served under five minutes today
            </p>
          </div>
          <figure class="hero-photo">
            <img src="assets/images/hero-shopfront.webp" width="1536" height="1024"
                 alt="The Nasi 5 Minit shopfront in the morning: red and blue enamel signboard, steel trays of lauk, marble tables and red stools">
            <span class="hero-sign" aria-hidden="true">${STATE.settings.shopName}</span>
            ${promiseBadge()}
          </figure>
        </section>

        <section class="how section">
          <div class="container how-grid">
            <div>
              <p class="eyebrow">How it works</p>
              <h2 class="sign-title">Three steps, one promise</h2>
              <ol class="steps">
                <li>${icon('scan', { size: 28 })}<div><strong>Scan</strong><span>Every table has its own code. No app, no sign-up.</span></div></li>
                <li>${icon('plate', { size: 28 })}<div><strong>Order</strong><span>Pick rice, lauk and drinks, add a note like "no sambal".</span></div></li>
                <li>${icon('clock', { size: 28 })}<div><strong>Eat</strong><span>Your phone counts down from five minutes while the kitchen cooks.</span></div></li>
              </ol>
            </div>
            <img class="how-photo" src="assets/images/table-qr.webp" width="1200" height="800" loading="lazy"
                 alt="A marble table with a QR stand beside a plate of fried chicken rice and a glass of teh tarik">
          </div>
        </section>

        <section class="section container qr-section">
          <div class="qr-card card card-raised">
            <img class="qr-img" src="assets/qr/table-4.svg" width="176" height="176" alt="QR code that opens the Table 4 menu">
            <div>
              <p class="eyebrow">Try it on your phone</p>
              <h2 class="sign-title">Scan the Table 4 code</h2>
              <p class="muted">Point your phone camera at the code to open Table 4's menu, or tap below on this device.</p>
              <a class="btn btn-blue" href="#/table/4">Open Table 4 ${icon('arrow')}</a>
            </div>
          </div>
        </section>

        <section class="kitchen-teaser">
          <div class="container kitchen-grid section">
            <img class="kitchen-photo" src="assets/images/kitchen-pass.webp" width="1200" height="800" loading="lazy"
                 alt="The steel kitchen pass with a tablet screen above plates waiting under heat lamps">
            <div>
              <p class="eyebrow on-dark">The kitchen screen</p>
              <h2 class="sign-title">Every ticket wears a clock</h2>
              <p>Orders land by station: rice line, grill and drinks. Each ticket counts up to five minutes and turns amber, then red. One tap clears it, and the guest's phone says Ready.</p>
              <div class="row">
                <a class="btn btn-primary" href="#/kitchen">${icon('kitchen')} Open the kitchen screen</a>
                <a class="btn btn-outline-light desktop-only" href="#/live">${icon('live')} See it live, side by side</a>
              </div>
            </div>
          </div>
        </section>

        <section class="section container today-teaser">
          <a class="today-card card" href="#/today">
            <span class="today-big tabular">${under}<small>%</small></span>
            <span>
              <strong>served under five minutes today</strong>
              <span class="muted">${stats.orders} orders · average ${fmtClock(stats.avgSeconds)} · see today's numbers ${icon('arrow', { size: 16 })}</span>
            </span>
          </a>
        </section>
      </main>
      ${publicFooter()}`;
  },
};
