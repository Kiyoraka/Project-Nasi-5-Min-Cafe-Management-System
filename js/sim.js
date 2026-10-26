// Keeps the service alive: a clock tick every second for the countdowns, a new scripted order
// every 20-40 s, and simulated staff who bump each ticket at its planned time.
// Only one open tab invents orders (Web Locks); the others follow through channel.js, so two
// tabs never invent different orders. Every tab bumps due tickets and ticks its own timers.

import { STATE, createOrder, bump, dishById, openOrdersForTable } from './state.js';
import { menu as seedMenu, randomLines } from './data.js';
import { tick } from './router.js';

const SECOND = 1000;
const SEED_IDS = new Set(seedMenu.map((dish) => dish.id));
let leading = false;
let nextOrderAt = 0;

function between(min, max) {
  return min + Math.random() * (max - min);
}

function scheduleNext() {
  nextOrderAt = Date.now() + between(20, 40) * SECOND;
}

function available(dishId) {
  const dish = dishById(dishId);
  return Boolean(dish && !dish.soldOut);
}

// Prefer a table with nothing cooking, like a real floor.
function pickTable() {
  const free = STATE.tables.filter((table) => openOrdersForTable(table.id) === 0);
  const pool = free.length ? free : STATE.tables;
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? 1;
}

function newOrder() {
  const lines = randomLines(Math.random, available);
  // Now and then a guest tries a dish the owner added in Admin > Menu.
  const added = STATE.menu.filter((dish) => !SEED_IDS.has(dish.id) && !dish.soldOut);
  if (added.length && Math.random() < 0.35) {
    lines.push({ dishId: added[Math.floor(Math.random() * added.length)].id, qty: 1, note: '' });
  }
  if (lines.length === 0) return;
  // About 1 in 16 slips past the promise, so the day's 94 % stays honest.
  const bumpAfterSeconds = Math.random() < 0.06 ? between(305, 340) : between(150, 280);
  createOrder({ table: pickTable(), lines, source: 'sim', bumpAfterSeconds });
}

function bumpDue(now) {
  STATE.orders.forEach((order) => {
    if (order.readyAt) return;
    order.tickets.forEach((ticket) => {
      if (!ticket.bumpedAt && ticket.autoBumpAt <= now) bump(order.id, ticket.station);
    });
  });
}

function step() {
  const now = Date.now();
  // Bumping is idempotent, so every tab bumps what is due (a tab opened later still clears its
  // own starting tickets); only the leading tab invents new orders.
  bumpDue(now);
  // After a long hidden spell, add one order and carry on rather than a flood.
  if (leading && now >= nextOrderAt) { newOrder(); scheduleNext(); }
  if (!document.hidden) tick();
}

export function startSim() {
  scheduleNext();
  if (navigator.locks?.request) {
    // Held until this tab closes; the next tab in line then takes over the stream.
    navigator.locks.request('n5m-sim', () => new Promise(() => { leading = true; }));
  } else {
    leading = true;
  }
  setInterval(step, SECOND);
}
