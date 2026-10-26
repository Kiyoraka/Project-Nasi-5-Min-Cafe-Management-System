// One shared STATE for every page: the cart, the orders and their kitchen tickets, the menu,
// the tables and the settings. Pages read it through the selectors below and change it only
// through the actions, which notify subscribers (the router re-renders) and emit events
// (channel.js forwards them to other tabs).

import * as data from './data.js';

const SECOND = 1000;

export const STATE = {
  settings: { ...data.settings },
  menu: data.menu.map((dish) => ({ ...dish })),
  tables: data.tables.map((table) => ({ ...table })),
  orders: [],                 // served history + live orders, oldest first
  cart: { table: 4, lines: [] },
  bumpStack: [],              // [{ orderId, station }] most recent last, for Recall
  myOrders: [],               // ids placed from this tab
  nextId: 1,
};

// ---------- notify + events ----------
const listeners = new Set();
const eventListeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function onEvent(fn) {
  eventListeners.add(fn);
}

function emit(event) {
  eventListeners.forEach((fn) => fn(event));
}

// ---------- lookups ----------
export function dishById(id) {
  return STATE.menu.find((dish) => dish.id === id);
}

export function stationName(id) {
  return data.stations.find((station) => station.id === id)?.name || id;
}

export function orderById(id) {
  return STATE.orders.find((order) => order.id === Number(id));
}

export function lineTotal(line) {
  return (dishById(line.dishId)?.price || 0) * line.qty;
}

