
// --- Canvas Setup ---
const canvas = document.createElement('canvas');
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');

// --- Background Video ---
const videoEl = document.createElement('video');
videoEl.loop = true;
videoEl.muted = true;
videoEl.playsInline = true;
videoEl.autoplay = true;
videoEl.style.display = 'none';
// MP4 first — required for iOS Safari (no WebM support); WebM for Chrome/Firefox
const srcMp4 = document.createElement('source');
srcMp4.src = '../assets/videos/bacarrat-stream.mp4';
srcMp4.type = 'video/mp4';
const srcWebm = document.createElement('source');
srcWebm.src = '../assets/videos/bacarrat-stream.webm';
srcWebm.type = 'video/webm';
videoEl.appendChild(srcMp4);
// videoEl.appendChild(srcWebm);
document.body.appendChild(videoEl);
videoEl.play().catch(() => { });
// iOS requires play() inside a user gesture — retry on first touch
const iosVideoUnlock = () => { videoEl.play().catch(() => { }); document.removeEventListener('touchstart', iosVideoUnlock); };
document.addEventListener('touchstart', iosVideoUnlock, { once: true });

const drawVideo = (GEOMETRY) => {
  if (videoEl.readyState < 2) return;
  const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
  if (!vw || !vh) return;

  const bp = getBreakpoint(containerWidth / window.devicePixelRatio);
  const isFullscreen = bp === 'wide' || bp === 'desktop';

  let area;
  if (isFullscreen) {
    // Full canvas — contain-fit (preserve aspect ratio, no crop)
    area = { X: 0, Y: 0, W: canvas.width, H: canvas.height };
    const s = 1//th.min(area.W / vw, area.H / vh);
    const dw = vw * s, dh = vh * s;
    const dx = (area.W - dw) / 2, dy = (area.H - dh) / 2;
    ctx.drawImage(videoEl, dx, dy, dw, dh);
  } else {
    // Top area — contain-fit within GEOMETRY.video
    area = GEOMETRY['video'];
    const s = Math.min(area.W / vw, area.H / vh);
    const dw = vw * s, dh = vh * s;
    const dx = area.X + (area.W - dw) / 2;
    const dy = area.Y + (area.H - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.X, area.Y, area.W, area.H);
    ctx.clip();
    ctx.drawImage(videoEl, dx, dy, dw, dh);
    ctx.restore();
  }
};

const font = new FontFace("Interroman", "url(/assets/fonts/Interroman.woff2)");
font.load();
document.fonts.add(font);

// --- Dimensions & DPI Scaling ---
let width = window.innerWidth;
let height = window.innerHeight;
let scale = window.devicePixelRatio;
let tileSize = Math.min(width, height) / 32;
let scrollXA = 0;
let scrollXE = 0;
let maxScrollXA = 0;
let maxScrollXE = 0;
let isTouching = false;
let screenX = 0;
let activeScrollTarget = null;
let scoreBoardBoundsA = null;
let scoreBoardBoundsE = null;
let undoBounds = null;
let cancelBounds = null;
let balance = 510000;
let bets = { player: 0, banker: 0, tie: 0, p_bonus: 0, p_pair: 0, b_bonus: 0, b_pair: 0 };
let betHistory = [];
let lastBets = {};
let playerCards = [null, null, null];
let bankerCards = [null, null, null];
let gamePhase = 'betting'; // 'betting' | 'dealing' | 'result'
let bettingCountdownStart = performance.now();
const BETTING_DURATION = 12000; // 12 seconds for demo purposes
let lastGEOMETRY = null;
let winners = [];
let phaseScheduled = false;
const fmtCurrency = (() => {
  const fmt = new Intl.NumberFormat('en', { notation: 'compact' });
  return (n) => `₱${n >= 1000 ? fmt.format(n) : n}`;
})();


const maxWidth = 800; // your max container width
const padding = 16;



let hitRegions = {};
let hoverRegion = null;
let pressedRegion = null;
let chipButtonCenter = { x: 0, y: 0, r: 0 };
let chipRowBounds = [];   // populated on desktop/wide; empty on mobile
let betChipPositions = {};
let flyingChips = [];
let activePopup = null;
let popupCardRect = null;
let popupCloseHit = null;

const REGION_INFO = {
  player: { label: 'PLAYER', odds: '0.95 : 1', desc: 'Bet on the Player hand to win.', color: '#7752ff' },
  banker: { label: 'BANKER', odds: '0.95 : 1', desc: 'Bet on the Banker hand to win.', color: '#f55858' },
  tie: { label: 'TIE', odds: '8 : 1', desc: 'Bet that both hands end in a tie.', color: '#58b373' },
  p_bonus: { label: 'P BONUS', odds: '4 : 1', desc: 'Player wins by a natural or large margin.', color: '#7752ff' },
  p_pair: { label: 'P PAIR', odds: '11 : 1', desc: "Player's first two cards are a pair.", color: '#7752ff' },
  b_bonus: { label: 'B BONUS', odds: '4 : 1', desc: 'Banker wins by a natural or large margin.', color: '#f55858' },
  b_pair: { label: 'B PAIR', odds: '11 : 1', desc: "Banker's first two cards are a pair.", color: '#f55858' },
  // chip:    { label: 'CHIP',    odds: '—',         desc: 'Select your bet denomination.',          color: '#e8c84a' },
};

let containerAvailableWidth = 0;
let containerMaxWidth = 580;
let containerWidth = containerMaxWidth;
// scrollXA / scrollXE / maxScrollXA / maxScrollXE declared above
let leftGutter = 0;

// optional height (full or constrained)
const containerY = 0;
const containerHeight = canvas.height;


const values = ["P", "B", "T"];
const results = [];
for (let i = 0; i < 30; i++) {
  const randomValue = values[Math.floor(Math.random() * values.length)];
  results.push({ value: randomValue });
}

let chips = [100, 200, 500, 1000, 5000, 10000, 20000]
let currentChipIndex = 0;
const CHIP_COLORS = [
  { fill: '#4b5563', stroke: '#9ca3af', shadow: '#d1d5db' }, // 100   - gray
  { fill: '#991b1b', stroke: '#f05454', shadow: '#fca5a5' }, // 200   - red
  { fill: '#1f7553', stroke: '#14ffa1', shadow: '#6ee7b7' }, // 500   - green
  { fill: '#0b3561', stroke: '#247cda', shadow: '#93c5fd' }, // 1000  - blue
  { fill: '#4c1d95', stroke: '#8b5cf6', shadow: '#c4b5fd' }, // 5000  - purple
  { fill: '#92400e', stroke: '#f59e0b', shadow: '#fcd34d' }, // 10000 - orange
  { fill: '#9da010', stroke: '#e8c84a', shadow: '#fdfa3d' }, // 20000 - gold
];

const chipColorIndex = (amount) =>
  amount < 200 ? 0 : amount < 500 ? 1 : amount < 1000 ? 2 :
    amount < 5000 ? 3 : amount < 10000 ? 4 : amount < 20000 ? 5 : 6;

