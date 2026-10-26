// Same-browser sync between tabs: an order placed in one tab lands on the kitchen screen in
// another, a bump there turns the guest's status to Ready here, and admin changes reach every
// tab. Events travel as plain data; a browser without BroadcastChannel simply runs each tab alone.

import { onEvent, applyRemote } from './state.js';

let channel = null;
let applying = false;

export function startChannel() {
  if (typeof BroadcastChannel === 'undefined') return;
  channel = new BroadcastChannel('n5m');

  channel.addEventListener('message', (message) => {
    applying = true;
    try { applyRemote(message.data); } finally { applying = false; }
  });

  onEvent((event) => {
    if (applying) return;     // never echo what another tab just told us
    try { channel.postMessage(JSON.parse(JSON.stringify(event))); } catch { /* closed channel */ }
  });
}
