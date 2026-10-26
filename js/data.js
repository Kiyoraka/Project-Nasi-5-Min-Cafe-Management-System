// The demo service: shop, tables, stations, menu, settings, today's history and the tickets
// already on the kitchen screen. Every time is relative to the moment the page loads, and the
// history uses a seeded random so the day's numbers are the same on every visit.

const NOW = Date.now();
const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const shop = {
  name: 'Nasi 5 Minit',
  promiseLine: 'Every plate within 5:00 of your scan',
};

export const settings = {
  shopName: 'Nasi 5 Minit',
  opens: '11:00',
  closes: '21:00',
  promiseSeconds: 300,   // customer countdown + the LATE line on the kitchen screen
  hurrySeconds: 180,     // the amber HURRY line
  chime: false,
};

export const stations = [
  { id: 'rice', name: 'Rice line' },
  { id: 'grill', name: 'Grill' },
  { id: 'drinks', name: 'Drinks' },
];

export const categories = [
  { id: 'rice', name: 'Rice Sets' },
  { id: 'lauk', name: 'Lauk' },
  { id: 'drinks', name: 'Drinks' },
];

export const notePresets = ['no sambal', 'extra sambal', 'extra telur', 'less rice', 'kurang manis', 'no ice', 'bungkus'];

// Images are the renders in assets/images; a dish without one shows the signboard tile.
export const menu = [
  { id: 'nasi-ayam-goreng', name: 'Nasi Ayam Goreng', description: 'Crispy fried chicken on fragrant rice, sambal and clear soup', category: 'rice', station: 'rice', price: 8.5, prepSeconds: 150, image: 'assets/images/dish-nasi-ayam-goreng.webp', soldOut: false },
  { id: 'nasi-lemak', name: 'Nasi Lemak', description: 'Coconut rice, sambal, ikan bilis, peanuts and egg', category: 'rice', station: 'rice', price: 6.0, prepSeconds: 90, image: 'assets/images/dish-nasi-lemak.webp', soldOut: false },
  { id: 'nasi-kerabu', name: 'Nasi Kerabu', description: 'Blue rice with herbs, coconut, fried chicken and salted egg', category: 'rice', station: 'rice', price: 7.5, prepSeconds: 140, image: 'assets/images/dish-nasi-kerabu.webp', soldOut: false },
  { id: 'nasi-goreng-kampung', name: 'Nasi Goreng Kampung', description: 'Village fried rice with kangkung, ikan bilis and a fried egg', category: 'rice', station: 'grill', price: 7.0, prepSeconds: 180, image: 'assets/images/dish-nasi-goreng-kampung.webp', soldOut: false },
  { id: 'ayam-goreng-berempah', name: 'Ayam Goreng Berempah', description: 'Spiced fried chicken under crispy lemongrass crumbs', category: 'lauk', station: 'grill', price: 9.0, prepSeconds: 230, image: 'assets/images/dish-ayam-goreng-berempah.webp', soldOut: false },
  { id: 'telur-dadar', name: 'Telur Dadar', description: 'Thick omelette with chilli, onion and spring onion', category: 'lauk', station: 'grill', price: 3.0, prepSeconds: 120, image: 'assets/images/dish-telur-dadar.webp', soldOut: false },
  { id: 'sayur-campur', name: 'Sayur Campur', description: 'Stir-fried mixed vegetables with garlic', category: 'lauk', station: 'rice', price: 3.5, prepSeconds: 60, image: 'assets/images/dish-sayur-campur.webp', soldOut: false },
  { id: 'sambal-sotong', name: 'Sambal Sotong', description: 'Squid rings in a deep red chilli sambal', category: 'lauk', station: 'rice', price: 6.5, prepSeconds: 60, image: 'assets/images/dish-sambal-sotong.webp', soldOut: true },
  { id: 'teh-tarik', name: 'Teh Tarik', description: 'Pulled milk tea with a thick foam', category: 'drinks', station: 'drinks', price: 2.5, prepSeconds: 45, image: 'assets/images/dish-teh-tarik.webp', soldOut: false },
  { id: 'sirap-limau', name: 'Sirap Limau', description: 'Rose syrup with lime over ice', category: 'drinks', station: 'drinks', price: 2.8, prepSeconds: 40, image: 'assets/images/dish-sirap-limau.webp', soldOut: false },
  { id: 'kopi-o-ais', name: 'Kopi O Ais', description: 'Black kopi over ice', category: 'drinks', station: 'drinks', price: 2.6, prepSeconds: 40, image: null, soldOut: false },
];

// The photos an owner can pick for a new dish in Admin > Menu.
export const photoLibrary = menu.filter((dish) => dish.image).map((dish) => ({ image: dish.image, label: dish.name }));

export const tables = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `T${i + 1}` }));