const drawBetChip = (cx, cy, r, amount) => {
  if (amount <= 0) return;
  const color = CHIP_COLORS[chipColorIndex(amount)];
  const fmt = new Intl.NumberFormat('en', { notation: 'compact' });
  ctx.save();
  ctx.shadowColor = color.shadow;
  ctx.shadowBlur = 8 * scale;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color.fill;
  ctx.fill();
  ctx.strokeStyle = color.stroke;
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  ctx.shadowBlur = 0;
  for (let s = 0; s < 8; s++) {
    const a0 = (Math.PI * 2 / 8) * s;
    const a1 = a0 + (Math.PI * 2 / 8) * 0.55;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, a0, a1);
    ctx.arc(cx, cy, r * 0.74, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = s % 2 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = color.stroke;
  ctx.lineWidth = 1 * scale;
  ctx.stroke();
  ctx.font = `700 ${clamp(8, r * 0.52, 32)}px Interroman, Arial`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(amount >= 1000 ? fmt.format(amount) : String(amount), cx, cy);
  ctx.restore();
};


const drawCard = (x, y, w, h, r, card) => {
  const { rank, suit, dealStart, flipStart } = card;
  const now = performance.now();
  const slideT = dealStart ? Math.min((now - dealStart) / 320, 1) : 1;
  const slideEase = 1 - Math.pow(1 - slideT, 3);
  const slideOffY = (1 - slideEase) * h * 1.8;
  const flipElapsed = flipStart ? now - flipStart : Infinity;
  const flipT = Math.min(Math.max(flipElapsed / 280, 0), 1);
  const faceUp = flipT >= 0.5;
  const scaleX = Math.max(flipT < 0.5 ? 1 - flipT * 2 : (flipT - 0.5) * 2, 0.001);
  const actualY = y - slideOffY;
  ctx.save();
  ctx.globalAlpha = slideEase;
  ctx.translate(x + w / 2, actualY + h / 2);
  ctx.scale(scaleX, 1);
  ctx.translate(-w / 2, -h / 2);
  if (faceUp) {
    const isRed = suit === '♥' || suit === '♦';
    const color = isRed ? '#d42020' : '#111111';
    const cf = clamp(10, w * 0.38, 20);
    const center = clamp(16, w * 0.68, 38);
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, r);
    ctx.fillStyle = '#f8f6f0'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.5 * scale; ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = `700 ${cf}px Interroman, Arial`; ctx.fillText(rank, w * 0.1, h * 0.05);
    ctx.font = `${cf}px Interroman, Arial`; ctx.fillText(suit, w * 0.1, h * 0.05 + cf * 1.1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${center}px Interroman, Arial`; ctx.fillText(suit, w * 0.5, h * 0.5);
    ctx.save(); ctx.translate(w * 0.9, h * 0.9); ctx.rotate(Math.PI);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = `700 ${cf}px Interroman, Arial`; ctx.fillText(rank, 0, 0);
    ctx.font = `${cf}px Interroman, Arial`; ctx.fillText(suit, 0, cf * 1.1);
    ctx.restore();
  } else {
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, r);
    ctx.fillStyle = '#1a1a1a'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5 * scale; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(w * 0.1, h * 0.08, w * 0.8, h * 0.84, r * 0.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.5 * scale;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(w * i / 5, 0); ctx.lineTo(0, h * i / 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w, h * i / 5); ctx.lineTo(w * i / 5, h); ctx.stroke();
    }
  }
  ctx.restore();
};

const COLORS = {
  PRIMARYBLACK: "#000000",
  SECONDARYBLACK: "#010201",
  // SECONDARYBLACK: "#080808",

  //-- Primary Colors --
  PLAYERBLUE: "#7752ff",
  TIEGREEN: "#58b373",
  BANKERRED: "#f55858",
  //-- NEON Colors --
  NEONBLUE: "#8595f3",
  NEONGREEN: "#84eea4",
  NEONRED: "#e75d5d",


  //-- Hard Colors --
  FILLRED: "#751010",
  FILLGREEN: "#1f7553",
  FILLBLUE: "#0b3561",
  STROKERED: "#f05454e7",
  STROKEGREEN: "#14ffa1bb",
  STROKEBLUE: "#247cdae8",

  FILLSIDE: "#1b1e33",
  STROKESIDE: "#565975",
}

const clamp = (min, preferred, max) => {
  return Math.min(max, Math.max(min, preferred));
}


const getFontSize = (w, h, factor = 0.22) => {
  return Math.floor(Math.sqrt(w * h) * factor);
}

const getBreakpoint = (w) => {
  if (w >= 1440) return "wide";
  if (w >= 1280) return "desktop";
  if (w >= 768) return "tablet";
  return "mobile";
};

const computeGeometry = () => {

  const bp = getBreakpoint(containerWidth);

  let uiY = canvas.height * 0.40;
  let uiH = canvas.height * 0.60;

  const video = { X: leftGutter, Y: 0, W: containerWidth, H: uiY };

  if (bp === 'mobile') {
    // BET OPTIONS — STATS (gridE | gridA) — MENU BAR
    const betH = uiH * 0.42;
    const statH = uiH * 0.30;
    const menuH = uiH - betH - statH;
    return {
      video,
      betOptions: { X: leftGutter, Y: uiY, W: containerWidth, H: betH },
      statisticsGridE: { X: leftGutter, Y: uiY + betH, W: containerWidth * 0.5, H: statH },
      statisticsGridA: { X: leftGutter + containerWidth * 0.5, Y: uiY + betH, W: containerWidth * 0.5, H: statH },
      menuBar: { X: leftGutter, Y: uiY + betH + statH, W: containerWidth, H: menuH },
    };
  }

  if (bp === 'tablet' || bp === 'desktop') {
    // STATS (gridE | gridA) — BET OPTIONS — MENU BAR
    const statH = uiH * 0.27;
    const betH = uiH * 0.44;
    const menuH = uiH - statH - betH;
    return {
      video,
      statisticsGridE: { X: leftGutter, Y: uiY, W: containerWidth * 0.5, H: statH },
      statisticsGridA: { X: leftGutter + containerWidth * 0.5, Y: uiY, W: containerWidth * 0.5, H: statH },
      betOptions: { X: leftGutter, Y: uiY + statH, W: containerWidth, H: betH },
      menuBar: { X: leftGutter, Y: uiY + statH + betH, W: containerWidth, H: menuH },
    };
  }

  // wide: gridE sidebar | WALLET+BET OPTIONS+MENU BAR center | gridA sidebar
  uiY = canvas.height * 0.65;
  uiH = canvas.height * 0.35;
  const centerW = Math.round(containerWidth * 0.46);
  const sideW = Math.round((containerWidth - centerW) / 2);
  const walletH = uiH * 0.15;
  const betH = uiH * 0.65;
  const menuH = uiH - betH;
  return {
    video,
    statisticsGridE: { X: leftGutter, Y: uiY + walletH, W: sideW, H: betH },
    statisticsGridA: { X: leftGutter + sideW + centerW, Y: uiY + walletH, W: sideW, H: betH },
    betOptions: { X: leftGutter + sideW, Y: uiY + walletH, W: centerW, H: betH },
    menuBar: { X: leftGutter + sideW, Y: uiY + walletH + betH, W: centerW, H: menuH },
    walletBar: { X: leftGutter + sideW, Y: uiY, W: centerW, H: walletH },
  };
}

const constructGrid = (rows, cols, posX, posY, gridHeight, cellSize = 1, divX, divY) => {

  const cellH = Math.max(1, gridHeight / rows);
  const cellW = cellH;  // Math.floor(scoreBoard.W / cellW);

  // -- grid width based on  size and count of column --
  const totalWidth = cols * cellW;

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(posX, posY, totalWidth, gridHeight);

  ctx.lineWidth = 0.1 * scale;
  ctx.strokeStyle = "#000000"
  ctx.setLineDash([])
  ctx.beginPath();
  const startX = posX;
  // horizontal
  for (let i = cellSize; i < rows; i += cellSize) {
    const y = Math.round(posY + i * cellH) + 0.5;
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + totalWidth, y);
  }
  // vertical
  for (let i = cellSize; i < cols; i += cellSize) {
    const x = Math.round(posX + i * cellW) + 0.5;
    ctx.moveTo(x, posY);
    ctx.lineTo(x, posY + gridHeight);
  }
  ctx.stroke();
  return {
    rows, cols, posX, posY, gridHeight, cellW, cellH, totalWidth,
  }
}

// ─── Game Logic ──────────────────────────────────────────────────────────────
const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const randomCard = () => ({
  rank: CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)],
  suit: CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)],
});
const cardValue = (rank) => rank === 'A' ? 1 : ['10', 'J', 'Q', 'K'].includes(rank) ? 0 : parseInt(rank);
const handTotal = (cards) => cards.filter(Boolean).reduce((s, c) => (s + cardValue(c.rank)) % 10, 0);

const dealBaccaratHands = () => {
  const p = [randomCard(), randomCard(), null];
  const b = [randomCard(), randomCard(), null];
  const pTotal = handTotal(p);
  const bTotal = handTotal(b);
  if (pTotal >= 8 || bTotal >= 8) return { p, b };
  if (pTotal <= 5) p[2] = randomCard();
  if (p[2] === null) {
    if (bTotal <= 5) b[2] = randomCard();
  } else {
    const pv = cardValue(p[2].rank);
    if (bTotal <= 2) b[2] = randomCard();
    else if (bTotal === 3 && pv !== 8) b[2] = randomCard();
    else if (bTotal === 4 && [2, 3, 4, 5, 6, 7].includes(pv)) b[2] = randomCard();
    else if (bTotal === 5 && [4, 5, 6, 7].includes(pv)) b[2] = randomCard();
    else if (bTotal === 6 && [6, 7].includes(pv)) b[2] = randomCard();
  }
  return { p, b };
};

const calcWinners = (p, b) => {
  const pt = handTotal(p), bt = handTotal(b);
  const result = [];
  if (pt > bt) { result.push('player'); result.push('p_bonus'); }
  else if (bt > pt) { result.push('banker'); result.push('b_bonus'); }
  else { result.push('tie'); }
  if (p[0] && p[1] && p[0].rank === p[1].rank) result.push('p_pair');
  if (b[0] && b[1] && b[0].rank === b[1].rank) result.push('b_pair');
  return result;
};

const PAYOUTS = { player: 1, banker: 0.95, tie: 8, p_bonus: 4, p_pair: 11, b_bonus: 4, b_pair: 11 };

const applyPayouts = (winnerList) => {
  Object.keys(bets).forEach(region => {
    if (bets[region] > 0 && winnerList.includes(region)) {
      balance += bets[region] * (1 + PAYOUTS[region]);
    }
  });
};

const startNewRound = () => {
  gamePhase = 'betting';
  bettingCountdownStart = performance.now();
  phaseScheduled = false;
  playerCards = [null, null, null];
  bankerCards = [null, null, null];
  winners = [];
  bets = { player: 0, banker: 0, tie: 0, p_bonus: 0, p_pair: 0, b_bonus: 0, b_pair: 0 };
  betHistory = [];
};

const runDeal = () => {
  gamePhase = 'dealing';
  const { p, b } = dealBaccaratHands();
  const sequence = [
    ['player', 0, p[0]], ['banker', 0, b[0]],
    ['player', 1, p[1]], ['banker', 1, b[1]],
  ];
  if (p[2]) sequence.push(['player', 2, p[2]]);
  if (b[2]) sequence.push(['banker', 2, b[2]]);
  let delay = 300;
  sequence.forEach(([side, idx, card]) => {
    setTimeout(() => {
      const target = side === 'player' ? playerCards : bankerCards;
      target[idx] = { ...card, dealStart: performance.now(), flipStart: performance.now() + 280 };
    }, delay);
    delay += 620;
  });
  setTimeout(() => {
    winners = calcWinners(p, b);
    applyPayouts(winners);
    gamePhase = 'result';
    results.push({ value: winners[0].charAt(0).toUpperCase() });
    setTimeout(startNewRound, 4500);
  }, delay + 400);
};

const updateGameState = () => {
  if (gamePhase === 'betting' && !phaseScheduled) {
    const elapsed = performance.now() - bettingCountdownStart;
    if (elapsed >= BETTING_DURATION) {
      phaseScheduled = true;
      runDeal();
    }
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const drawGrid = () => {
  // --- Clear ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Background ---
  // ctx.fillStyle = "rgb(0, 0, 0)";
  // ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (gamePhase === 'result' && winners.length > 0) {
    const w = winners[0];
    const glow = (Math.sin(performance.now() * 0.0032) + 1) * 0.5; // 0..1 smooth
    const alpha = 0.02 + glow * 0.06;
    const tint = w === 'player' ? `rgba(119,82,255,${alpha})`
      : w === 'banker' ? `rgba(245,88,88,${alpha})`
        : `rgba(88,179,115,${alpha})`;
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // --- Grid ---
  const x = 0;
  const y = 0;
  const w = canvas.width;
  const h = canvas.height;
  const maxX = x + w;
  const maxY = y + h;
  const cellSize = Math.min(w, h) / 32;
  const rows = Math.ceil(h / cellSize);
  const cols = Math.ceil(w / cellSize);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.lineWidth = 0.25 * scale;
  ctx.setLineDash([]);

  // --- HORIZONTAL LINES ---
  let currentRow = y;
  for (let row = 0; row < rows; row++) {
    ctx.beginPath();
    ctx.moveTo(x, currentRow);
    ctx.lineTo(maxX, currentRow);
    currentRow += cellSize;
    ctx.stroke();
  }

  // --- VERTICAL LINES ---
  let currentCol = x;
  for (let col = 0; col < cols; col++) {
    ctx.beginPath();
    ctx.moveTo(currentCol, y);
    ctx.lineTo(currentCol, maxY);
    currentCol += cellSize;
    ctx.stroke();
  }

  // --- Crosshair Guide Lines ---
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 0.9 * scale;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(maxX / 2, y);
  ctx.lineTo(maxX / 2, maxY);
  ctx.moveTo(x, maxY / 2);
  ctx.lineTo(maxX, maxY / 2);

  ctx.stroke();

}

const drawLayout = () => {

  const GEOMETRY = computeGeometry();
  for (const [index, rect] of Object.entries(GEOMETRY)) {
    // // --- Draw RECT ---
    ctx.fillStyle = "#000000a2";
    // ctx.fillRect(
    //   rect.X,
    //   rect.Y,
    //   rect.W,
    //   rect.H
    // );
    ctx.strokeStyle = "#fcfbfba2";
    ctx.lineWidth = 0.1 * scale;
    ctx.strokeRect(
      rect.X,
      rect.Y,
      rect.W,
      rect.H
    );
    ctx.beginPath();
    ctx.moveTo(rect.X, rect.Y);
    ctx.lineTo(rect.X + rect.W, rect.Y + rect.H);
    ctx.moveTo(rect.X, rect.Y + rect.H);
    ctx.lineTo(rect.X + rect.W, rect.Y);
    ctx.stroke();

    ctx.fillStyle = "#cfc5c518";
    ctx.font = "600 32px Interroman, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      index.toUpperCase(),
      rect.X + rect.W / 2,
      rect.Y + rect.H / 2,
    );


  }
}

const drawGlassPanel = (x, y, w, h, r = 0) => {
  ctx.save();

  // semi-transparent dark fill
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = 'rgba(8, 8, 18, 0.62)';
  ctx.fill();

  // top-edge light gradient (shimmer)
  const shimmer = ctx.createLinearGradient(x, y, x, y + h * 0.35);
  shimmer.addColorStop(0, 'rgba(255,255,255,0.07)');
  shimmer.addColorStop(1, 'rgba(255,255,255,0.00)');
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = shimmer;
  ctx.fill();

  // thin border
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  ctx.restore();
};

const drawGlassPanels = (GEOMETRY) => {
  const bp = getBreakpoint(containerWidth / window.devicePixelRatio);
  const r = 6 * scale;

  const gE = GEOMETRY['statisticsGridE'];
  const gA = GEOMETRY['statisticsGridA'];
  const bo = GEOMETRY['betOptions'];
  const mb = GEOMETRY['menuBar'];
  const wb = GEOMETRY['walletBar'];

  drawGlassPanel(gE.X, gE.Y, gE.W, gE.H, r);
  drawGlassPanel(gA.X, gA.Y, gA.W, gA.H, r);
  drawGlassPanel(bo.X, bo.Y, bo.W, bo.H, r);
  drawGlassPanel(mb.X, mb.Y, mb.W, mb.H, r);
  // if (wb) drawGlassPanel(wb.X, wb.Y, wb.W, wb.H, r);
};

const drawUI = () => {

  const GEOMETRY = computeGeometry();
  lastGEOMETRY = GEOMETRY;

  drawVideo(GEOMETRY);
  drawGlassPanels(GEOMETRY);
  drawbetOptions(GEOMETRY);
  drawStatistics(GEOMETRY);
  drawMenuBar(GEOMETRY);

}

const drawbetOptions = async (GEOMETRY) => {

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = COLORS.PRIMARYBLACK
  // ctx.fillRect(
  //   0,
  //   canvas.height / 2,
  //   canvas.width,
  //   canvas.height / 2
  // );

  if (gamePhase === 'result' && winners.length > 0) {
    const w = winners[0];
    const glow = (Math.sin(performance.now() * 0.0032) + 1) * 0.5;
    const alpha = 0.06 + glow * 0.20;
    const tint = w === 'player' ? `rgba(119,82,255,${alpha})`
      : w === 'banker' ? `rgba(245,88,88,${alpha})`
        : `rgba(88,179,115,${alpha})`;
    // const tint = w === 'player' ? COLORS.FILLBLUE
    //   : w === 'banker' ? COLORS.FILLRED
    //     : COLORS.FILLGREEN;
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const arcRadius = Math.min(GEOMETRY['betOptions'].W * 0.2, GEOMETRY['betOptions'].H * 0.5)
  const angle = Math.PI / 90
  const betOptionsGap = 7 * scale

  const borderRadius = GEOMETRY['betOptions'].H * 0.15;
  const borderWidth = 2.5 * scale;

  const hRef = GEOMETRY['betOptions'].H / scale;
  const mainBetfontSize = clamp(11, hRef * 0.10, 18) * scale;
  const sideBetfontSize = clamp(9, hRef * 0.075, 14) * scale;

  const progressBarW = GEOMETRY['betOptions'].W * 0.2;
  const progressBarH = 2 * scale;
  const progressBarR = 10;
  const betChipR = GEOMETRY['betOptions'].H * 0.07;
  ctx.setLineDash([])

  ctx.roundRect(
    GEOMETRY['betOptions'].X,
    GEOMETRY['betOptions'].Y,
    GEOMETRY['betOptions'].W,
    GEOMETRY['betOptions'].H,
    borderRadius * 1.1
  );
  ctx.strokeStyle = "#00000059";
  ctx.lineWidth = 2 * scale;
  // ctx.stroke();

  // ────────────────────────────────────────────────────────────────────────────────────────────────
  // PLAYER
  // ────────────────────────────────────────────────────────────────────────────────────────────────
  const player = {
    X: GEOMETRY['betOptions'].X + betOptionsGap,
    Y: GEOMETRY['betOptions'].Y + betOptionsGap,
    TW: GEOMETRY['betOptions'].W * 0.5 - betOptionsGap * 2,
    RH: (GEOMETRY['betOptions'].H * 0.65) * 0.35 - tileSize,
    LH: (GEOMETRY['betOptions'].H * 0.65) - betOptionsGap,
    CX: GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.5,
    CY: GEOMETRY['betOptions'].Y + GEOMETRY['betOptions'].H * 0.65,
    R: arcRadius,
  }


  const playerStartAngle = Math.atan2(player.Y - player.CY, (player.X + player.TW) - player.CX + betOptionsGap * 0.25);
  const playerArcX = player.CX + player.R * Math.cos(playerStartAngle);

  const playerCardsG = 5 * scale
  const playerCardW = clamp(20 * scale, (player.TW - player.R) * 0.2, 32 * scale);
  const playerCardH = playerCardW * (4 / 3);
  const playerCardR = 2 * scale;

  const totalCardWidth = ((playerCardW + playerCardsG) * 3)

  const playerCardsX = GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.25 - totalCardWidth;
  const playerCardsY = player.Y + (player.LH) * 0.40;


  // -- Button --
  const playerShape = new Path2D();
  playerShape.moveTo(playerArcX, player.Y);
  playerShape.arc(player.CX, player.CY, player.R, playerStartAngle, Math.PI, true);
  playerShape.lineTo(player.X, player.Y + player.LH);
  playerShape.arc(player.X + borderRadius, player.Y + borderRadius, borderRadius, angle * 90, -angle * 45, false);
  playerShape.closePath();
  hitRegions.player = playerShape;

  ctx.save();
  const betting = gamePhase === 'betting';
  const playerWin = gamePhase === 'result' && winners.includes('player');
  const playerBlink = playerWin && Math.sin(performance.now() * 0.006) > 0;
  ctx.shadowColor = COLORS.STROKEBLUE;
  ctx.shadowBlur = playerWin ? (playerBlink ? 50 * scale : 6 * scale) : betting && bets.player > 0 ? 18 * scale : 0;
  ctx.strokeStyle = playerBlink ? '#ffffff' : COLORS.STROKEBLUE;
  ctx.lineWidth = (betting && bets.player > 0) || playerWin ? borderWidth * 1.8 : borderWidth;
  ctx.stroke(playerShape);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.FILLBLUE;
  ctx.fill(playerShape);
  if (playerBlink) { ctx.fillStyle = 'rgba(119,82,255,0.38)'; ctx.fill(playerShape); }
  if (betting && pressedRegion === 'player') { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(playerShape); }
  ctx.restore();


  // -- Name --
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize}px Interroman, Arial`
  ctx.fillText('PLAYER', player.X + player.TW * 0.5 - player.R * 0.5, player.Y + player.LH * 0.2);

  // -- Odds --
  ctx.fillStyle = "#fff";
  ctx.font = `300 ${mainBetfontSize * 0.75}px Interroman, Arial`
  ctx.fillText('0.95:1', player.X + player.TW * 0.5 - player.R * 0.5, player.Y + player.LH * 0.325);

  if (gamePhase !== 'result') drawBetChip(player.X + player.TW * 0.35, player.Y + player.LH * 0.55, betChipR, bets.player);

  // -- Cards --
  playerCards.forEach((card, i) => {
    const cx = playerCardsX + i * (playerCardW + playerCardsG);
    if (card) {
      drawCard(cx, playerCardsY, playerCardW, playerCardH, playerCardR, card);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx, playerCardsY, playerCardW, playerCardH, playerCardR);
      ctx.fillStyle = 'rgba(117,110,110,0.18)';
      // ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1 * scale;
      // ctx.stroke();
      ctx.restore();
    }
  });

  // -- Total Bets --
  ctx.fillStyle = "#d6dbb7";
  ctx.beginPath();
  ctx.arc(player.X + player.TW * 0.5 - player.R, player.CY - player.R * 0.19, 7, Math.PI * 45, 0, false)
  ctx.fill();
  ctx.beginPath()
  ctx.arc(player.X + player.TW * 0.5 - player.R, player.CY - player.R * 0.28, 4, Math.PI * 2, 0, false)
  ctx.closePath()
  ctx.closePath()
  ctx.fill();
  ctx.font = `600 ${mainBetfontSize * 0.5}px Interroman, Arial`
  ctx.fillText('12', player.X + player.TW * 0.57 - player.R, (player.CY - player.R * 0.225));

  // Percentage
  ctx.textAlign = "end"
  ctx.fillStyle = "#d6dbb7";

  ctx.font = `600 ${mainBetfontSize * 0.5}px Interroman, Arial`
  ctx.fillText('₱1,233,990', player.X + player.TW * 0.5, player.CY - player.R * 0.225);
  betChipPositions.player = { x: player.X + player.TW * 0.35, y: player.Y + player.LH * 0.55, r: betChipR };
  ctx.arc(player.X + player.TW * 0.5, player.CY - player.R * 0.28, tileSize * 0.15, Math.PI * 2, 0, false)


  ctx.beginPath();
  ctx.fillStyle = "#00000079"
  ctx.roundRect(player.X + player.TW * 0.5 - player.R, player.CY - player.R * 0.15, progressBarW, progressBarH, progressBarR);
  ctx.closePath();
  ctx.fill()


  ctx.beginPath();
  ctx.fillStyle = COLORS.PLAYERBLUE

  ctx.save();
  ctx.shadowColor = COLORS.NEONBLUE;
  ctx.shadowBlur = 5;

  ctx.roundRect(
    player.X + player.TW * 0.5 - player.R,
    player.CY - player.R * 0.15,
    progressBarW * 0.5,
    progressBarH,
    progressBarR
  );

  ctx.fill();

  ctx.restore();


  // ────────────────────────────────────────────────────────────────────────────────────────────────
  // BANKER
  // ────────────────────────────────────────────────────────────────────────────────────────────────
  const banker = {
    X: GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.5 + betOptionsGap,
    Y: GEOMETRY['betOptions'].Y + betOptionsGap,
    TW: GEOMETRY['betOptions'].W * 0.5 - betOptionsGap * 2,
    LH: (GEOMETRY['betOptions'].H * 0.65) * 0.35 - tileSize,
    RH: (GEOMETRY['betOptions'].H * 0.65) - betOptionsGap,
    CX: GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.5,
    CY: GEOMETRY['betOptions'].Y + GEOMETRY['betOptions'].H * 0.65,
    R: arcRadius,
  }

  const bankerStartAngle = Math.atan2(banker.Y - banker.CY, banker.X - banker.CX - betOptionsGap * 0.25);
  const bankerArcX = banker.CX + banker.R * Math.cos(bankerStartAngle);
  const bankerArcY = banker.CY + banker.R * Math.sin(bankerStartAngle);

  const bankerCardsG = 5 * scale
  const bankerCardW = clamp(20 * scale, (banker.TW - banker.R) * 0.2, 33 * scale);
  const bankerCardH = bankerCardW * (4 / 3);
  const bankerCardR = 2 * scale;

  // ******** MIRRORS: const playerCardsX = GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.25 - totalCardWidth;
  const bankerCardsOffset = GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W - (bankerCardW)
  const bankerCardsX = bankerCardsOffset - GEOMETRY['betOptions'].W * 0.25 + totalCardWidth
  const bankerCardsY = banker.Y + (banker.RH) * 0.40;

  const bankerShape = new Path2D();
  bankerShape.moveTo(bankerArcX, banker.Y);
  bankerShape.arc(banker.CX, banker.CY, banker.R, bankerStartAngle, 0, false);
  bankerShape.lineTo(banker.X + banker.TW, banker.Y + banker.RH);
  bankerShape.arc(banker.X + banker.TW - borderRadius, banker.Y + borderRadius, borderRadius, angle * 0, -angle * 45, true);
  bankerShape.closePath();
  hitRegions.banker = bankerShape;

  ctx.save();
  const bankerWin = gamePhase === 'result' && winners.includes('banker');
  const bankerBlink = bankerWin && Math.sin(performance.now() * 0.006) > 0;
  ctx.shadowColor = COLORS.STROKERED;
  ctx.shadowBlur = bankerWin ? (bankerBlink ? 50 * scale : 6 * scale) : betting && bets.banker > 0 ? 18 * scale : 0;
  ctx.strokeStyle = bankerBlink ? '#ffffff' : COLORS.STROKERED;
  ctx.lineWidth = (betting && bets.banker > 0) || bankerWin ? borderWidth * 1.8 : borderWidth;
  ctx.stroke(bankerShape);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.FILLRED;
  ctx.fill(bankerShape);
  if (bankerBlink) { ctx.fillStyle = 'rgba(245,88,88,0.38)'; ctx.fill(bankerShape); }
  if (betting && pressedRegion === 'banker') { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(bankerShape); }
  ctx.restore();

  // -- Name --
  ctx.textAlign = `center`
  ctx.font = `600 ${mainBetfontSize}px Interroman, Arial`
  ctx.fillStyle = "#d6dbb7";
  ctx.fillText('BANKER', banker.X + banker.TW / 2 + banker.R / 2, banker.Y + banker.RH * 0.2);

  // -- Odds --
  ctx.fillStyle = "#ffffff";
  ctx.font = `300 ${mainBetfontSize * 0.7}px Interroman, Arial`
  ctx.fillText('0.95:1', banker.X + banker.TW / 2 + banker.R / 2, banker.Y + banker.RH * 0.325);


  if (gamePhase !== 'result') drawBetChip(banker.X + banker.TW * 0.65, banker.Y + banker.RH * 0.55, betChipR, bets.banker);

  // -- Cards --
  bankerCards.forEach((card, i) => {
    const cx = bankerCardsX - i * (bankerCardW + bankerCardsG);
    if (card) {
      drawCard(cx, bankerCardsY, bankerCardW, bankerCardH, bankerCardR, card);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx, bankerCardsY, bankerCardW, bankerCardH, bankerCardR);
      ctx.fillStyle = 'rgba(117,110,110,0.18)';
      // ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1 * scale;
      // ctx.stroke();
      ctx.restore();
    }
  });


  // -- Total Bets --
  ctx.fillStyle = "#d6dbb7";
  ctx.beginPath();
  ctx.arc(banker.X + banker.TW * 0.5, banker.CY - banker.R * 0.19, 7, Math.PI * 45, 0, false)
  ctx.fill();
  ctx.closePath()
  ctx.beginPath()
  ctx.arc(banker.X + banker.TW * 0.5, banker.CY - banker.R * 0.28, 4, Math.PI * 2, 0, false)
  ctx.closePath()
  ctx.fill();
  ctx.textAlign = `start`
  ctx.font = `600 ${mainBetfontSize * 0.5}px Interroman, Arial`
  ctx.fillText('12', banker.X + banker.TW * 0.53, (banker.CY - banker.R * 0.225));


  // Percentage
  ctx.textAlign = "end"
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize * 0.5}px Interroman, Arial`
  ctx.fillText('₱1,233,990', banker.X + banker.TW * 0.5 + banker.R, banker.CY - banker.R * 0.225);
  betChipPositions.banker = { x: banker.X + banker.TW * 0.65, y: banker.Y + banker.RH * 0.55, r: betChipR };


  ctx.beginPath();
  ctx.fillStyle = "#00000079"
  ctx.roundRect(banker.X + banker.TW * 0.5 + banker.R - progressBarW, banker.CY - banker.R * 0.15, progressBarW, progressBarH, progressBarR);
  ctx.closePath();
  ctx.fill()

  ctx.beginPath();
  ctx.fillStyle = COLORS.BANKERRED

  ctx.save();
  ctx.shadowColor = COLORS.NEONRED;
  ctx.shadowBlur = 5;
  ctx.roundRect(banker.X + banker.TW * 0.5 + banker.R - progressBarW, banker.CY - banker.R * 0.15, progressBarW * 0.5, progressBarH, progressBarR);

  ctx.fill();

  ctx.restore();



  // ────────────────────────────────────────────────────────────────────────────────────────────────
  // TIE
  // ────────────────────────────────────────────────────────────────────────────────────────────────
  const tie = {
    CX: GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.5,
    CY: GEOMETRY['betOptions'].Y + GEOMETRY['betOptions'].H * 0.65,
    R: arcRadius - betOptionsGap,
  }
  const tieShape = new Path2D();
  tieShape.arc(tie.CX, tie.CY, tie.R, angle * 90, angle * 0, false);
  tieShape.closePath();
  hitRegions.tie = tieShape;

  ctx.save();
  const tieWin = gamePhase === 'result' && winners.includes('tie');
  const tieBlink = tieWin && Math.sin(performance.now() * 0.006) > 0;
  ctx.shadowColor = COLORS.STROKEGREEN;
  ctx.shadowBlur = tieWin ? (tieBlink ? 50 * scale : 6 * scale) : betting && bets.tie > 0 ? 18 * scale : 0;
  ctx.strokeStyle = tieBlink ? '#ffffff' : COLORS.STROKEGREEN;
  ctx.lineWidth = (betting && bets.tie > 0) || tieWin ? borderWidth * 1.8 : borderWidth;
  ctx.stroke(tieShape);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.FILLGREEN;
  ctx.fill(tieShape);
  if (tieBlink) { ctx.fillStyle = 'rgba(88,179,115,0.38)'; ctx.fill(tieShape); }
  if (betting && pressedRegion === 'tie') {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill(tieShape);
  }
  ctx.restore();


  // -- Name --
  ctx.textAlign = `center`
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize}px Interroman, Arial`
  ctx.fillText('TIE', tie.CX, tie.CY - (tie.R * 0.55));

  // -- Odds --
  ctx.fillStyle = "#ffffff";
  ctx.font = `300 ${mainBetfontSize * 0.75}px Interroman, Arial`
  ctx.fillText('8:1', tie.CX, tie.CY - tie.R * 0.75);

  // -- Total Bets --
  ctx.fillStyle = "#d6dbb7";
  ctx.beginPath();
  ctx.arc(tie.CX - progressBarW / 2, tie.CY - tie.R * 0.19, 7, Math.PI * 45, 0, false)
  ctx.fill();
  ctx.closePath()
  ctx.beginPath()
  ctx.arc(tie.CX - progressBarW / 2, tie.CY - tie.R * 0.28, 4, Math.PI * 2, 0, false)
  ctx.closePath()
  ctx.fill();
  ctx.font = `600 ${mainBetfontSize * 0.5}px Interroman, Arial`
  ctx.fillText('12', tie.CX - progressBarW / 3, (tie.CY - tie.R * 0.225));

  ctx.font = `600 ${mainBetfontSize * 0.5}px Interroman, Arial`
  ctx.textAlign = "end"
  ctx.fillText('₱220,330', tie.CX + progressBarW / 2, tie.CY - tie.R * 0.225);
  betChipPositions.tie = { x: tie.CX, y: tie.CY - tie.R * 0.35, r: betChipR };
  if (gamePhase !== 'result') drawBetChip(tie.CX, tie.CY - tie.R * 0.35, betChipR, bets.tie);

  // Percentage
  ctx.beginPath();
  ctx.fillStyle = "#00000079"
  ctx.roundRect(tie.CX - progressBarW * 0.5, tie.CY - tie.R * 0.15, progressBarW, progressBarH, progressBarR);
  ctx.roundRect(tie.CX - progressBarW * 0.5, tie.CY - tie.R * 0.15, progressBarW, progressBarH, progressBarR);
  ctx.closePath();
  ctx.fill()

  ctx.beginPath();
  ctx.fillStyle = COLORS.TIEGREEN


  ctx.save();
  ctx.shadowColor = COLORS.NEONGREEN;
  ctx.shadowBlur = 5;
  ctx.roundRect(tie.CX - progressBarW * 0.5, tie.CY - tie.R * 0.15, progressBarW * 0.15, progressBarH, progressBarR);
  ctx.fill();

  ctx.restore();


  ctx.textAlign = "center"

  // Scores — drawn after TIE so they render on top of it
  if (gamePhase === 'result') {
    const pTotal = handTotal(playerCards);
    const bTotal = handTotal(bankerCards);
    const scoreFs = clamp(24, hRef * 0.40, 58) * scale;
    const scorePad = betOptionsGap;
    const glow = gamePhase === 'result' ? (Math.sin(performance.now() * 0.0032) + 1) * 0.5 : 0.5;

    ctx.save();
    ctx.font = `900 ${scoreFs}px Interroman, Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';

    ctx.shadowColor = COLORS.NEONBLUE;
    ctx.shadowBlur = (10 + glow * 18) * scale;
    ctx.textAlign = 'end';
    ctx.fillText(String(pTotal), player.X + player.TW - scorePad, player.Y + scorePad * 0.5);

    ctx.shadowColor = COLORS.NEONRED;
    ctx.textAlign = 'start';
    ctx.fillText(String(bTotal), banker.X + scorePad, banker.Y + scorePad * 0.5);

    ctx.restore();
  }

  // ────────────────────────────────────────────────────────────────────────────────────────────────
  // SIDEBETS
  // ────────────────────────────────────────────────────────────────────────────────────────────────
  let sideX = GEOMETRY['betOptions'].X + betOptionsGap;
  let sideBets = ['P_BONUS', 'P_PAIR', 'B_BONUS', 'B_PAIR']
  sideBets.forEach((side, index) => {
    const sideBet = {
      X: sideX,
      Y: GEOMETRY['betOptions'].Y + GEOMETRY['betOptions'].H * 0.65 + betOptionsGap,
      W: (GEOMETRY['betOptions'].W - betOptionsGap * (sideBets.length + 1)) / sideBets.length,
      H: (GEOMETRY['betOptions'].H * 0.3),
    }
    const sideShape = new Path2D();
    ctx.strokeStyle = COLORS.STROKESIDE
    ctx.fillStyle = COLORS.FILLSIDE;
    ctx.lineWidth = borderWidth;
    ctx.beginPath();
    if (index === 0) {
      sideShape.moveTo(sideBet.X, sideBet.Y);
      sideShape.lineTo(sideBet.X + sideBet.W, sideBet.Y);
      sideShape.lineTo(sideBet.X + sideBet.W, sideBet.Y + sideBet.H);
      sideShape.arc(sideBet.X + borderRadius, sideBet.Y + sideBet.H - borderRadius, borderRadius, angle * 45, angle * 90, false)
    } else if (index === sideBets.length - 1) {
      sideShape.moveTo(sideBet.X, sideBet.Y);
      sideShape.lineTo(sideBet.X + sideBet.W, sideBet.Y);
      sideShape.arc(sideBet.X + sideBet.W - borderRadius, sideBet.Y + sideBet.H - borderRadius, borderRadius, angle * 0, angle * 45, false)
      sideShape.lineTo(sideBet.X, sideBet.Y + sideBet.H);
    } else {
      sideShape.moveTo(sideBet.X, sideBet.Y);
      sideShape.lineTo(sideBet.X + sideBet.W, sideBet.Y);
      sideShape.lineTo(sideBet.X + sideBet.W, sideBet.Y + sideBet.H);
      sideShape.lineTo(sideBet.X, sideBet.Y + sideBet.H);
    }
    sideShape.closePath();
    hitRegions[side] = sideShape;
    const sideBetKey = side.toLowerCase();
    ctx.save();
    const sideWin = gamePhase === 'result' && winners.includes(sideBetKey);
    const sideBlink = sideWin && Math.sin(performance.now() * 0.006) > 0;
    ctx.shadowColor = COLORS.STROKESIDE;
    ctx.shadowBlur = sideWin ? (sideBlink ? 44 * scale : 5 * scale) : bets[sideBetKey] > 0 ? 14 * scale : 0;
    ctx.strokeStyle = sideBlink ? '#ffffff' : bets[sideBetKey] > 0 || sideWin ? '#ffffff88' : COLORS.STROKESIDE;
    ctx.lineWidth = bets[sideBetKey] > 0 || sideWin ? borderWidth * 1.5 : borderWidth;
    ctx.stroke(sideShape);
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.FILLSIDE;
    ctx.fill(sideShape);
    if (sideBlink) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill(sideShape); }
    if (pressedRegion === sideBetKey) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(sideShape); }
    ctx.restore();


    // -- Name --
    ctx.fillStyle = "#d6dbb7";
    ctx.font = `600 ${sideBetfontSize}px Interroman, Arial`
    ctx.fillText(side.replace(/_/g, ' '), sideBet.X + sideBet.W * 0.5, sideBet.Y + sideBet.H * 0.40);

    // -- Odds --
    ctx.fillStyle = "#ffffff";
    ctx.font = `300 ${sideBetfontSize * 0.85}px Interroman, Arial`
    ctx.fillText('04:20', sideBet.X + sideBet.W * 0.5, sideBet.Y + sideBet.H * 0.70);
    betChipPositions[side.toLowerCase()] = { x: sideBet.X + sideBet.W * 0.5, y: sideBet.Y + sideBet.H * 0.5, r: sideBet.H * 0.28 };
    if (gamePhase !== 'result') drawBetChip(sideBet.X + sideBet.W * 0.5, sideBet.Y + sideBet.H * 0.5, sideBet.H * 0.28, bets[side.toLowerCase()]);



    sideX += sideBet.W + betOptionsGap
  });
}

const drawStatistics = (GEOMETRY) => {

  ctx.setLineDash([])

  const gE = GEOMETRY['statisticsGridE'];
  const gA = GEOMETRY['statisticsGridA'];

  const summaryRatio = 0.20
  const scoreBoardRatio = 1 - summaryRatio

  // Combined bounding box for the summary bar
  const statX = Math.min(gE.X, gA.X);
  const statY = gE.Y//Math.min(gE.Y, gA.Y);
  const statW = Math.max(gE.X + gE.W, gA.X + gA.W) - statX;
  const statH = Math.max(gE.H, gA.H);

  // In wide layout the two panels have a gap between them — cap summary to gridE only
  const isWide = gA.X > gE.X + gE.W + 1;

  // --- Summary ---
  const summary = {
    X: statX,
    Y: statY,
    W: isWide ? gE.W : statW,
    H: statH * summaryRatio,
  }

  ctx.fillStyle = COLORS.PRIMARYBLACK;
  // ctx.fillRect(gE.X, gE.Y, gE.W, gE.H);
  // ctx.fillRect(gA.X, gA.Y, gA.W, gA.H);


  // -- Fetch the Data here


  const stats = {
    gameNo: { bg: null, hasIcon: false, value: 42 },
    playerTotal: { bg: COLORS.PLAYERBLUE, hasIcon: true, value: 22 },
    bankerTotal: { bg: COLORS.BANKERRED, hasIcon: true, value: 16 },
    tieTotal: { bg: COLORS.TIEGREEN, hasIcon: true, value: 4 },
    playerPairTotal: { bg: COLORS.PLAYERBLUE, hasIcon: true, value: 3 },
    bankerPairTotal: { bg: COLORS.BANKERRED, hasIcon: true, value: 3 },
    playerPrediction: { bg: COLORS.PLAYERBLUE, hasIcon: true, value: 3 },
    bankerPrediction: { bg: COLORS.BANKERRED, hasIcon: true, value: 3 },
  }
  const cols = Object.keys(stats).length;


  // Slot-based layout: divide summary.W into equal slots so items always fit
  const slotW = summary.W / cols;
  const radius = Math.min(summary.H * 0.26, slotW * 0.28);
  const fontSz = clamp(9 * scale, radius * 0.95, 12 * scale);

  ctx.save();
  ctx.beginPath();
  ctx.rect(summary.X, summary.Y, summary.W, summary.H);
  ctx.clip();

  const pad = slotW * 0.10;

  let slotIndex = 0;
  for (const [key, obj] of Object.entries(stats)) {
    const slotX = summary.X + slotIndex * slotW;
    const slotCY = summary.Y + summary.H * 0.5;

    ctx.textBaseline = 'middle';

    if (['playerTotal', 'bankerTotal', 'tieTotal', 'playerPairTotal', 'bankerPairTotal'].includes(key)) {
      const circleCX = slotX + pad + radius;
      ctx.beginPath();
      ctx.arc(circleCX, slotCY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = stats[key].bg;
      ctx.fill();
      ctx.font = `600 ${fontSz}px Interroman, Arial`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      const label = ['playerTotal', 'bankerTotal', 'tieTotal'].includes(key)
        ? key.toUpperCase()[0]
        : (key === 'playerPairTotal' ? 'PP' : 'BP');
      ctx.fillText(label, circleCX, slotCY);
      ctx.textAlign = 'start';
      ctx.fillText(obj.value, circleCX + radius + pad, slotCY);

    } else if (key === 'gameNo') {
      ctx.font = `600 ${fontSz}px Interroman, Arial`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'start';
      ctx.fillText(`#${obj.value}`, slotX + pad, slotCY);

    } else if (['playerPrediction', 'bankerPrediction'].includes(key)) {
      const predW = slotW - pad * 2;
      const predH = summary.H * 0.50;
      const predX = slotX + pad;
      const predY = summary.Y + (summary.H - predH) * 0.5;
      const predR = Math.min(predW * 0.14, predH * 0.22);
      const isP = key === 'playerPrediction';

      ctx.beginPath();
      ctx.roundRect(predX, predY, predW, predH, 4);
      ctx.fillStyle = isP ? COLORS.FILLBLUE : COLORS.FILLRED;
      ctx.fill();
      ctx.strokeStyle = isP ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      ctx.font = `600 ${fontSz}px Interroman, Arial`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(isP ? 'P' : 'B', predX + predW * 0.14, slotCY);

      ctx.beginPath();
      ctx.arc(predX + predW * 0.38, slotCY, predR, 0, Math.PI * 2);
      ctx.strokeStyle = isP ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(predX + predW * 0.60, slotCY, predR, 0, Math.PI * 2);
      ctx.fillStyle = isP ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(predX + predW * 0.78, slotCY + predR * 0.6);
      ctx.lineTo(predX + predW * 0.90, slotCY - predR * 0.3);
      ctx.strokeStyle = isP ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.stroke();
    }

    slotIndex++;
  }

  ctx.restore();





  // --- Scoreboards (one per grid) ---
  const scoreBoardE = {
    X: gE.X,
    Y: gE.Y + gE.H * summaryRatio,
    W: gE.W,
    H: gE.H * scoreBoardRatio,
  };
  const scoreBoardA = {
    X: gA.X,
    Y: gA.Y + gA.H * summaryRatio,
    W: gA.W,
    H: gA.H * scoreBoardRatio,
  };
  scoreBoardBoundsA = { X: scoreBoardA.X, Y: scoreBoardA.Y, W: scoreBoardA.W, H: scoreBoardA.H };
  scoreBoardBoundsE = { X: scoreBoardE.X, Y: scoreBoardE.Y, W: scoreBoardE.W, H: scoreBoardE.H };




  // --- SCROLLABLE START -********************************************************************************

  // Build Big Road logical columns: same outcome stacks down; different outcome → new column;
  // dragon tail (column full at 6 rows) → new column same value; ties noted on current entry.
  const bigRoadCols = [];
  {
    let lastNonTie = null;
    for (const r of results) {
      if (r.value === 'T') {
        if (bigRoadCols.length > 0) {
          const c = bigRoadCols[bigRoadCols.length - 1];
          c[c.length - 1].ties = (c[c.length - 1].ties || 0) + 1;
        }
        continue;
      }
      const newCol = !lastNonTie
        || r.value !== lastNonTie
        || bigRoadCols[bigRoadCols.length - 1].length >= 6;
      if (newCol) bigRoadCols.push([{ value: r.value, ties: 0 }]);
      else bigRoadCols[bigRoadCols.length - 1].push({ value: r.value, ties: 0 });
      lastNonTie = r.value;
    }
  }

  // Derived road helper — offset: 1=BigEye, 2=SmallRoad, 3=Cockroach
  // startCol: full-col offset in grid for this section (0, cols/3, cols*2/3)
  const renderDerivedRoad = (grid, offset, startCol, drawEntry) => {
    const { posX, posY, cellW, cellH, cols, rows } = grid;
    const maxHalfCols = Math.floor(cols / 3) * 2;
    const maxHalfRows = (rows - 6) * 2;
    let hc = 0;

    for (let c = offset; c < bigRoadCols.length; c++) {
      if (hc >= maxHalfCols) break;
      const col = bigRoadCols[c];

      for (let r = 0; r < col.length; r++) {
        if (r >= maxHalfRows) break;
        let isRed;
        if (r === 0) {
          const prevLen = bigRoadCols[c - 1]?.length ?? 0;
          const refLen = bigRoadCols[c - offset - 1]?.length ?? -1;
          isRed = refLen >= 0 && prevLen === refLen;
        } else {
          const refCol = bigRoadCols[c - offset];
          isRed = refCol ? refCol.length > r : false;
        }
        const x = posX + (startCol + hc * 0.5) * cellW;
        const y = posY + (6 + r * 0.5) * cellH;
        const cx = x + cellW * 0.25;
        const cy = y + cellH * 0.25;
        drawEntry(cx, cy, cellW * 0.18, isRed);
      }
      hc++;
    }
  };

  const populateBeadRoad = (grid) => {
    const { rows, cols, posX, posY, cellW, cellH } = grid;
    results.forEach((result, index) => {
      const col = Math.floor(index / rows);
      const row = index % rows;
      const cx = posX + col * cellW + cellW / 2;
      const cy = posY + row * cellH + cellH / 2;
      const r = cellW * 0.45;
      const bg = result.value === 'P' ? COLORS.PLAYERBLUE
        : result.value === 'B' ? COLORS.BANKERRED : COLORS.TIEGREEN;
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2, false); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${clamp(12, cellW / 2, radius * 2)}px Interroman, Arial`;
      ctx.fillText(result.value, cx, cy);
    });
  };

  const populateBigRoad = (grid) => {
    const { posX, posY, cellW, cellH, cols } = grid;
    bigRoadCols.forEach((col, ci) => {
      if (ci >= cols) return;
      col.forEach((entry, ri) => {
        const cx = posX + ci * cellW + cellW * 0.5;
        const cy = posY + ri * cellH + cellH * 0.5;
        const r = cellW * 0.4;
        const color = entry.value === 'P' ? COLORS.PLAYERBLUE : COLORS.BANKERRED;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2, false); ctx.closePath();
        ctx.strokeStyle = color; ctx.lineWidth = 1.6 * scale; ctx.stroke();
        // Ties: green diagonal slash through circle
        if (entry.ties > 0) {
          ctx.save();
          ctx.strokeStyle = COLORS.TIEGREEN; ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.65, cy + r * 0.65);
          ctx.lineTo(cx + r * 0.65, cy - r * 0.65);
          ctx.stroke();
          ctx.restore();
        }
      });
    });
  };

  const populateBigEye = (grid) => {
    renderDerivedRoad(grid, 1, 0, (cx, cy, r, isRed) => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = isRed ? 'rgba(220,50,50,0.90)' : 'rgba(60,120,220,0.90)';
      ctx.lineWidth = 0.6 * scale; ctx.stroke();
    });
  };

  const populateSmallEye = (grid) => {
    renderDerivedRoad(grid, 2, Math.floor(grid.cols / 3), (cx, cy, r, isRed) => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = isRed ? 'rgba(220,50,50,0.85)' : 'rgba(60,120,220,0.85)';
      ctx.fill();
    });
  };

  const populateCockroach = (grid) => {
    renderDerivedRoad(grid, 3, Math.floor(grid.cols * 2 / 3), (cx, cy, r, isRed) => {
      ctx.save();
      ctx.strokeStyle = isRed ? 'rgba(220,50,50,0.90)' : 'rgba(60,120,220,0.90)';
      ctx.lineWidth = 0.7 * scale;
      ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4);
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
      ctx.restore();
    });
  };
  // --- gridA (Big Road) ---
  ctx.save();
  ctx.beginPath();
  ctx.rect(scoreBoardA.X, scoreBoardA.Y, scoreBoardA.W, scoreBoardA.H);
  ctx.clip();
  ctx.translate(-scrollXA, 0);
  const gridA = constructGrid(9, 27, scoreBoardA.X, scoreBoardA.Y, scoreBoardA.H, 1, 3, 6);
  populateBigRoad(gridA);
  populateBigEye(gridA);
  populateSmallEye(gridA);
  populateCockroach(gridA);
  ctx.restore();
  const trailA = scoreBoardA.W * 0.35;
  maxScrollXA = Math.max(0, gridA.totalWidth - scoreBoardA.W + trailA);

  // --- gridE (Bead Road) ---
  ctx.save();
  ctx.beginPath();
  ctx.rect(scoreBoardE.X, scoreBoardE.Y, scoreBoardE.W, scoreBoardE.H);
  ctx.clip();
  ctx.translate(-scrollXE, 0);
  const gridE = constructGrid(6, 18, scoreBoardE.X, scoreBoardE.Y, scoreBoardE.H, 1);
  populateBeadRoad(gridE);
  ctx.restore();
  const trailE = scoreBoardE.W * 0.35;
  maxScrollXE = Math.max(0, gridE.totalWidth - scoreBoardE.W + trailE);
  // --- SCROLLABLE END ********************************************************************************

}

const drawMenuBar = (GEOMETRY) => {

  ctx.setLineDash([])

  // --- Main ---
  const main = {
    X: GEOMETRY['menuBar'].X,
    Y: GEOMETRY['menuBar'].Y,
    W: GEOMETRY['menuBar'].W,
    H: GEOMETRY['menuBar'].H * 0.5,
  }

  ctx.fillStyle = COLORS.FILLBLUE;
  // ctx.fillRect(GEOMETRY['menuBar'].X, GEOMETRY['menuBar'].Y, GEOMETRY['menuBar'].W, GEOMETRY['menuBar'].H);

  // ctx.setLineDash([5, 5])
  // ctx.beginPath()
  // ctx.moveTo(main.X, main.Y)
  // ctx.lineTo(main.X + main.W, main.Y)

  // ctx.moveTo(main.X, main.Y + main.H)
  // ctx.lineTo(main.X + main.W, main.Y + main.H)
  // ctx.strokeStyle = "#fff"
  // ctx.lineWidth = 2 * scale;
  // ctx.setLineDash([5, 5])

  ctx.beginPath();
  ctx.moveTo(main.X, main.Y + 10)
  const angle = Math.PI / 90;
  const radius = main.H * 0.40;
  const diameter = radius * 2;



  // ctx.arc(main.X + main.W * 0.10, main.Y + radius + 10, radius, -angle * 45, angle * 0, false)
  // ctx.arc(main.X + main.W * 0.10 + diameter, main.Y + radius, radius, angle * 87, angle * 45, true)
  // ctx.arc(main.X + main.W * 0.90 - diameter, main.Y + radius, radius, angle * 45, angle * 3, true)
  // ctx.arc(main.X + main.W * 0.90, main.Y + radius + 10, radius, -angle * 90, -angle * 45, false)
  // ctx.lineTo(main.X + main.W, main.Y + 10)
  // ctx.strokeStyle = "#1f1f1f"
  // ctx.lineWidth = 1.75 * scale;
  // ctx.stroke();

  // ctx.lineTo(main.X + main.W, main.Y + main.H)
  // ctx.lineTo(main.X, main.Y + main.H)
  // ctx.fillStyle = COLORS.SECONDARYBLACK;

  // ctx.fill();

  // -- Side buttons: aligned with chipsController gaps --
  const chipsCtrlX = main.X + main.W * 0.5 - main.W * 0.325;   // = chipsController.X
  const chipsCtrlRX = chipsCtrlX + main.W * 0.65;                // = chipsController right edge
  const leftGapCX = main.X + (chipsCtrlX - main.X) * 0.5;
  const rightGapCX = chipsCtrlRX + (main.X + main.W - chipsCtrlRX) * 0.5;
  const btnH = main.H * 0.75;
  const btnW = Math.min(main.H * 0.68, (chipsCtrlX - main.X) * 0.88);
  const btnY = main.Y + (main.H - btnH) * 0.5;
  const btnPillR = btnH * 0.12;
  const btnIconCY = btnY + btnH * 0.36;
  const btnLabelY = btnY + btnH * 0.80;
  const btnFont = `300 ${clamp(7, (btnH / scale) * 0.20, 12) * scale}px Interroman, Arial`;

  const drawSideBtnBg = (bx) => {
    ctx.beginPath();
    ctx.roundRect(bx, btnY, btnW, btnH, btnPillR);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
  };

  // -- Chat Button (centered in left gap) --
  const chatX = leftGapCX - btnW * 0.5;
  const chatIconCX = chatX + btnW * 0.5;
  drawSideBtnBg(chatX);

  // Filled speech bubble
  ctx.save();
  const cbW = btnW * 0.52, cbH = cbW * 0.80, cbRad = cbW * 0.22;
  const cbX = chatIconCX - cbW * 0.5, cbY = btnIconCY - cbH * 0.62;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(cbX, cbY, cbW, cbH, cbRad);
  ctx.fill();
  // tail — small filled triangle bottom-left
  ctx.beginPath();
  ctx.moveTo(cbX + cbW * 0.18, cbY + cbH);
  ctx.lineTo(cbX + cbW * 0.06, cbY + cbH + cbH * 0.32);
  ctx.lineTo(cbX + cbW * 0.40, cbY + cbH);
  ctx.fill();
  ctx.restore();

  ctx.font = btnFont; ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Chat', chatIconCX, btnLabelY);


  // -- Lobby Button (centered in right gap) --
  const lobbyX = rightGapCX - btnW * 0.5;
  const lobbyIconCX = lobbyX + btnW * 0.5;
  drawSideBtnBg(lobbyX);

  // Filled house icon
  ctx.save();
  const hW = btnW * 0.50, hH = hW * 0.90;
  const hX = lobbyIconCX - hW * 0.5, hY = btnIconCY - hH * 0.56;
  const roofH = hH * 0.44, bodyH = hH * 0.56;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  // roof — triangle
  ctx.beginPath();
  ctx.moveTo(hX + hW * 0.5, hY);
  ctx.lineTo(hX + hW, hY + roofH);
  ctx.lineTo(hX, hY + roofH);
  ctx.closePath();
  ctx.fill();
  // body — rectangle
  ctx.beginPath();
  ctx.rect(hX + hW * 0.10, hY + roofH, hW * 0.80, bodyH);
  ctx.fill();
  // door — dark cutout
  const dW = hW * 0.28, dH = bodyH * 0.58;
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.beginPath();
  ctx.roundRect(hX + hW * 0.5 - dW * 0.5, hY + roofH + bodyH - dH, dW, dH, dW * 0.30);
  ctx.fill();
  ctx.restore();
  ctx.font = btnFont; ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Lobby', lobbyIconCX, btnLabelY);

  const lobbyShape = new Path2D();
  lobbyShape.rect(lobbyX, btnY, btnW, btnH);
  hitRegions.lobby = lobbyShape;

  const chipsController = {
    X: chipsCtrlX,
    Y: main.Y + (main.H - btnH) * 0.5,
    W: main.W * 0.65,
    H: main.H * 0.75
  }

  // --- Breakpoint — needed by both undo/cancel sizing and chip row ---
  const bp = getBreakpoint(containerWidth / scale);
  const isDesktopOrWide = bp === 'desktop' || bp === 'wide';
  const ctrlSlotW = isDesktopOrWide ? chipsController.W * 0.12 : chipsController.W / 3;

  // --- Undo Button
  const undoButton = {
    X: chipsController.X,
    Y: chipsController.Y,
    W: ctrlSlotW,
    H: chipsController.H,
    R: chipsController.H * 0.125,
  }


  ctx.beginPath();
  ctx.moveTo(undoButton.X + undoButton.W * 0.5 - undoButton.R, undoButton.Y + undoButton.H * 0.5 - undoButton.R)
  ctx.arc(
    undoButton.X + undoButton.W * 0.5,
    undoButton.Y + undoButton.H * 0.5,
    undoButton.R,
    Math.PI * 1.5, // start (top)
    Math.PI / 2,            // end (right)
    false         // clockwise
  );
  ctx.lineTo(undoButton.X + undoButton.W * 0.5 - undoButton.R, undoButton.Y + undoButton.H * 0.50 + undoButton.R);

  ctx.moveTo(undoButton.X + undoButton.W * 0.5 - undoButton.R + undoButton.R * 0.45, undoButton.Y + undoButton.H * 0.30)
  ctx.lineTo(undoButton.X + undoButton.W * 0.5 - undoButton.R - undoButton.R * 0.18, undoButton.Y + undoButton.H * 0.38)
  ctx.lineTo(undoButton.X + undoButton.W * 0.5 - undoButton.R + undoButton.R * 0.45, undoButton.Y + undoButton.H * 0.45)
  // ctx.lineTo(undoButton.X + 5, undoButton.Y + undoButton.H * 0.25 -7)

  ctx.strokeStyle = betHistory.length > 0 ? "#ffffffcc" : "#ffffff3a"
  ctx.lineWidth = 2 * scale
  ctx.stroke();

  undoBounds = { X: undoButton.X, Y: undoButton.Y, W: undoButton.W, H: undoButton.H };

  const mainCX = main.X + main.W * 0.5
  const iconWidth = main.H * 0.25

  // --- cancel Button
  const cancelButton = {
    X: chipsController.X + chipsController.W - ctrlSlotW,
    Y: chipsController.Y,
    W: ctrlSlotW,
    H: chipsController.H,
    R: chipsController.H * 0.125
  }


  ctx.beginPath();


  ctx.arc(
    cancelButton.X + cancelButton.W / 2,
    cancelButton.Y + cancelButton.H * 0.5,
    cancelButton.H * 0.15,
    Math.PI * 0, // start (top)
    Math.PI * 1.6,            // end (right)
    false         // clockwise
  );

  ctx.moveTo(cancelButton.X + cancelButton.W * 0.5, cancelButton.Y + cancelButton.H * 0.3)
  ctx.lineTo(cancelButton.X + cancelButton.W * 0.5 + cancelButton.H * 0.05, cancelButton.Y + cancelButton.H * 0.35)
  ctx.lineTo(cancelButton.X + cancelButton.W * 0.5, cancelButton.Y + cancelButton.H * 0.4)

  ctx.strokeStyle = "#ffffffcc"
  ctx.lineWidth = 2 * scale
  ctx.stroke();

  cancelBounds = { X: cancelButton.X, Y: cancelButton.Y, W: cancelButton.W, H: cancelButton.H };


  // --- Chip area: row on desktop/wide, single carousel on mobile/tablet ---
  const chipAreaX = chipsController.X + ctrlSlotW;
  const chipAreaW = chipsController.W - ctrlSlotW * 2;
  const formatter = new Intl.NumberFormat('en', { notation: 'compact' });

  const drawSingleChip = (cx, cy, r, colorIndex, isSelected) => {
    const chipColor = CHIP_COLORS[colorIndex];
    const chipShape = new Path2D();
    chipShape.arc(cx, cy, r, 0, Math.PI * 2);
    chipShape.closePath();
    ctx.save();
    ctx.globalAlpha = isSelected ? 1.0 : 0.45;
    ctx.shadowColor = chipColor.shadow;
    ctx.shadowBlur = isSelected ? 14 : 4;
    ctx.strokeStyle = chipColor.stroke;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke(chipShape);
    ctx.fillStyle = chipColor.fill;
    ctx.fill(chipShape);
    ctx.restore();
    // Edge segments
    ctx.save();
    ctx.globalAlpha = isSelected ? 1.0 : 0.45;
    const segs = 8;
    for (let i = 0; i < segs; i++) {
      const s = (Math.PI * 2 / segs) * i;
      const e = s + (Math.PI * 2 / segs) * 0.55;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.9, s, e);
      ctx.arc(cx, cy, r * 0.74, e, s, true);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.strokeStyle = chipColor.stroke;
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    const fmtVal = chips[colorIndex] > 900 ? formatter.format(chips[colorIndex]) : chips[colorIndex].toString();
    const fs = clamp(8, r * 0.55, 36);
    ctx.font = `700 ${fs}px Interroman, Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmtVal, cx, cy);
    ctx.restore();
  };

  if (isDesktopOrWide) {
    // Row of all chips between undo and cancel slots
    chipRowBounds = [];
    hitRegions.chip = null;
    const slotW = chipAreaW / chips.length;
    const rowR = Math.min(chipsController.H * 0.42, slotW * 0.44);
    const rowCY = chipsController.Y + chipsController.H * 0.5;
    chips.forEach((_, i) => {
      const cx = chipAreaX + slotW * i + slotW * 0.5;
      drawSingleChip(cx, rowCY, rowR, i, i === currentChipIndex);
      chipRowBounds.push({ X: cx - rowR, Y: rowCY - rowR, W: rowR * 2, H: rowR * 2, index: i });
    });
    const selCX = chipAreaX + (chipAreaW / chips.length) * currentChipIndex + (chipAreaW / chips.length) * 0.5;
    chipButtonCenter = { x: selCX, y: rowCY, r: rowR };
  } else {
    // Mobile/tablet — single cycling chip centered between undo and cancel
    chipRowBounds = [];
    const chipCX = chipAreaX + chipAreaW * 0.5;
    const chipCY = chipsController.Y + chipsController.H * 0.5;
    const chipR = chipsController.H * 0.38;
    chipButtonCenter = { x: chipCX, y: chipCY, r: chipR };
    const chipShape = new Path2D();
    chipShape.arc(chipCX, chipCY, chipR, 0, Math.PI * 2);
    chipShape.closePath();
    hitRegions.chip = chipShape;
    drawSingleChip(chipCX, chipCY, chipR, currentChipIndex, true);
  }



  // --- Wallet ---
  const isWide = GEOMETRY['statisticsGridA'].X > GEOMETRY['statisticsGridE'].X + GEOMETRY['statisticsGridE'].W + 1;
  const gA = GEOMETRY['statisticsGridA'];
  const wallet = isWide
    ? { X: gA.X, Y: gA.Y, W: gA.W, H: gA.H * 0.18 }
    : { X: GEOMETRY['menuBar'].X, Y: GEOMETRY['menuBar'].Y + main.H, W: GEOMETRY['menuBar'].W, H: GEOMETRY['menuBar'].H * 0.5 };
  const wRef = wallet.H / scale;
  const wPad = wallet.W * 0.03;
  const row1H = wallet.H * 0.38;
  const row2H = wallet.H * 0.52;
  const row1CY = wallet.Y + row1H * 0.55;
  const row2CY = wallet.Y + row1H + wallet.H * 0.05 + row2H * 0.52;
  const icoR = clamp(5 * scale, wallet.H * 0.18, 12 * scale);
  const titleFs = clamp(12, wRef * 0.13, 13) * scale;
  const balFs = clamp(13, wRef * 0.22, 17) * scale;
  const subFs = clamp(12, wRef * 0.11, 11) * scale;

  ctx.save();
  ctx.beginPath(); ctx.rect(wallet.X, wallet.Y, wallet.W, wallet.H); ctx.clip();

  ctx.fillStyle = isWide ? 'rgba(8,8,18,0.90)' : 'rgba(0,0,0,0)';
  // ctx.fillRect(wallet.X, wallet.Y, wallet.W, wallet.H);

  // Row 1 — game title (left) + live time (right)
  ctx.textBaseline = 'middle';
  ctx.font = `300 ${titleFs}px Interroman, Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.textAlign = 'start';
  ctx.fillText('Speed Baccarat  ₱50–10,000', wallet.X + wPad, row1CY);

  const walletTimeText = new Date().toLocaleTimeString('en-US', { hour12: false });
  ctx.font = `300 ${subFs}px Interroman, Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.textAlign = 'end';
  ctx.fillText(walletTimeText, wallet.X + wallet.W - wPad, row1CY);

  // Thin divider
  const walletDivY = wallet.Y + row1H;
  ctx.beginPath();
  ctx.moveTo(wallet.X + wPad, walletDivY);
  ctx.lineTo(wallet.X + wallet.W - wPad, walletDivY);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Row 2 — stacked-coins icon + balance (left) | total bet (right)
  const icoCX = wallet.X + wPad + icoR;
  const icoBaseY = row2CY + icoR * 0.30;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(0.8 * scale, icoR * 0.12);
  [-icoR * 0.50, 0, icoR * 0.50].forEach((dy, i) => {
    ctx.beginPath();
    ctx.ellipse(icoCX, icoBaseY + dy, icoR, icoR * 0.30, 0, 0, Math.PI * 2);
    if (i < 2) { ctx.fillStyle = '#1a1a2e'; ctx.fill(); }
    ctx.stroke();
  });

  ctx.font = `600 ${balFs}px Interroman, Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'middle';
  ctx.fillText(fmtCurrency(balance), icoCX + icoR + wPad * 0.6, row2CY);

  // Total bet badge (right side, only when bets placed)
  const totalBet = Object.values(bets).reduce((s, v) => s + v, 0);
  if (totalBet > 0) {
    ctx.font = `300 ${subFs}px Interroman, Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'end';
    ctx.fillText('Bet', wallet.X + wallet.W - wPad, row2CY - subFs * 0.6);
    ctx.font = `500 ${subFs * 1.1}px Interroman, Arial`;
    ctx.fillStyle = 'rgba(255,220,80,0.85)';
    ctx.fillText(fmtCurrency(totalBet), wallet.X + wallet.W - wPad, row2CY + subFs * 0.6);
  }

  ctx.restore();
}



