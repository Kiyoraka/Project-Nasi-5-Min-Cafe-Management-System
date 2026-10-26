// Boot: register routes, re-render on every state change, then start the channel, the router
// and the simulation.

import { addRoute, startRouter, refresh } from './router.js';
import { subscribe } from './state.js';
import { startSim } from './sim.js';
import { startChannel } from './channel.js';
import { landing } from './views/landing.js';
import { menuPage } from './views/menu.js';
import { orderPage } from './views/order.js';
import { todayPage } from './views/today.js';
import { kitchenPage } from './views/kitchen.js';
import { loginPage } from './views/login.js';
import { dashboardPage } from './views/admin/dashboard.js';

addRoute('/', landing);
addRoute('/table/:n', menuPage);
addRoute('/order/:id', orderPage);
addRoute('/today', todayPage);
addRoute('/kitchen', kitchenPage);
addRoute('/login', loginPage);
addRoute('/admin', dashboardPage);

subscribe(() => refresh());
startChannel();
startRouter(document.getElementById('app'));
startSim();
