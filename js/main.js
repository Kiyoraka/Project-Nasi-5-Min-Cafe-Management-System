// Boot: register routes, then start the router.
// Views, state and the simulation are wired in as each phase lands.

import { addRoute, startRouter } from './router.js';
import { html } from './ui.js';

// Shell check page until the landing view arrives (Phase 3).
const shell = {
  render: () => html`
    <header class="signboard">
      <div class="signboard-inner container">
        <span class="signboard-name">Nasi 5 Minit</span>
      </div>
    </header>
    <div class="strip">Every plate within 5:00 of your scan</div>
    <main class="container section">
      <h1 class="display">Scan. Eat. Five minutes.</h1>
      <p class="muted">The shop is setting up its tables.</p>
      <div class="row">
        <a class="btn btn-primary" href="#/">Order at Table 4</a>
        <a class="btn btn-outline" href="#/">Open the kitchen screen</a>
      </div>
    </main>`,
};

addRoute('/', shell);

startRouter(document.getElementById('app'));