// Seeded random (mulberry32) so the history is identical on every visit.
function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAINS = ['nasi-ayam-goreng', 'nasi-lemak', 'nasi-kerabu', 'nasi-goreng-kampung'];
const SIDES = ['ayam-goreng-berempah', 'telur-dadar', 'sayur-campur', 'sambal-sotong'];
const DRINKS = ['teh-tarik', 'sirap-limau', 'kopi-o-ais'];

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

// A plausible order: one or two mains, maybe a side, usually a drink per main.
export function randomLines(rand = Math.random, available = () => true) {
  const lines = [];
  const add = (dishId) => {
    if (!available(dishId)) return;
    const found = lines.find((line) => line.dishId === dishId);
    if (found) found.qty += 1;
    else lines.push({ dishId, qty: 1, note: '' });
  };
  const mains = rand() < 0.3 ? 2 : 1;
  for (let i = 0; i < mains; i += 1) add(pick(rand, MAINS));
  if (rand() < 0.45) add(pick(rand, SIDES));
  for (let i = 0; i < mains; i += 1) if (rand() < 0.8) add(pick(rand, DRINKS));
  if (lines.length === 0) add(pick(rand, MAINS.filter(available)) || 'nasi-lemak');
  if (rand() < 0.35) {
    const line = lines[Math.floor(rand() * lines.length)];
    line.note = line.dishId.startsWith('teh') || line.dishId.startsWith('kopi') || line.dishId.startsWith('sirap')
      ? pick(rand, ['kurang manis', 'no ice'])
      : pick(rand, ['no sambal', 'extra sambal', 'extra telur', 'less rice']);
  }
  return lines;
}

// Today's served orders before the page opened: about 180 across the service so far,
// 94 % served inside five minutes, Ayam Goreng Berempah the slowest plate.
// The service so far: from today's opening (11:00) until a few minutes ago. A visitor outside
// opening hours sees the last three hours instead, so the day never looks empty.
function serviceWindow() {
  const opening = new Date(NOW);
  opening.setHours(11, 0, 0, 0);
  const end = NOW - 6 * MINUTE;
  const start = end - opening.getTime() >= 2 * 60 * MINUTE
    ? Math.max(opening.getTime(), end - 10 * 60 * MINUTE)
    : end - 3 * 60 * MINUTE;
  return { start, span: end - start };
}

function buildHistory() {
  const rand = seeded(5);
  const count = 182;
  const { start, span } = serviceWindow();
  const history = [];
  for (let i = 0; i < count; i += 1) {
    // Busier at lunch and dinner: fold the position through a two-peak curve.
    const u = rand();
    const peak = rand() < 0.5 ? 0.18 : 0.72;
    const position = Math.min(0.995, Math.max(0, peak + (u - 0.5) * 0.42));
    const placedAt = start + position * span;
    const lines = randomLines(rand);
    const slow = lines.some((line) => line.dishId === 'ayam-goreng-berempah');
    const late = i % 17 === 0;                    // 11 of 182 = 6 % past the promise
    const served = late
      ? 305 + Math.round(rand() * 75)
      : Math.round(120 + rand() * 115 + (slow ? 50 : 0));
    history.push({
      table: 1 + Math.floor(rand() * 12),
      lines,
      placedAt,
      readyAt: placedAt + served * SECOND,
    });
  }
  return history.sort((a, b) => a.placedAt - b.placedAt).map((order, i) => ({ ...order, id: 230 + i }));
}

export const history = buildHistory();

// Six orders already cooking when the kitchen screen opens: mostly OK, one HURRY, one near LATE.
export const bootOrders = [
  { table: 9, ageSeconds: 288, lines: [{ dishId: 'ayam-goreng-berempah', qty: 1, note: '' }, { dishId: 'nasi-lemak', qty: 1, note: '' }] },
  { table: 7, ageSeconds: 205, lines: [{ dishId: 'nasi-lemak', qty: 1, note: 'extra telur' }, { dishId: 'teh-tarik', qty: 1, note: '' }] },
  { table: 1, ageSeconds: 150, lines: [{ dishId: 'nasi-kerabu', qty: 1, note: '' }] },
  { table: 3, ageSeconds: 110, lines: [{ dishId: 'nasi-goreng-kampung', qty: 2, note: 'no sambal' }, { dishId: 'sirap-limau', qty: 2, note: 'no ice' }] },
  { table: 4, ageSeconds: 65, lines: [{ dishId: 'nasi-ayam-goreng', qty: 2, note: 'no sambal' }, { dishId: 'telur-dadar', qty: 1, note: '' }] },
  { table: 2, ageSeconds: 20, lines: [{ dishId: 'teh-tarik', qty: 2, note: 'kurang manis' }] },
].map((order) => ({ ...order, placedAt: NOW - order.ageSeconds * SECOND }));