export function orderTotal(order) {
  return order.lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// ---------- orders ----------
// Split an order's lines into one kitchen ticket per station.
function buildTickets(lines, autoBumpAt) {
  const byStation = new Map();
  lines.forEach((line) => {
    const station = dishById(line.dishId)?.station || 'rice';
    if (!byStation.has(station)) byStation.set(station, []);
    byStation.get(station).push({ ...line });
  });
  return [...byStation.entries()].map(([station, stationLines], i) => ({
    station,
    lines: stationLines,
    bumpedAt: null,
    // Drinks come out first; each station a few seconds apart so they never bump in one tick.
    autoBumpAt: autoBumpAt - (station === 'drinks' ? 60 * SECOND : 0) + i * 4 * SECOND,
  }));
}

// Create a live order. bumpAfterSeconds is when the simulated staff will bump it.
export function createOrder({ table, lines, placedAt = Date.now(), source = 'sim', bumpAfterSeconds }, { silent = false } = {}) {
  const autoBumpAt = Math.max(placedAt + bumpAfterSeconds * SECOND, Date.now() + randomBetween(15, 45) * SECOND);
  const order = {
    id: STATE.nextId++,
    table,
    lines: lines.map((line) => ({ ...line })),
    placedAt,
    readyAt: null,
    source,
    fresh: true,              // flashes once on the kitchen screen
    tickets: buildTickets(lines, autoBumpAt),
  };
  STATE.orders.push(order);
  if (!silent) {
    emit({ type: 'order', order });
    notify();
  }
  return order;
}

// ---------- cart (customer) ----------
export function setCartTable(table) {
  const id = Number(table);
  if (STATE.cart.table === id) return;
  STATE.cart = { table: id, lines: [] };
}

export function cartCount() {
  return STATE.cart.lines.reduce((sum, line) => sum + line.qty, 0);
}

export function cartTotal() {
  return STATE.cart.lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function addToCart(dishId) {
  const dish = dishById(dishId);
  if (!dish || dish.soldOut) return false;
  const found = STATE.cart.lines.find((line) => line.dishId === dishId && !line.note);
  if (found) found.qty += 1;
  else STATE.cart.lines.push({ dishId, qty: 1, note: '' });
  notify();
  return true;
}

export function setQty(index, qty) {
  const line = STATE.cart.lines[index];
  if (!line) return;
  if (qty <= 0) STATE.cart.lines.splice(index, 1);
  else line.qty = Math.min(20, qty);
  notify();
}

export function setNote(index, note) {
  const line = STATE.cart.lines[index];
  if (!line) return;
  line.note = String(note).slice(0, 80);
}

// Toggle a preset like "no sambal" inside the line's note.
export function toggleNotePreset(index, preset) {
  const line = STATE.cart.lines[index];
  if (!line) return;
  const parts = line.note.split(',').map((part) => part.trim()).filter(Boolean);
  const at = parts.indexOf(preset);
  if (at >= 0) parts.splice(at, 1);
  else parts.push(preset);
  line.note = parts.join(', ');
  notify();
}

export function removeFromCart(index) {
  STATE.cart.lines.splice(index, 1);
  notify();
}

// Send the cart to the kitchen; returns the new order (or null when the cart is empty).
export function placeOrder() {
  const lines = STATE.cart.lines.filter((line) => dishById(line.dishId) && !dishById(line.dishId).soldOut);
  if (lines.length === 0) return null;
  const order = createOrder(
    { table: STATE.cart.table, lines, source: 'guest', bumpAfterSeconds: randomBetween(165, 225) },
    { silent: true },
  );
  STATE.myOrders.push(order.id);
  STATE.cart.lines = [];
  emit({ type: 'order', order });
  notify();
  return order;
}

// ---------- kitchen ----------
export function bump(orderId, station, { silent = false } = {}) {
  const order = orderById(orderId);
  const ticket = order?.tickets.find((t) => t.station === station);
  if (!ticket || ticket.bumpedAt) return;
  ticket.bumpedAt = Date.now();
  order.fresh = false;
  STATE.bumpStack.push({ orderId: order.id, station });
  if (STATE.bumpStack.length > 20) STATE.bumpStack.shift();
  if (order.tickets.every((t) => t.bumpedAt)) {
    order.readyAt = Math.max(...order.tickets.map((t) => t.bumpedAt));
  }
  if (!silent) emit({ type: 'bump', orderId: order.id, station });
  notify();
}

// Bring the most recently bumped ticket back to the screen.
export function recall() {
  const last = STATE.bumpStack.pop();
  if (!last) return null;
  const order = orderById(last.orderId);
  const ticket = order?.tickets.find((t) => t.station === last.station);
  if (!ticket) return null;
  ticket.bumpedAt = null;
  ticket.autoBumpAt = Date.now() + randomBetween(25, 50) * SECOND;
  order.readyAt = null;
  emit({ type: 'recall', orderId: order.id, station: last.station });
  notify();
  return order;
}

export function markSeen(orderId) {
  const order = orderById(orderId);
  if (order) order.fresh = false;
}

// ---------- admin: menu ----------
function slugify(name) {
  return String(name).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dish';
}

function cleanDish(fields) {
  return {
    name: String(fields.name || '').trim().slice(0, 60),
    description: String(fields.description || '').trim().slice(0, 120),
    category: fields.category,
    station: fields.station,
    price: Math.round(Number(fields.price) * 100) / 100,
    prepSeconds: Math.max(15, Math.round(Number(fields.prepSeconds) || 120)),
    image: fields.image || null,
    soldOut: Boolean(fields.soldOut),
  };
}

export function validateDish(fields) {
  const errors = {};
  if (!String(fields.name || '').trim()) errors.name = 'Give the dish a name.';
  if (!(Number(fields.price) > 0)) errors.price = 'Price must be more than RM 0.';
  if (!data.categories.some((c) => c.id === fields.category)) errors.category = 'Pick a category.';
  if (!data.stations.some((s) => s.id === fields.station)) errors.station = 'Pick a station.';
  return errors;
}

export function addDish(fields) {
  const dish = cleanDish(fields);
  let id = slugify(dish.name);
  for (let n = 2; dishById(id); n += 1) id = `${slugify(dish.name)}-${n}`;
  const created = { id, ...dish };
  STATE.menu.push(created);
  emit({ type: 'menu', menu: STATE.menu });
  notify();
  return created;
}

export function updateDish(id, fields) {
  const dish = dishById(id);
  if (!dish) return null;
  Object.assign(dish, cleanDish({ ...dish, ...fields }));
  emit({ type: 'menu', menu: STATE.menu });
  notify();
  return dish;
}

export function openTicketCountForDish(id) {
  return openTickets().filter((t) => t.lines.some((line) => line.dishId === id)).length;
}

export function removeDish(id) {
  const count = openTicketCountForDish(id);
  if (count > 0) return { ok: false, count };
  STATE.menu = STATE.menu.filter((dish) => dish.id !== id);
  STATE.cart.lines = STATE.cart.lines.filter((line) => line.dishId !== id);
  emit({ type: 'menu', menu: STATE.menu });
  notify();
  return { ok: true };
}

export function toggleSoldOut(id) {
  const dish = dishById(id);
  if (!dish) return;
  dish.soldOut = !dish.soldOut;
  emit({ type: 'menu', menu: STATE.menu });
  notify();
}

// ---------- admin: tables + settings ----------
export function openOrdersForTable(id) {
  return STATE.orders.filter((order) => order.table === Number(id) && !order.readyAt).length;
}

export function addTable() {
  const id = Math.max(0, ...STATE.tables.map((t) => t.id)) + 1;
  STATE.tables.push({ id, name: `T${id}` });
  emit({ type: 'tables', tables: STATE.tables });
  notify();
  return id;
}

export function removeTable(id) {
  const open = openOrdersForTable(id);
  if (open > 0) return { ok: false, open };
  STATE.tables = STATE.tables.filter((t) => t.id !== Number(id));
  emit({ type: 'tables', tables: STATE.tables });
  notify();
  return { ok: true };
}

export function validateSettings(fields) {
  const errors = {};
  if (!String(fields.shopName || '').trim()) errors.shopName = 'The shop needs a name.';
  if (!(fields.promiseSeconds >= 60 && fields.promiseSeconds <= 1800)) errors.promiseSeconds = 'Promise between 1:00 and 30:00.';
  if (!(fields.hurrySeconds >= 30 && fields.hurrySeconds < fields.promiseSeconds)) errors.hurrySeconds = 'HURRY must come before the promise.';
  return errors;
}

export function saveSettings(fields) {
  Object.assign(STATE.settings, fields, { shopName: String(fields.shopName ?? STATE.settings.shopName).trim().slice(0, 40) });
  emit({ type: 'settings', settings: STATE.settings });
  notify();
}

// ---------- events from another tab (channel.js) ----------
export function applyRemote(event) {
  if (event.type === 'order' && !orderById(event.order.id)) {
    // Ids come from the sending tab; keep ours ahead of theirs.
    STATE.orders.push({ ...event.order, fresh: true });
    STATE.orders.sort((a, b) => a.placedAt - b.placedAt);
    STATE.nextId = Math.max(STATE.nextId, event.order.id + 1);
  } else if (event.type === 'bump') {
    bump(event.orderId, event.station, { silent: true });
    return;
  } else if (event.type === 'recall') {
    const order = orderById(event.orderId);
    const ticket = order?.tickets.find((t) => t.station === event.station);
    if (ticket) { ticket.bumpedAt = null; order.readyAt = null; }
  } else if (event.type === 'menu') {
    STATE.menu = event.menu.map((dish) => ({ ...dish }));
  } else if (event.type === 'tables') {
    STATE.tables = event.tables.map((t) => ({ ...t }));
  } else if (event.type === 'settings') {
    Object.assign(STATE.settings, event.settings);
  } else {
    return;
  }
  notify();
}

// ---------- selectors ----------
export function ticketAge(ticketOrOrder, now = Date.now()) {
  const placedAt = ticketOrOrder.placedAt ?? ticketOrOrder.order?.placedAt;
  return Math.max(0, (now - placedAt) / SECOND);
}

// 'ok' < HURRY line <= 'hurry' < promise line <= 'late'
export function ticketState(ageSeconds) {
  if (ageSeconds >= STATE.settings.promiseSeconds) return 'late';
  if (ageSeconds >= STATE.settings.hurrySeconds) return 'hurry';
  return 'ok';
}

// Every unbumped ticket, oldest first: { key, order, station, lines, placedAt }.
export function openTickets() {
  const list = [];
  STATE.orders.forEach((order) => {
    if (order.readyAt) return;
    order.tickets.forEach((ticket) => {
      if (ticket.bumpedAt) return;
      list.push({ key: `${order.id}:${ticket.station}`, order, ticket, station: ticket.station, lines: ticket.lines, placedAt: order.placedAt });
    });
  });
  return list.sort((a, b) => a.placedAt - b.placedAt);
}

export function ticketsByStation(station = 'all') {
  const open = openTickets();
  return station === 'all' ? open : open.filter((t) => t.station === station);
}

// "All day": how many of each dish are on open tickets right now, most first.
export function allDayCounts() {
  const counts = new Map();
  openTickets().forEach((t) => t.lines.forEach((line) => {
    counts.set(line.dishId, (counts.get(line.dishId) || 0) + line.qty);
  }));
  return [...counts.entries()]
    .map(([dishId, qty]) => ({ dishId, name: dishById(dishId)?.name || dishId, qty }))
    .sort((a, b) => b.qty - a.qty);
}

export function kitchenNow(now = Date.now()) {
  const open = openTickets();
  const states = open.map((t) => ticketState(ticketAge(t, now)));
  return {
    open: open.length,
    late: states.filter((s) => s === 'late').length,
    hurry: states.filter((s) => s === 'hurry').length,
  };
}

export function openOrderCount() {
  return STATE.orders.filter((order) => !order.readyAt).length;
}

// The customer's view of one order.
export function orderStatus(id, now = Date.now()) {
  const order = orderById(id);
  if (!order) return null;
  const promise = STATE.settings.promiseSeconds;
  if (order.readyAt) {
    return { order, state: 'ready', servedSeconds: (order.readyAt - order.placedAt) / SECOND, remaining: 0, promise };
  }
  const age = ticketAge(order, now);
  return { order, state: age < 8 ? 'received' : 'cooking', remaining: promise - age, servedSeconds: null, promise };
}

export function servedOrders() {
  return STATE.orders.filter((order) => order.readyAt);
}

export function todayStats() {
  const served = servedOrders();
  const times = served.map((order) => (order.readyAt - order.placedAt) / SECOND);
  const under = times.filter((t) => t < STATE.settings.promiseSeconds).length;
  const perDish = new Map();
  served.forEach((order, i) => order.lines.forEach((line) => {
    if (!perDish.has(line.dishId)) perDish.set(line.dishId, []);
    perDish.get(line.dishId).push(times[i]);
  }));
  let slowest = null;
  perDish.forEach((list, dishId) => {
    if (list.length < 3) return;
    const avg = list.reduce((a, b) => a + b, 0) / list.length;
    if (!slowest || avg > slowest.avgSeconds) slowest = { dishId, name: dishById(dishId)?.name || dishId, avgSeconds: avg };
  });
  return {
    orders: STATE.orders.length,
    served: served.length,
    avgSeconds: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    underRate: times.length ? under / times.length : 1,
    sales: STATE.orders.reduce((sum, order) => sum + orderTotal(order), 0),
    slowest,
  };
}

// Orders per opening hour, from the first order's hour to now.
export function ordersByHour(now = Date.now()) {
  if (STATE.orders.length === 0) return [];
  const first = new Date(STATE.orders[0].placedAt);
  first.setMinutes(0, 0, 0);
  const buckets = [];
  for (let t = first.getTime(); t <= now; t += 3600 * SECOND) buckets.push({ hour: new Date(t).getHours(), start: t, count: 0 });
  STATE.orders.forEach((order) => {
    const bucket = buckets.find((b) => order.placedAt >= b.start && order.placedAt < b.start + 3600 * SECOND);
    if (bucket) bucket.count += 1;
  });
  return buckets;
}

// Best-selling plates today (drinks left out — they top every list).
export function topDishes(limit = 3) {
  const counts = new Map();
  STATE.orders.forEach((order) => order.lines.forEach((line) => {
    if (dishById(line.dishId)?.category === 'drinks') return;
    counts.set(line.dishId, (counts.get(line.dishId) || 0) + line.qty);
  }));
  return [...counts.entries()]
    .map(([dishId, qty]) => ({ dishId, name: dishById(dishId)?.name || dishId, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

// ---------- boot ----------
function seed() {
  data.history.forEach((order) => {
    STATE.orders.push({ ...order, source: 'history', fresh: false, tickets: [] });
  });
  STATE.nextId = (data.history.at(-1)?.id ?? 0) + 1;
  data.bootOrders.forEach((order) => {
    createOrder(
      { table: order.table, lines: order.lines, placedAt: order.placedAt, source: 'boot', bumpAfterSeconds: randomBetween(150, 280) },
      { silent: true },
    ).fresh = false;
  });
}

seed();
