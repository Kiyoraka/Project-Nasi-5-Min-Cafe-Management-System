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
import { ordersPage } from './views/admin/orders.js';
import { adminMenuPage } from './views/admin/menu.js';
import { tablesPage } from './views/admin/tables.js';
import { settingsPage } from './views/admin/settings.js';

addRoute('/', landing);
addRoute('/table/:n', menuPage);
addRoute('/order/:id', orderPage);
addRoute('/today', todayPage);
addRoute('/kitchen', kitchenPage);
addRoute('/login', loginPage);
addRoute('/admin', dashboardPage);
addRoute('/admin/orders', ordersPage);
addRoute('/admin/menu', adminMenuPage);
addRoute('/admin/tables', tablesPage);
addRoute('/admin/settings', settingsPage);

subscribe(() => refresh());
startChannel();
startRouter(document.getElementById('app'));
startSim();
