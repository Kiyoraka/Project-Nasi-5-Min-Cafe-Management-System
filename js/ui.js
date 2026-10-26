// Small view helpers: an escaping html`` template, a toast, money and clock formatting.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

class SafeHtml {
  constructor(text) { this.text = text; }
  toString() { return this.text; }
}

// Mark a string as already-safe markup (only for strings built by html`` or trusted SVG).
export function raw(text) {
  return new SafeHtml(text);
}

function renderValue(value) {
  if (value instanceof SafeHtml) return value.text;
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (value === false || value === null || value === undefined) return '';
  return escape(value);
}

// Interpolated values are escaped; nested html`` results and arrays of them pass through.
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => { out += renderValue(value) + strings[i + 1]; });
  return new SafeHtml(out);
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetWidth; // restart the entry animation
  el.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
}

// Speak a short line to screen readers through the one live region that never repaints.
export function announce(message) {
  const el = document.getElementById('announcer');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { el.textContent = message; }, 50);
}

// A short two-note chime for new tickets (Web Audio; the context starts on a click).
let audio = null;
export function chime() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    [880, 1320].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + i * 0.16;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  } catch { /* no audio on this device */ }
}

// 8.5 -> "RM 8.50"; 2431.5 -> "RM 2,431.50"
export function fmtRM(amount) {
  return 'RM ' + Number(amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Seconds -> "m:ss" (negative values clamp to 0:00).
export function fmtClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function pluralize(count, word, plural = `${word}s`) {
  return `${count} ${count === 1 ? word : plural}`;
}
