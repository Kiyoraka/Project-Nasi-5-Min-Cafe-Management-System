// Same-browser sync between tabs: an order placed in one tab lands on the kitchen screen in
// another, a bump there turns the guest's status to Ready here, and admin changes reach every
// tab. A tab opened later says hello and catches up from the tabs already open. Events travel as
// plain data; a browser without BroadcastChannel simply runs each tab alone.

import { onEvent, applyRemote, snapshot } from './state.js';

let channel = null;
let applying = false;

export function startChannel() {
  if (typeof BroadcastChannel === 'undefined') return;
  channel = new BroadcastChannel('n5m');

  channel.addEventListener('message', (message) => {
    // A tab that just opened says hello; every open tab answers with what it knows.
    if (message.data?.type === 'hello') {
      try { channel.postMessage(JSON.parse(JSON.stringify(snapshot()))); } catch { /* closed channel */ }
      return;
    }
    applying = true;
    try { applyRemote(message.data); } finally { applying = false; }
  });

  onEvent((event) => {
    if (applying) return;     // never echo what another tab just told us
    try { channel.postMessage(JSON.parse(JSON.stringify(event))); } catch { /* closed channel */ }
  });

  channel.postMessage({ type: 'hello' });
}