const resize = (e) => {
  width = window.innerWidth;
  height = window.innerHeight;
  scale = window.devicePixelRatio || 1;


  const vw = window.visualViewport?.width || window.innerWidth;
  const vh = window.visualViewport?.height || window.innerHeight;
  canvas.width = vw * scale;
  canvas.height = vh * scale;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';


  tileSize = Math.min(canvas.width, canvas.height) / 32;

  const isMobile = true;
  const spacing = 10;
  const buttonGap = spacing / 2;

  containerAvailableWidth = canvas.width;
  containerMaxWidth = containerAvailableWidth//1440 * scale;
  containerWidth = Math.min(containerAvailableWidth, containerMaxWidth)
  leftGutter = (canvas.width - containerWidth) / 2;


  scrollXA = 0;
  scrollXE = 0;
}


const drawPopup = () => {
  if (!activePopup) { popupCardRect = null; popupCloseHit = null; return; }
  const info = REGION_INFO[activePopup];
  if (!info) return;

  // Backdrop
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Card
  const cardW = clamp(260 * scale, canvas.width * 0.72, 400 * scale);
  const cardH = cardW * 0.68;
  const cardX = (canvas.width - cardW) / 2;
  const cardY = (canvas.height - cardH) / 2;
  const cardR = 14 * scale;
  popupCardRect = { X: cardX, Y: cardY, W: cardW, H: cardH };

  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
  ctx.fillStyle = '#111827';
  ctx.fill();
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Close button
  const closeR = 11 * scale;
  const closeX = cardX + cardW - closeR * 2 - 10 * scale;
  const closeY = cardY + closeR + 10 * scale;
  popupCloseHit = { X: closeX - closeR, Y: closeY - closeR, W: closeR * 2, H: closeR * 2 };
  ctx.beginPath();
  ctx.arc(closeX, closeY, closeR, 0, Math.PI * 2);
  ctx.fillStyle = '#374151';
  ctx.fill();
  ctx.fillStyle = '#9ca3af';
  ctx.font = `${13 * scale}px Interroman, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', closeX, closeY);

  // Label
  ctx.fillStyle = info.color;
  ctx.font = `700 ${20 * scale}px Interroman, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(info.label, cardX + cardW / 2, cardY + cardH * 0.28);

  // Odds
  ctx.fillStyle = '#facc15';
  ctx.font = `300 ${32 * scale}px Interroman, Arial`;
  ctx.fillText(info.odds, cardX + cardW / 2, cardY + cardH * 0.55);

  // Description
  ctx.fillStyle = '#9ca3af';
  ctx.font = `${12 * scale}px Interroman, Arial`;
  ctx.fillText(info.desc, cardX + cardW / 2, cardY + cardH * 0.80);
};

