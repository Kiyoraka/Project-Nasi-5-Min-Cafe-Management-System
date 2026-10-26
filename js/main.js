// Boot: register routes, re-render on every state change, then start the channel, the router
// and the simulation.

import { addRoute, startRouter, refresh } from './router.js';
import { subscribe } from './state.js';
import { startSim } from './sim.js';
import { startChannel } from './channel.js';
import { landing } from './views/landing.js';

addRoute('/', landing);

subscribe(() => refresh());
startChannel();
startRouter(document.getElementById('app'));
startSim();