const drawFlyingChips = () => {
  const now = performance.now();
  flyingChips = flyingChips.filter(chip => {
    const elapsed = now - chip.startTime;
    const raw = Math.min(elapsed / chip.duration, 1);
    const ease = 1 - Math.pow(1 - raw, 3);
    const x = chip.x0 + (chip.x1 - chip.x0) * ease;
    const y = chip.y0 + (chip.y1 - chip.y0) * ease - Math.sin(Math.PI * raw) * 80 * scale;
    const r = chip.r0 + (chip.r1 - chip.r0) * ease;
    const color = CHIP_COLORS[chip.colorIndex];
    const fmt = new Intl.NumberFormat('en', { notation: 'compact' });
    ctx.save();
    ctx.globalAlpha = raw < 0.85 ? 1 : 1 - (raw - 0.85) / 0.15;
    ctx.shadowColor = color.shadow;
    ctx.shadowBlur = 12 * scale;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color.fill;
    ctx.fill();
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
    ctx.shadowBlur = 0;
    for (let s = 0; s < 8; s++) {
      const a0 = (Math.PI * 2 / 8) * s;
      const a1 = a0 + (Math.PI * 2 / 8) * 0.55;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.9, a0, a1);
      ctx.arc(x, y, r * 0.74, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = s % 2 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    ctx.font = `700 ${clamp(8, r * 0.52, 32)}px Interroman, Arial`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(chip.amount >= 1000 ? fmt.format(chip.amount) : String(chip.amount), x, y);
    ctx.restore();
    return raw < 1;
  });
};

const drawPhaseBanner = () => {
  if (!lastGEOMETRY) return;
  const now = performance.now();
  const G = lastGEOMETRY;
  const bp = getBreakpoint(containerWidth / window.devicePixelRatio);
  const isLarge = bp === 'wide' || bp === 'desktop';
  const wb = G['walletBar'];

  // Phase data
  let label, sublabel, accentColor, tintRgb, progress = 1;
  if (gamePhase === 'betting') {
    const left = Math.max(0, BETTING_DURATION - (now - bettingCountdownStart));
    const secs = Math.ceil(left / 1000);
    progress = left / BETTING_DURATION;
    label = 'PLACE YOUR BETS';
    sublabel = secs.toString();
    accentColor = secs <= 3 ? '#f55858' : '#e8c84a';
    tintRgb = secs <= 3 ? '245,88,88' : '232,200,74';
  } else if (gamePhase === 'result') {
    const pTotal = handTotal(playerCards);
    const bTotal = handTotal(bankerCards);
    const w = winners[0];
    if (w === 'tie') {
      label = 'TIE';
      sublabel = `${pTotal} — ${bTotal}`;
    } else if (w === 'player') {
      label = 'PLAYER WINS';
      sublabel = `${pTotal} — ${bTotal}`;
    } else {
      label = 'BANKER WINS';
      sublabel = `${bTotal} — ${pTotal}`;
    }
    accentColor = w === 'player' ? COLORS.STROKEBLUE
      : w === 'banker' ? COLORS.STROKERED : COLORS.STROKEGREEN;
    tintRgb = w === 'player' ? '36,124,218' : w === 'banker' ? '240,84,84' : '20,255,161';
  }
  if (!label) return;

  ctx.save();

  if (isLarge && wb) {
    // ── Enhanced banner in walletBar (center column top strip) ──
    const { X, Y, W, H } = wb;

    // Color-blended glow overlay
    if (tintRgb) {
      const glow = (Math.sin(now * 0.0032) + 1) * 0.5;
      const tintAlpha = gamePhase === 'result' ? 0.05 + glow * 0.12 : 0.01 + glow * 0.03;
      ctx.beginPath();
      ctx.rect(X, Y, W, H);
      ctx.fillStyle = `rgba(${tintRgb}, ${tintAlpha})`;
      ctx.fill();
    }

    const pad = W * 0.04;
    const cy = Y + H * 0.5;
    const fRef = H / scale;
    const labelFs = clamp(9, fRef * 0.32, 15) * scale;
    const subFs = clamp(8, fRef * 0.28, 13) * scale;

    // Accent left bar
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(X + pad * 0.3, Y + H * 0.22, 3 * scale, H * 0.56, 2 * scale);
    ctx.fill();

    // Label
    ctx.font = `700 ${labelFs}px Interroman, Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, X + pad * 1.4, sublabel ? cy - labelFs * 0.55 : cy);

    // Sublabel / score
    if (sublabel) {
      ctx.font = `400 ${subFs}px Interroman, Arial`;
      ctx.fillStyle = accentColor;
      ctx.fillText(sublabel, X + pad * 1.4, cy + subFs * 0.65);
    }

    // Countdown arc (right side, betting phase only)
    if (gamePhase === 'betting') {
      const arcR = H * 0.34;
      const arcCX = X + W - pad - arcR;
      const arcCY = cy;
      const start = -Math.PI / 2;
      const end = start + Math.PI * 2 * progress;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath(); ctx.arc(arcCX, arcCY, arcR, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(arcCX, arcCY, arcR, start, end); ctx.stroke();
      ctx.font = `700 ${subFs}px Interroman, Arial`;
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sublabel, arcCX, arcCY);
    }

  } else {
    // ── Floating banner (tablet / mobile) ──
    const bx = leftGutter + containerWidth * 0.5;
    const by = canvas.height * 0.38;
    const fontSize = clamp(10, containerWidth * 0.03, 18) * scale;
    ctx.font = `700 ${fontSize}px Interroman, Arial`;
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fullLabel = sublabel ? `${label}  ${sublabel}` : label;
    ctx.fillText(fullLabel, bx, by);
  }

  ctx.restore();
};

const loop = () => {
  // --- Clear ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateGameState();
  // drawGrid();
  // drawLayout();
  drawUI();
  drawPopup();
  drawFlyingChips();
  drawPhaseBanner();
  requestAnimationFrame(loop)
};


resize();
loop();


// -- Event Listeners --
window.addEventListener('resize', resize);


canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * scale;
  const y = (e.clientY - rect.top) * scale;

  const overPlayer = hitRegions.player && ctx.isPointInPath(hitRegions.player, x, y);
  const overBanker = hitRegions.banker && ctx.isPointInPath(hitRegions.banker, x, y);
  const overTie = hitRegions.tie && ctx.isPointInPath(hitRegions.tie, x, y);
  const overChip = hitRegions.chip && ctx.isPointInPath(hitRegions.chip, x, y);
  const overPPair = hitRegions.P_PAIR && ctx.isPointInPath(hitRegions.P_PAIR, x, y);
  const overBPair = hitRegions.B_PAIR && ctx.isPointInPath(hitRegions.B_PAIR, x, y);
  const overPBonus = hitRegions.P_BONUS && ctx.isPointInPath(hitRegions.P_BONUS, x, y);
  const overBBonus = hitRegions.B_BONUS && ctx.isPointInPath(hitRegions.B_BONUS, x, y);
  hoverRegion = overPlayer ? 'player'
    : overBanker ? 'banker'
      : overTie ? 'tie'
        : overChip ? 'chip'
          : overPBonus ? 'p_bonus'
            : overBBonus ? 'b_bonus'
              : overPPair ? 'p_pair'
                : overBPair ? 'b_pair'
                  : null;
  canvas.style.cursor = (
    overPlayer
    || overBanker
    || overTie
    || overChip
    || overPBonus
    || overBBonus
    || overPPair
    || overBPair
  ) ? 'pointer' : 'default';
});

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * scale;
  const y = (e.clientY - rect.top) * scale;

  if (activePopup) {
    const c = popupCloseHit;
    const p = popupCardRect;
    const onClose = c && x >= c.X && x <= c.X + c.W && y >= c.Y && y <= c.Y + c.H;
    const onCard = p && x >= p.X && x <= p.X + p.W && y >= p.Y && y <= p.Y + p.H;
    if (onClose || !onCard) activePopup = null;
    return;
  }

  if (hitRegions.player && ctx.isPointInPath(hitRegions.player, x, y)) {
    pressedRegion = 'player';
  } else if (hitRegions.banker && ctx.isPointInPath(hitRegions.banker, x, y)) {
    pressedRegion = 'banker';
  } else if (hitRegions.tie && ctx.isPointInPath(hitRegions.tie, x, y)) {
    pressedRegion = 'tie';
  } else if (hitRegions.P_BONUS && ctx.isPointInPath(hitRegions.P_BONUS, x, y)) {
    pressedRegion = 'p_bonus';
  } else if (hitRegions.P_PAIR && ctx.isPointInPath(hitRegions.P_PAIR, x, y)) {
    pressedRegion = 'p_pair';
  } else if (hitRegions.B_BONUS && ctx.isPointInPath(hitRegions.B_BONUS, x, y)) {
    pressedRegion = 'b_bonus';
  } else if (hitRegions.B_PAIR && ctx.isPointInPath(hitRegions.B_PAIR, x, y)) {
    pressedRegion = 'b_pair';
  } else if (chipRowBounds.length > 0 && chipRowBounds.some(b => x >= b.X && x <= b.X + b.W && y >= b.Y && y <= b.Y + b.H)) {
    const hit = chipRowBounds.find(b => x >= b.X && x <= b.X + b.W && y >= b.Y && y <= b.Y + b.H);
    currentChipIndex = hit.index;
    pressedRegion = 'chip';
  } else if (hitRegions.chip && ctx.isPointInPath(hitRegions.chip, x, y)) {
    pressedRegion = 'chip';
    currentChipIndex = (currentChipIndex + 1) % chips.length;
  } else if (hitRegions.lobby && ctx.isPointInPath(hitRegions.lobby, x, y)) {
    pressedRegion = 'lobby';
  } else if (undoBounds && x >= undoBounds.X && x <= undoBounds.X + undoBounds.W && y >= undoBounds.Y && y <= undoBounds.Y + undoBounds.H) {
    pressedRegion = 'undo';
  } else if (cancelBounds && x >= cancelBounds.X && x <= cancelBounds.X + cancelBounds.W && y >= cancelBounds.Y && y <= cancelBounds.Y + cancelBounds.H) {
    pressedRegion = 'cancel';
  } else {
    pressedRegion = null;
  }
  hoverRegion = pressedRegion;
});

canvas.addEventListener('pointerup', () => {
  if (pressedRegion === 'lobby') { window.location.href = '/'; return; }

  if (pressedRegion === 'undo') {
    if (gamePhase === 'betting' && betHistory.length > 0) {
      const last = betHistory.pop();
      bets[last.region] -= last.amount;
      balance += last.amount;
      const src = betChipPositions[last.region];
      if (src && chipButtonCenter.r > 0) {
        flyingChips.push({
          x0: src.x, y0: src.y, r0: src.r,
          x1: chipButtonCenter.x, y1: chipButtonCenter.y, r1: chipButtonCenter.r,
          amount: last.amount, colorIndex: chipColorIndex(last.amount),
          startTime: performance.now(), duration: 320,
        });
      }
    }
    pressedRegion = null;
    return;
  }

  if (pressedRegion === 'cancel') {
    if (gamePhase !== 'betting') { pressedRegion = null; return; }
    const totalBet = Object.values(bets).reduce((s, v) => s + v, 0);
    if (totalBet > 0) {
      lastBets = { ...bets };
      balance += totalBet;
      bets = { player: 0, banker: 0, tie: 0, p_bonus: 0, p_pair: 0, b_bonus: 0, b_pair: 0 };
      betHistory = [];
    }
    pressedRegion = null;
    return;
  }

  if (pressedRegion && pressedRegion in REGION_INFO) {
    const amount = chips[currentChipIndex];
    if (gamePhase === 'betting' && balance >= amount) {
      bets[pressedRegion] += amount;
      balance -= amount;
      betHistory.push({ region: pressedRegion, amount });
      const dest = betChipPositions[pressedRegion];
      if (dest && chipButtonCenter.r > 0) {
        flyingChips.push({
          x0: chipButtonCenter.x, y0: chipButtonCenter.y, r0: chipButtonCenter.r,
          x1: dest.x, y1: dest.y, r1: dest.r,
          amount, colorIndex: currentChipIndex,
          startTime: performance.now(), duration: 380,
        });
      }
    }
    pressedRegion = null;
    return;
  }

  pressedRegion = null;
});
canvas.addEventListener('pointercancel', () => { pressedRegion = null; });

canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  const tx = (e.touches[0].clientX - rect.left) * scale;
  const ty = (e.touches[0].clientY - rect.top) * scale;
  const inBounds = (b) => b && tx >= b.X && tx <= b.X + b.W && ty >= b.Y && ty <= b.Y + b.H;
  if (inBounds(scoreBoardBoundsA)) {
    activeScrollTarget = 'A';
  } else if (inBounds(scoreBoardBoundsE)) {
    activeScrollTarget = 'E';
  } else {
    activeScrollTarget = null;
    return;
  }
  isTouching = true;
  screenX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", (e) => {
  if (!isTouching || !activeScrollTarget) return;
  const currentX = e.touches[0].clientX;
  const dx = screenX - currentX;
  if (activeScrollTarget === 'A') {
    scrollXA = Math.max(0, Math.min(scrollXA + dx, maxScrollXA));
  } else {
    scrollXE = Math.max(0, Math.min(scrollXE + dx, maxScrollXE));
  }
  screenX = currentX;
});

canvas.addEventListener("touchend", () => {
  isTouching = false;
  activeScrollTarget = null;
});