
// --- Canvas Setup ---
const canvas = document.createElement('canvas');
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');

// --- Background Video (live stream, embedded via iframe) ---
const videoFrameEl = document.createElement('iframe');
videoFrameEl.src = (window.GAME_CONFIG && window.GAME_CONFIG.videoSrc) || 'https://studio.jrta.online/play?stream=baccarat1';
videoFrameEl.allow = 'autoplay; fullscreen';
videoFrameEl.setAttribute('allowfullscreen', '');
videoFrameEl.style.position = 'fixed';
videoFrameEl.style.border = '0';
videoFrameEl.style.pointerEvents = 'none';
document.body.insertBefore(videoFrameEl, canvas);

// --- Background Music ---
const musicEl = document.createElement('audio');
musicEl.loop = true;
musicEl.volume = 0.35;
musicEl.src = (window.GAME_CONFIG && window.GAME_CONFIG.musicSrc) || '/assets/audio/bg-music.mp3';
musicEl.style.display = 'none';
document.body.appendChild(musicEl);

let musicUnlocked = false;
const unlockMusic = () => {
  if (musicUnlocked) return;
  musicUnlocked = true;
  musicEl.muted = isMuted;
  musicEl.play().catch(() => {});
};
document.addEventListener('pointerdown', unlockMusic, { once: true });

const positionVideoFrame = (GEOMETRY) => {
  const bp = getBreakpoint(containerWidth / window.devicePixelRatio);
  const isFullscreen = bp === 'wide' || bp === 'desktop';

  // Full canvas for wide/desktop, top area only for mobile/tablet
  const area = isFullscreen
    ? { X: 0, Y: 0, W: canvas.width, H: canvas.height }
    : GEOMETRY['video'];

  videoFrameEl.style.left   = (area.X / scale) + 'px';
  videoFrameEl.style.top    = (area.Y / scale) + 'px';
  videoFrameEl.style.width  = (area.W / scale) + 'px';
  videoFrameEl.style.height = (area.H / scale) + 'px';
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
const GAME_TYPE = (window.GAME_CONFIG && window.GAME_CONFIG.gameType) || 'baccarat';
let bets = GAME_TYPE === 'gostop'    ? { go: 0, stop: 0 }
         : GAME_TYPE === 'oddeven'   ? { odd: 0, even: 0 }
         : GAME_TYPE === 'colorgame' ? { red: 0, blue: 0, yellow: 0, green: 0, white: 0, pink: 0 }
         : { player: 0, banker: 0, tie: 0, p_bonus: 0, p_pair: 0, b_bonus: 0, b_pair: 0 };
let betHistory = [];
let betLog        = [];  // persistent cross-round feed: { player, amount, region, isYou }
let _fakeBetTimer = 0;
let lastBets = {};
let playerCards = [null, null, null];
let bankerCards = [null, null, null];
let gamePhase = 'betting'; // 'betting' | 'dealing' | 'result'
let bettingCountdownStart = performance.now();
const BETTING_DURATION = 12000; // 12 seconds for demo purposes
let lastGEOMETRY = null;
let winners = [];
let colorGameDice = [null, null, null]; // colorgame: each element is a color key (result per die)
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

// --- UI Feature State ---
let isMuted = false;
let isVideoOn = !!(window.GAME_CONFIG && window.GAME_CONFIG.videoEnabled);
let layoutMode = 'playing'; // 'playing' | 'monitoring'
let isChatOpen = false;
let chatMessages = [
  { user: 'Dealer',    text: 'Welcome! Bets are now open.', isSelf: false, isSystem: true  },
  { user: 'Player_77', text: 'GL everyone!',                isSelf: false, isSystem: false },
  { user: 'Ace_High',  text: 'Banker streak, stay on B',    isSelf: false, isSystem: false },
  { user: 'You',       text: 'Ready to play 🎰',            isSelf: true,  isSystem: false },
  { user: 'Dealer',    text: 'Bets closing soon.',          isSelf: false, isSystem: true  },
];
let chatScrollY = 0;
let chatInputValue = '';
let chatInputEl = null;
let volumeBounds = null;
let layoutBounds = null;
let videoBounds  = null;
let walletChipTarget = { x: 0, y: 0, r: 0 };
let chatCloseBounds = null;
let chatSendBounds = null;
let isSettingsOpen  = false;
let isUserPrefOpen  = false;
let isGameDropOpen  = false;
let isLabelsOn      = false;
let labelsBounds    = null;
let topNavGameHits    = [];
let topNavSettingsHit = null;
let topNavUserHit     = null;
let topNavSettingHits = [];

const GAME_NAV = [
  { id: 'baccarat1', label: 'BAC 1'   },
  { id: 'baccarat2', label: 'BAC 2'   },
  { id: 'baccarat3', label: 'VIP BAC' },
  { id: 'gostop',    label: 'GO-STOP' },
  { id: 'oddeven',   label: 'ODD/EVN' },
  { id: 'colorgame', label: 'COLOR'   },
];

const REGION_INFO = {
  player:  { label: 'PLAYER',  odds: '0.95 : 1', desc: 'Bet on the Player hand to win.', color: '#7752ff' },
  banker:  { label: 'BANKER',  odds: '0.95 : 1', desc: 'Bet on the Banker hand to win.', color: '#f55858' },
  tie:     { label: 'TIE',     odds: '8 : 1',    desc: 'Bet that both hands end in a tie.', color: '#58b373' },
  p_bonus: { label: 'P BONUS', odds: '4 : 1',    desc: 'Player wins by a natural or large margin.', color: '#7752ff' },
  p_pair:  { label: 'P PAIR',  odds: '11 : 1',   desc: "Player's first two cards are a pair.", color: '#7752ff' },
  b_bonus: { label: 'B BONUS', odds: '4 : 1',    desc: 'Banker wins by a natural or large margin.', color: '#f55858' },
  b_pair:  { label: 'B PAIR',  odds: '11 : 1',   desc: "Banker's first two cards are a pair.", color: '#f55858' },
  go:      { label: 'GO',      odds: '1 : 1',    desc: 'Bet that the round continues.', color: '#ff4040' },
  stop:    { label: 'STOP',    odds: '1 : 1',    desc: 'Bet that the dealer collects.', color: '#4080ff' },
  odd:     { label: 'ODD',     odds: '1 : 1',    desc: 'Bet on an odd number.', color: '#b040ff' },
  even:    { label: 'EVEN',    odds: '1 : 1',    desc: 'Bet on an even number.', color: '#10c060' },
  red:     { label: 'RED',     odds: '1 : 1',    desc: 'Bet on the Red color.', color: '#e82020' },
  blue:    { label: 'BLUE',    odds: '1 : 1',    desc: 'Bet on the Blue color.', color: '#2060e8' },
  yellow:  { label: 'YELLOW',  odds: '1 : 1',    desc: 'Bet on the Yellow color.', color: '#e8b800' },
  green:   { label: 'GREEN',   odds: '1 : 1',    desc: 'Bet on the Green color.', color: '#20c060' },
  white:   { label: 'WHITE',   odds: '1 : 1',    desc: 'Bet on the White color.', color: '#c0c8d0' },
  pink:    { label: 'PINK',    odds: '1 : 1',    desc: 'Bet on the Pink color.', color: '#e020a0' },
};

let containerAvailableWidth = 0;
let containerMaxWidth = 580;
let containerWidth = containerMaxWidth;
// scrollXA / scrollXE / maxScrollXA / maxScrollXE declared above
let leftGutter = 0;

// optional height (full or constrained)
const containerY = 0;
const containerHeight = canvas.height;


const COLOR_GAME_KEYS = ['red', 'blue', 'yellow', 'green', 'white', 'pink'];
const FAKE_PLAYERS    = ['Ace99','LuckyRex','Gold77','NightOwl','Star88','KingPin','FastCash','WildCard','CoolBet','TopDog','BlueMax','RedFox','SilverX','BetMaster','LionKing','PhilBet'];

const _seedValues = GAME_TYPE === 'gostop'    ? ['G', 'S']
                  : GAME_TYPE === 'oddeven'   ? ['O', 'E']
                  : GAME_TYPE === 'colorgame' ? ['R', 'B', 'Y', 'G', 'W', 'P']
                  : ['P', 'B', 'T'];
const results = [];
for (let i = 0; i < 30; i++) {
  if (GAME_TYPE === 'colorgame') {
    const roll = Array.from({ length: 3 }, () => COLOR_GAME_KEYS[Math.floor(Math.random() * 6)]);
    results.push({ value: roll[0].charAt(0).toUpperCase(), dice: roll });
  } else {
    results.push({ value: _seedValues[Math.floor(Math.random() * _seedValues.length)] });
  }
}

let chips = [100, 200, 500, 1000, 5000, 10000, 20000]
let currentChipIndex = 3;
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
};
// Allow per-game color overrides via GAME_CONFIG
if (window.GAME_CONFIG && window.GAME_CONFIG.colors) {
  Object.assign(COLORS, window.GAME_CONFIG.colors);
}

// Non-baccarat tile palettes — can be overridden via GAME_CONFIG.tileColors
const TILE_COLORS = Object.assign({
  go:     { fill: '#1a0808', stroke: '#ff4040', neon: '#ff7070' },
  stop:   { fill: '#080e1a', stroke: '#4080ff', neon: '#6699ff' },
  odd:    { fill: '#120430', stroke: '#b040ff', neon: '#cc77ff' },
  even:   { fill: '#03180a', stroke: '#10c060', neon: '#30e880' },
  // Color Game palette
  red:    { fill: '#5a0a0a', stroke: '#e82020', neon: '#ff5555' },
  blue:   { fill: '#0a1060', stroke: '#2060e8', neon: '#5599ff' },
  yellow: { fill: '#5a4800', stroke: '#e8b800', neon: '#ffe050' },
  green:  { fill: '#0a4020', stroke: '#20c060', neon: '#50e890' },
  white:  { fill: '#484848', stroke: '#c0c8d0', neon: '#ffffff' },
  pink:   { fill: '#5a0840', stroke: '#e020a0', neon: '#ff60cc' },
}, (window.GAME_CONFIG && window.GAME_CONFIG.tileColors) || {});

const _pushFakeBet = () => {
  const gameRegions = GAME_TYPE === 'colorgame' ? COLOR_GAME_KEYS
    : GAME_TYPE === 'gostop'  ? ['go',  'stop']
    : GAME_TYPE === 'oddeven' ? ['odd', 'even']
    : ['player', 'banker'];
  const player = FAKE_PLAYERS[Math.floor(Math.random() * FAKE_PLAYERS.length)]
               + (Math.floor(Math.random() * 900) + 100);
  const amounts = [100, 200, 500, 1000, 2000, 5000];
  betLog.unshift({
    player,
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    region: gameRegions[Math.floor(Math.random() * gameRegions.length)],
    isYou: false,
  });
  if (betLog.length > 80) betLog.length = 80;
};
for (let _i = 0; _i < 14; _i++) _pushFakeBet(); // seed initial entries on load

let revealNumber = null; // used by oddeven during result phase

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
      uiY, uiH,
    };
  }

  if (bp === 'tablet' || bp === 'desktop') {
    // STATS (gridE | gridA) — BET OPTIONS — MENU BAR
    const statH = uiH * (layoutMode === 'monitoring' ? 0.42 : 0.27);
    const betH  = uiH * (layoutMode === 'monitoring' ? 0.32 : 0.44);
    const menuH = uiH - statH - betH;
    return {
      video,
      statisticsGridE: { X: leftGutter, Y: uiY, W: containerWidth * 0.5, H: statH },
      statisticsGridA: { X: leftGutter + containerWidth * 0.5, Y: uiY, W: containerWidth * 0.5, H: statH },
      betOptions: { X: leftGutter, Y: uiY + statH, W: containerWidth, H: betH },
      menuBar: { X: leftGutter, Y: uiY + statH + betH, W: containerWidth, H: menuH },
      uiY, uiH,
    };
  }

  // wide: gridE sidebar | WALLET+BET OPTIONS+MENU BAR center | gridA sidebar
  uiY = canvas.height * 0.65;
  uiH = canvas.height * 0.35;
  const centerW = Math.round(containerWidth * (layoutMode === 'monitoring' ? 0.36 : 0.46));
  const sideW = Math.round((containerWidth - centerW) / 2);
  const walletH = uiH * 0.15;
  const betH = uiH * 0.60;
  const menuH = uiH - walletH - betH;
  return {
    video,
    statisticsGridE: { X: leftGutter, Y: uiY, W: sideW, H: uiH },
    statisticsGridA: { X: leftGutter + sideW + centerW, Y: uiY, W: sideW, H: uiH },
    betOptions: { X: leftGutter + sideW, Y: uiY + walletH, W: centerW, H: betH },
    menuBar: { X: leftGutter + sideW, Y: uiY + walletH + betH, W: centerW, H: menuH },
    walletBar: { X: leftGutter + sideW, Y: uiY, W: centerW, H: walletH },
    uiY, uiH,
  };
}

const constructGrid = (rows, cols, posX, posY, gridHeight, cellSize = 1, divX, divY, panelW = null) => {

  const cellH = Math.max(1, gridHeight / rows);
  const cellW = cellH;

  const totalWidth = cols * cellW;
  const fillW = panelW != null ? Math.max(totalWidth, panelW) : totalWidth;

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(posX, posY, fillW, gridHeight);

  ctx.lineWidth = 0.3 * scale;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.setLineDash([]);
  ctx.beginPath();
  const startX = posX;
  // horizontal — span full fill width
  for (let i = cellSize; i < rows; i += cellSize) {
    const y = Math.round(posY + i * cellH) + 0.5;
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + fillW, y);
  }
  // vertical — include right border of last column
  for (let i = cellSize; i <= cols; i += cellSize) {
    const x = Math.round(posX + i * cellW) + 0.5;
    ctx.moveTo(x, posY);
    ctx.lineTo(x, posY + gridHeight);
  }
  ctx.stroke();
  // outer border
  ctx.beginPath();
  ctx.rect(posX, posY, fillW, gridHeight);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 0.6 * scale;
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

const spawnWinChips = (betKey, winAmount) => {
  const src = betChipPositions[betKey];
  if (!src || !walletChipTarget.x) return;
  const count = Math.min(6, Math.max(1, Math.round(winAmount / 500)));
  for (let i = 0; i < count; i++) {
    flyingChips.push({
      x0: src.x + (Math.random() - 0.5) * src.r * 0.6,
      y0: src.y + (Math.random() - 0.5) * src.r * 0.6,
      r0: (src.r || chipButtonCenter.r) * 0.85,
      x1: walletChipTarget.x, y1: walletChipTarget.y, r1: walletChipTarget.r * 0.55,
      amount: Math.round(winAmount / count),
      colorIndex: chipColorIndex(winAmount),
      startTime: performance.now() + i * 90,
      duration: 550 + Math.random() * 120,
    });
  }
};

const applyPayouts = (winnerList) => {
  Object.keys(bets).forEach(region => {
    if (bets[region] > 0 && winnerList.includes(region)) {
      const payout = bets[region] * (1 + PAYOUTS[region]);
      balance += payout;
      spawnWinChips(region, payout);
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
  revealNumber = null;
  colorGameDice = [null, null, null];
  bets = GAME_TYPE === 'gostop'    ? { go: 0, stop: 0 }
       : GAME_TYPE === 'oddeven'   ? { odd: 0, even: 0 }
       : GAME_TYPE === 'colorgame' ? { red: 0, blue: 0, yellow: 0, green: 0, white: 0, pink: 0 }
       : { player: 0, banker: 0, tie: 0, p_bonus: 0, p_pair: 0, b_bonus: 0, b_pair: 0 };
  betHistory = [];
};

const runSimpleDeal = () => {
  gamePhase = 'dealing';
  setTimeout(() => {
    let winKey;
    if (GAME_TYPE === 'gostop') {
      winKey = Math.random() > 0.5 ? 'go' : 'stop';
    } else {
      revealNumber = Math.floor(Math.random() * 80) + 1;
      winKey = revealNumber % 2 === 1 ? 'odd' : 'even';
    }
    winners = [winKey];
    if (bets[winKey] > 0) {
      const payout = bets[winKey] * 2;
      balance += payout;
      spawnWinChips(winKey, payout);
    }
    gamePhase = 'result';
    const v = GAME_TYPE === 'gostop' ? (winKey === 'go' ? 'G' : 'S') : (winKey === 'odd' ? 'O' : 'E');
    results.push({ value: v });
    setTimeout(startNewRound, 4500);
  }, 3000);
};

const runColorGameDeal = () => {
  gamePhase = 'dealing';
  colorGameDice = [null, null, null];
  setTimeout(() => {
    const roll = Array.from({ length: 3 }, () => COLOR_GAME_KEYS[Math.floor(Math.random() * 6)]);
    colorGameDice = roll;
    // count how many dice show each color
    const counts = {};
    roll.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    winners = Object.keys(counts);
    // payout: original stake + 1× per matching die
    winners.forEach(key => {
      if (bets[key] > 0) {
        const payout = bets[key] + bets[key] * counts[key];
        balance += payout;
        spawnWinChips(key, payout);
      }
    });
    gamePhase = 'result';
    results.push({ value: roll[0].charAt(0).toUpperCase(), dice: roll });
    setTimeout(startNewRound, 5500);
  }, 3000);
};

const runDeal = () => {
  if (GAME_TYPE === 'colorgame') return runColorGameDeal();
  if (GAME_TYPE !== 'baccarat') return runSimpleDeal();
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
  if (wb) drawGlassPanel(wb.X, wb.Y, wb.W, wb.H, r);
};

const drawUI = () => {

  const GEOMETRY = computeGeometry();
  lastGEOMETRY = GEOMETRY;

  videoFrameEl.style.display = isVideoOn ? '' : 'none';
  if (isVideoOn) positionVideoFrame(GEOMETRY);
  const uiShadow = ctx.createLinearGradient(0, GEOMETRY.uiY, 0, GEOMETRY.uiY + GEOMETRY.uiH);
  uiShadow.addColorStop(0, 'rgba(10, 8, 28, 0)');
  uiShadow.addColorStop(0.5, 'rgba(10, 8, 28, 0.85)');
  uiShadow.addColorStop(1, 'rgba(10, 8, 28, 0.44)');
  ctx.fillStyle = uiShadow;
  ctx.fillRect(0, GEOMETRY.uiY, canvas.width, GEOMETRY.uiH);

  // drawGlassPanels(GEOMETRY);
  drawbetOptions(GEOMETRY);
  drawStatistics(GEOMETRY);
  drawMenuBar(GEOMETRY);
  // colorgame dice live view is rendered inside drawStatistics (gE panel)

}

const _hexToRgba = (hex, a) => {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
};

const drawSectionLabels = (G) => {
  if (!G) return;
  const S = scale;
  const navH_ = clamp(30*S, canvas.height * 0.042, 44*S);
  const navW_ = clamp(260*S, containerWidth * 0.88, containerWidth * 0.94);
  const navX_ = leftGutter + (containerWidth - navW_) * 0.5;
  const sections = [
    { r: G.video,           label: 'LIVE DEALER FEED',    sub: 'Video stream · dealer camera',     c: '#4499ff' },
    { r: G.betOptions,      label: 'BETTING ZONE',        sub: 'Place bets · Banker / Player / Tie', c: '#ff9040' },
    { r: G.statisticsGridE, label: 'BEAD ROAD',           sub: 'Game history · result sequence',   c: '#c060ff' },
    { r: G.statisticsGridA, label: 'GAME ANALYTICS',      sub: 'Patterns · trends · streaks',      c: '#9060ff' },
    { r: G.menuBar,         label: 'BET CONTROLS',        sub: 'Chip selector · Undo · Cancel',    c: '#30d890' },
    { r: { X: navX_, Y: 7*S, W: navW_, H: navH_ },
                            label: 'NAVIGATION BAR',      sub: 'Game switcher · Volume · Layout',  c: '#ffe040' },
    ...(G.walletBar ? [{ r: G.walletBar, label: 'WALLET & BALANCE', sub: 'Account balance · session log', c: '#60e0ff' }] : []),
  ];

  const isOver = (r) => r && _mx >= r.X && _mx <= r.X + r.W && _my >= r.Y && _my <= r.Y + r.H;

  ctx.save();
  for (const { r, label, sub, c } of sections) {
    if (!r || r.W <= 0 || r.H <= 0) continue;
    const hov = isOver(r);

    // ── Tinted fill ──
    ctx.fillStyle = _hexToRgba(c, hov ? 0.20 : 0.09);
    ctx.beginPath(); ctx.rect(r.X, r.Y, r.W, r.H); ctx.fill();

    // ── Border ──
    if (hov) {
      ctx.shadowColor = c; ctx.shadowBlur = 8*S;
      ctx.strokeStyle = _hexToRgba(c, 0.95);
      ctx.lineWidth = 2.0*S; ctx.setLineDash([]);
    } else {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = _hexToRgba(c, 0.45);
      ctx.lineWidth = 1.3*S; ctx.setLineDash([5*S, 3*S]);
    }
    ctx.beginPath(); ctx.rect(r.X, r.Y, r.W, r.H); ctx.stroke();
    ctx.setLineDash([]); ctx.shadowBlur = 0;

    // ── Label badge ──
    const padX = hov ? 10*S : 8*S, padY = hov ? 5*S : 4*S;
    const maxBadgeW = r.W - 8*S; // badge must stay inside section

    // Main label: shrink font until text fits within maxBadgeW
    let fs = clamp(7*S, r.H * 0.18, 13*S);
    ctx.font = `700 ${fs}px Interroman, Arial`;
    let tw = ctx.measureText(label).width;
    const maxTW = maxBadgeW - padX * 2;
    if (tw > maxTW && maxTW > 0) {
      fs = Math.max(6*S, fs * (maxTW / tw));
      ctx.font = `700 ${fs}px Interroman, Arial`;
      tw = ctx.measureText(label).width;
    }

    const showSub = r.H > 60*S;

    // Sub-label: also shrink to fit
    let subFs = clamp(5*S, r.H * 0.12, 10*S);
    let stw = 0;
    if (showSub) {
      ctx.font = `400 ${subFs}px Arial`;
      stw = ctx.measureText(sub).width;
      if (stw > maxTW && maxTW > 0) {
        subFs = Math.max(5*S, subFs * (maxTW / stw));
        ctx.font = `400 ${subFs}px Arial`;
        stw = ctx.measureText(sub).width;
      }
    }

    const bw = Math.min(Math.max(tw, stw) + padX * 2, maxBadgeW);
    const bh = showSub ? fs + subFs + padY * 2 + 3*S : fs + padY * 2;
    const bx = Math.max(r.X + 3*S, r.X + r.W*0.5 - bw*0.5);
    const by = r.Y + r.H*0.5 - bh*0.5;

    if (hov) { ctx.shadowColor = c; ctx.shadowBlur = 12*S; }
    ctx.fillStyle = _hexToRgba(c, hov ? 0.96 : 0.80);
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh*0.42); ctx.fill();
    ctx.shadowBlur = 0;

    // Main label text
    const cx_ = bx + bw * 0.5;
    const textY = showSub ? by + padY + fs*0.5 : by + bh*0.5;
    ctx.font = `700 ${fs}px Interroman, Arial`;
    ctx.fillStyle = '#060710';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cx_, textY);

    // Sub-label text
    if (showSub) {
      ctx.font = `400 ${subFs}px Arial`;
      ctx.fillStyle = 'rgba(6,7,16,0.68)';
      ctx.fillText(sub, cx_, by + padY + fs + 3*S + subFs*0.5);
    }

    // Dimension readout (bottom-right corner)
    const dFs = clamp(5*S, r.H * 0.11, 8*S);
    ctx.font = `400 ${dFs}px Arial`;
    ctx.fillStyle = _hexToRgba(c, hov ? 0.70 : 0.42);
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(`${Math.round(r.W/S)} × ${Math.round(r.H/S)} px`, r.X + r.W - 4*S, r.Y + r.H - 3*S);
  }
  ctx.restore();
};

// ── Dispatcher: routes to game-specific bet option renderer ─────────────────
const drawbetOptions = (GEOMETRY) => {
  if (GAME_TYPE === 'gostop')    return drawBetOptionsSimple(GEOMETRY, 'go',  'stop', 'GO',   'STOP');
  if (GAME_TYPE === 'oddeven')   return drawBetOptionsSimple(GEOMETRY, 'odd', 'even', 'ODD',  'EVEN', true);
  if (GAME_TYPE === 'colorgame') return drawBetOptionsColorGame(GEOMETRY);
  return drawBetOptionsBaccarat(GEOMETRY);
};

const drawBetOptionsBaccarat = async (GEOMETRY) => {

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = COLORS.PRIMARYBLACK


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

  const pbH = clamp(5, GEOMETRY['betOptions'].H * 0.016, 8) * scale;
  const pbR = pbH * 0.5;
  const betChipR = GEOMETRY['betOptions'].H * 0.07;
  ctx.setLineDash([])

  // ── Betting status container effect ──
  const bO = GEOMETRY['betOptions'];
  const bettingOpen = gamePhase === 'betting';
  const pulse = (Math.sin(performance.now() * 0.0022) + 1) * 0.5;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bO.X, bO.Y, bO.W, bO.H, borderRadius * 1.1);
  if (bettingOpen) {
    ctx.strokeStyle = `rgba(232,200,74,${0.22 + pulse * 0.30})`;
    ctx.shadowColor = '#e8c84a';
    ctx.shadowBlur = (5 + pulse * 10) * scale;
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.shadowBlur = 0;
  }
  ctx.lineWidth = 1.5 * scale;
  // ctx.stroke();
  ctx.restore();

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
  const playerCardW = clamp(24 * scale, (player.TW - player.R) * 0.28, 46 * scale);
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

  betChipPositions.player = { x: player.X + player.TW * 0.35, y: player.Y + player.LH * 0.55, r: betChipR };

  // -- Stats row (player) --
  {
    const statsY = player.CY - player.R * 0.26;
    const sFS    = clamp(8 * scale, player.R * 0.22, 11 * scale);
    const dotR   = sFS * 0.34;
    const sX     = player.X + betOptionsGap;
    const sW     = player.TW - player.R - betOptionsGap * 2;
    const cnt    = betHistory.filter(b => b.region === 'player').length;
    ctx.save();
    ctx.fillStyle   = COLORS.STROKEBLUE;
    ctx.shadowColor = COLORS.NEONBLUE;
    ctx.shadowBlur  = 5 * scale;
    ctx.beginPath(); ctx.arc(sX + dotR, statsY, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.font = `600 ${sFS}px Interroman, Arial`; ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText(`${cnt} bet${cnt !== 1 ? 's' : ''}`, sX + dotR * 2.6, statsY);
    ctx.fillStyle = '#d6dbb7'; ctx.textAlign = 'end';
    ctx.fillText(fmtCurrency(bets.player), sX + sW, statsY);
  }

  // -- Progress Bar (player — fills left→right) --
  {
    const pBarX = player.X + betOptionsGap;
    const pBarW = player.TW - player.R - betOptionsGap * 2;
    const pbY   = player.CY - player.R * 0.06;
    const pRatio = bets.player / ((bets.player + bets.banker + bets.tie) || 1);
    ctx.beginPath(); ctx.roundRect(pBarX, pbY, pBarW, pbH, pbR);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    if (pRatio > 0) {
      const fw = Math.max(pbH, pBarW * pRatio);
      const pg = ctx.createLinearGradient(pBarX, pbY, pBarX + fw, pbY);
      pg.addColorStop(0, COLORS.STROKEBLUE); pg.addColorStop(1, COLORS.NEONBLUE);
      ctx.save(); ctx.beginPath(); ctx.roundRect(pBarX, pbY, fw, pbH, pbR);
      ctx.fillStyle = pg; ctx.shadowColor = COLORS.NEONBLUE; ctx.shadowBlur = 8 * scale; ctx.fill();
      const shine = ctx.createLinearGradient(pBarX, pbY, pBarX, pbY + pbH);
      shine.addColorStop(0, 'rgba(255,255,255,0.30)'); shine.addColorStop(0.5, 'rgba(255,255,255,0.00)');
      ctx.shadowBlur = 0; ctx.fillStyle = shine; ctx.fill(); ctx.restore();
      if (pRatio < 0.99) {
        ctx.save();
        ctx.beginPath(); ctx.arc(pBarX + fw, pbY + pbH * 0.5, pbH * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.NEONBLUE; ctx.shadowColor = COLORS.NEONBLUE; ctx.shadowBlur = 10 * scale; ctx.fill();
        ctx.restore();
      }
    }
  }


  // ────────────────────────────────────────────────────────────────────────────────────────────────
  // BANKER
  // ────────────────────────────────────────────────────────────────────────────────────────────────
  const banker = {
    X: GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.5 + betOptionsGap,
    Y: GEOMETRY['betOptions'].Y + betOptionsGap,
    TW: GEOMETRY['betOptions'].W * 0.5 - betOptionsGap * 2,
    RH: (GEOMETRY['betOptions'].H * 0.65) * 0.35 - tileSize,
    LH: (GEOMETRY['betOptions'].H * 0.65) - betOptionsGap,
    CX: GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.5,
    CY: GEOMETRY['betOptions'].Y + GEOMETRY['betOptions'].H * 0.65,
    R: arcRadius,
  }

  const bankerStartAngle = Math.atan2(banker.Y - banker.CY, banker.X - banker.CX - betOptionsGap * 0.25);
  const bankerArcX = banker.CX + banker.R * Math.cos(bankerStartAngle);
  const bankerArcY = banker.CY + banker.R * Math.sin(bankerStartAngle);

  const bankerCardsG = 5 * scale
  const bankerCardW = clamp(24 * scale, (banker.TW - banker.R) * 0.28, 46 * scale);
  const bankerCardH = bankerCardW * (4 / 3);
  const bankerCardR = 2 * scale;

  // ******** MIRRORS: const playerCardsX = GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.25 - totalCardWidth;
  const bankerCardsOffset = GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W - (bankerCardW)
  const bankerCardsX = bankerCardsOffset - GEOMETRY['betOptions'].W * 0.25 + totalCardWidth
  const bankerCardsY = banker.Y + (banker.LH) * 0.40;

  const bankerShape = new Path2D();
  bankerShape.moveTo(bankerArcX, banker.Y);
  bankerShape.arc(banker.CX, banker.CY, banker.R, bankerStartAngle, 0, false);
  bankerShape.lineTo(banker.X + banker.TW, banker.Y + banker.LH);
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
  ctx.fillText('BANKER', banker.X + banker.TW / 2 + banker.R / 2, banker.Y + banker.LH * 0.2);

  // -- Odds --
  ctx.fillStyle = "#ffffff";
  ctx.font = `300 ${mainBetfontSize * 0.7}px Interroman, Arial`
  ctx.fillText('0.95:1', banker.X + banker.TW / 2 + banker.R / 2, banker.Y + banker.LH * 0.325);


  if (gamePhase !== 'result') drawBetChip(banker.X + banker.TW * 0.65, banker.Y + banker.LH * 0.55, betChipR, bets.banker);

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


  betChipPositions.banker = { x: banker.X + banker.TW * 0.65, y: banker.Y + banker.LH * 0.55, r: betChipR };

  // -- Stats row (banker — mirrored: amount left, count+dot right) --
  {
    const statsY = banker.CY - banker.R * 0.26;
    const sFS    = clamp(8 * scale, banker.R * 0.22, 11 * scale);
    const dotR   = sFS * 0.34;
    const sRX    = banker.X + banker.TW - betOptionsGap;
    const sW     = banker.TW - banker.R - betOptionsGap * 2;
    const sX     = sRX - sW;
    const cnt    = betHistory.filter(b => b.region === 'banker').length;
    ctx.fillStyle = '#d6dbb7'; ctx.font = `600 ${sFS}px Interroman, Arial`;
    ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillText(fmtCurrency(bets.banker), sX, statsY);
    ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.textAlign = 'end';
    ctx.fillText(`${cnt} bet${cnt !== 1 ? 's' : ''}`, sRX - dotR * 2.6, statsY);
    ctx.save();
    ctx.fillStyle   = COLORS.STROKERED;
    ctx.shadowColor = COLORS.NEONRED;
    ctx.shadowBlur  = 5 * scale;
    ctx.beginPath(); ctx.arc(sRX - dotR, statsY, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // -- Progress Bar (banker — fills right→left) --
  {
    const bBarRX = banker.X + banker.TW - betOptionsGap;
    const bBarW  = banker.TW - banker.R - betOptionsGap * 2;
    const bBarX  = bBarRX - bBarW;
    const pbY    = banker.CY - banker.R * 0.06;
    const bRatio = bets.banker / ((bets.player + bets.banker + bets.tie) || 1);
    ctx.beginPath(); ctx.roundRect(bBarX, pbY, bBarW, pbH, pbR);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    if (bRatio > 0) {
      const fw = Math.max(pbH, bBarW * bRatio);
      const fx = bBarRX - fw;
      const bg = ctx.createLinearGradient(bBarRX, pbY, fx, pbY);
      bg.addColorStop(0, COLORS.STROKERED); bg.addColorStop(1, COLORS.NEONRED);
      ctx.save(); ctx.beginPath(); ctx.roundRect(fx, pbY, fw, pbH, pbR);
      ctx.fillStyle = bg; ctx.shadowColor = COLORS.NEONRED; ctx.shadowBlur = 8 * scale; ctx.fill();
      const shine = ctx.createLinearGradient(fx, pbY, fx, pbY + pbH);
      shine.addColorStop(0, 'rgba(255,255,255,0.30)'); shine.addColorStop(0.5, 'rgba(255,255,255,0.00)');
      ctx.shadowBlur = 0; ctx.fillStyle = shine; ctx.fill(); ctx.restore();
      if (bRatio < 0.99) {
        ctx.save();
        ctx.beginPath(); ctx.arc(fx, pbY + pbH * 0.5, pbH * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.NEONRED; ctx.shadowColor = COLORS.NEONRED; ctx.shadowBlur = 10 * scale; ctx.fill();
        ctx.restore();
      }
    }
  }



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

  betChipPositions.tie = { x: tie.CX, y: tie.CY - tie.R * 0.35, r: betChipR };
  if (gamePhase !== 'result') drawBetChip(tie.CX, tie.CY - tie.R * 0.35, betChipR, bets.tie);

  // -- Stats row (tie — centered: dot+count left half, amount right half) --
  {
    const tBarW  = tie.R * 1.8;
    const tBarX  = tie.CX - tBarW * 0.5;
    const statsY = tie.CY - tie.R * 0.30;
    const sFS    = clamp(8 * scale, tie.R * 0.22, 11 * scale);
    const dotR   = sFS * 0.34;
    const cnt    = betHistory.filter(b => b.region === 'tie').length;
    ctx.save();
    ctx.fillStyle   = COLORS.STROKEGREEN;
    ctx.shadowColor = COLORS.NEONGREEN;
    ctx.shadowBlur  = 5 * scale;
    ctx.beginPath(); ctx.arc(tBarX + dotR, statsY, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.font = `600 ${sFS}px Interroman, Arial`; ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText(`${cnt} bet${cnt !== 1 ? 's' : ''}`, tBarX + dotR * 2.6, statsY);
    ctx.fillStyle = '#d6dbb7'; ctx.textAlign = 'end';
    ctx.fillText(fmtCurrency(bets.tie), tBarX + tBarW, statsY);
  }

  // -- Progress Bar (tie — centered, fills left→right) --
  {
    const tBarW  = tie.R * 1.8;
    const tBarX  = tie.CX - tBarW * 0.5;
    const pbY    = tie.CY - tie.R * 0.06;
    const tRatio = bets.tie / ((bets.player + bets.banker + bets.tie) || 1);
    ctx.beginPath(); ctx.roundRect(tBarX, pbY, tBarW, pbH, pbR);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    if (tRatio > 0) {
      const fw = Math.max(pbH, tBarW * tRatio);
      const tg = ctx.createLinearGradient(tBarX, pbY, tBarX + fw, pbY);
      tg.addColorStop(0, COLORS.STROKEGREEN); tg.addColorStop(1, COLORS.NEONGREEN);
      ctx.save(); ctx.beginPath(); ctx.roundRect(tBarX, pbY, fw, pbH, pbR);
      ctx.fillStyle = tg; ctx.shadowColor = COLORS.NEONGREEN; ctx.shadowBlur = 8 * scale; ctx.fill();
      const shine = ctx.createLinearGradient(tBarX, pbY, tBarX, pbY + pbH);
      shine.addColorStop(0, 'rgba(255,255,255,0.30)'); shine.addColorStop(0.5, 'rgba(255,255,255,0.00)');
      ctx.shadowBlur = 0; ctx.fillStyle = shine; ctx.fill(); ctx.restore();
      if (tRatio < 0.99) {
        ctx.save();
        ctx.beginPath(); ctx.arc(tBarX + fw, pbY + pbH * 0.5, pbH * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.NEONGREEN; ctx.shadowColor = COLORS.NEONGREEN; ctx.shadowBlur = 10 * scale; ctx.fill();
        ctx.restore();
      }
    }
  }


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
      H: (GEOMETRY['betOptions'].H * 0.28),
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
    hitRegions[side.toLowerCase()] = sideShape;
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

  // ── Disabled overlay: dealing phase only, before first card appears ──
  const noCardsYet = playerCards.every(c => !c) && bankerCards.every(c => !c);
  if (gamePhase === 'dealing' && noCardsYet) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bO.X, bO.Y, bO.W, bO.H, borderRadius * 1.1);
    ctx.fillStyle = 'rgba(10,10,20,0.58)';
    ctx.fill();
    // Desaturating gray tint on top
    ctx.beginPath();
    ctx.roundRect(bO.X, bO.Y, bO.W, bO.H, borderRadius * 1.1);
    ctx.fillStyle = 'rgba(80,80,100,0.18)';
    ctx.fill();
    ctx.restore();
  }

  // ── Betting status badge ──
  {
    const statusFs = clamp(8, hRef * 0.055, 10) * scale;
    ctx.font = `700 ${statusFs}px Interroman, Arial`;
    const statusText = bettingOpen ? 'BETTING OPEN' : 'BETTING CLOSED';
    const dotColor = bettingOpen ? '#4ade80' : '#f87171';
    const bgColor = bettingOpen ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.10)';
    const bdColor = bettingOpen ? 'rgba(74,222,128,0.40)' : 'rgba(248,113,113,0.28)';
    const txColor = bettingOpen ? '#bbf7d0' : '#fecaca';

    const dotR = statusFs * 0.24;
    const pad = 8 * scale;
    const pillH = statusFs * 1.8;
    const pillW = ctx.measureText(statusText).width + dotR * 2 + pad * 2.5 + 4 * scale;
    const pillX = bO.X + bO.W * 0.5 - pillW * 0.5;
    const pillY = bO.Y + betOptionsGap;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH * 0.5);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH * 0.5);
    ctx.strokeStyle = bdColor;
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    const dotX = pillX + pad + dotR;
    const dotY = pillY + pillH * 0.5;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    if (bettingOpen) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 4 * scale; }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = txColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusText, dotX + dotR + 4 * scale, dotY);
    ctx.restore();
  }
}

// ── Two-tile bet options — identical arc shapes to baccarat, parameterised ────
const drawBetOptionsSimple = (GEOMETRY, keyA, keyB, labelA, labelB, showBall = false) => {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // ── smaller arc for simple games (no side-bet row needs the space) ──
  const arcRadius    = Math.min(GEOMETRY['betOptions'].W * 0.2, GEOMETRY['betOptions'].H * 0.5) * 0.65;
  const angle        = Math.PI / 90;
  const betOptionsGap = 7 * scale;
  const centerGap     = betOptionsGap;
  const borderRadius = GEOMETRY['betOptions'].H * 0.15;
  const borderWidth  = 2.5 * scale;
  const hRef         = GEOMETRY['betOptions'].H / scale;
  const mainBetfontSize = clamp(11, hRef * 0.10, 18) * scale;
  const pbH          = clamp(5, GEOMETRY['betOptions'].H * 0.016, 8) * scale;
  const pbR          = pbH * 0.5;
  const betChipR     = GEOMETRY['betOptions'].H * 0.07;
  const bO           = GEOMETRY['betOptions'];
  const bettingOpen  = gamePhase === 'betting';
  const betting      = bettingOpen;
  const colorA       = TILE_COLORS[keyA];
  const colorB       = TILE_COLORS[keyB];

  // ── result tint overlay ──
  if (gamePhase === 'result' && winners.length > 0) {
    const w   = winners[0];
    const glow  = (Math.sin(performance.now() * 0.0032) + 1) * 0.5;
    const alpha = 0.06 + glow * 0.20;
    const tintMap = { go:'255,64,64', stop:'64,128,255', odd:'176,64,255', even:'16,192,96' };
    ctx.fillStyle = `rgba(${tintMap[w] || '255,255,255'},${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ── Tile geometry — tiles fill full height; circle centred vertically ──
  const tileCY = bO.Y + bO.H * 0.5;
  const tileLH = bO.H - 2 * betOptionsGap; // full panel height

  // betOptionsGap between circle edge and tile arc boundary on every side
  const center = { CX: bO.X + bO.W * 0.5, CY: tileCY, R: arcRadius - betOptionsGap };
  // Compute arc end angles so each arc lands exactly above its inner edge → lineTo is vertical
  const halfGap   = centerGap * 0.5;
  const safeRatio = arcRadius > 0 ? Math.min(halfGap / arcRadius, 1) : 0;
  const tAEnd     = Math.acos(-safeRatio); // slightly past π/2 → ends at (center − halfGap, …)
  const tBEnd     = Math.acos( safeRatio); // slightly before π/2 → ends at (center + halfGap, …)

  // ── Tile A geometry (mirrors PLAYER) ──
  // Inner gap = betOptionsGap * 0.5 per side so total centre gap = betOptionsGap (same as outer gaps)
  const tA = {
    X: bO.X + betOptionsGap,
    Y: bO.Y + betOptionsGap,
    TW: bO.W * 0.5 - betOptionsGap - centerGap * 0.5,
    LH: tileLH,
    CX: bO.X + bO.W * 0.5,
    CY: tileCY,
    R: arcRadius,
  };
  const tAStart = Math.atan2(tA.Y - tA.CY, (tA.X + tA.TW) - tA.CX);
  const tAArcX  = tA.CX + tA.R * Math.cos(tAStart);
  const shapeA  = new Path2D();
  shapeA.moveTo(tAArcX, tA.Y);
  shapeA.arc(tA.CX, tA.CY, tA.R, tAStart, tAEnd, true);                                          // CCW: top → left → bottom
  shapeA.lineTo(tA.X + tA.TW, bO.Y + bO.H - betOptionsGap);                                      // down to inner edge at panel floor
  shapeA.lineTo(tA.X + borderRadius, bO.Y + bO.H - betOptionsGap);                               // left along floor
  shapeA.arc(tA.X + borderRadius, bO.Y + bO.H - betOptionsGap - borderRadius, borderRadius, Math.PI / 2, Math.PI, false); // bottom-left corner
  shapeA.arc(tA.X + borderRadius, tA.Y + borderRadius, borderRadius, angle * 90, -angle * 45, false);                     // top-left corner
  shapeA.closePath();
  hitRegions[keyA] = shapeA;

  const winA   = gamePhase === 'result' && winners.includes(keyA);
  const blinkA = winA && Math.sin(performance.now() * 0.006) > 0;
  ctx.save();
  ctx.shadowColor = colorA.stroke;
  ctx.shadowBlur  = winA ? (blinkA ? 50*scale : 6*scale) : betting && bets[keyA] > 0 ? 18*scale : 0;
  ctx.strokeStyle = blinkA ? '#ffffff' : colorA.stroke;
  ctx.lineWidth   = (betting && bets[keyA] > 0) || winA ? borderWidth * 1.8 : borderWidth;
  ctx.stroke(shapeA); ctx.shadowBlur = 0;
  ctx.fillStyle = colorA.fill; ctx.fill(shapeA);
  if (blinkA) { ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill(shapeA); }
  if (betting && pressedRegion === keyA) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(shapeA); }
  ctx.restore();

  ctx.fillStyle = '#d6dbb7';
  ctx.font = `600 ${mainBetfontSize}px Interroman, Arial`;
  ctx.fillText(labelA, tA.X + tA.TW * 0.5 - tA.R * 0.5, tA.Y + tA.LH * 0.2);
  ctx.fillStyle = '#fff';
  ctx.font = `300 ${mainBetfontSize * 0.75}px Interroman, Arial`;
  ctx.fillText('1 : 1', tA.X + tA.TW * 0.5 - tA.R * 0.5, tA.Y + tA.LH * 0.325);

  if (gamePhase !== 'result') drawBetChip(tA.X + tA.TW * 0.35, tA.Y + tA.LH * 0.55, betChipR, bets[keyA]);
  betChipPositions[keyA] = { x: tA.X + tA.TW * 0.35, y: tA.Y + tA.LH * 0.55, r: betChipR };

  // Stats A
  { const statsY = bO.Y + bO.H * 0.74;
    const sFS = clamp(8*scale, tA.R * 0.22, 11*scale), dotR = sFS * 0.34;
    const sX = tA.X + betOptionsGap, sW = tA.TW - tA.R - betOptionsGap * 2;
    const cnt = betHistory.filter(b => b.region === keyA).length;
    ctx.save();
    ctx.fillStyle   = colorA.stroke;
    ctx.shadowColor = colorA.neon;
    ctx.shadowBlur  = 5 * scale;
    ctx.beginPath(); ctx.arc(sX + dotR, statsY, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.font = `600 ${sFS}px Interroman, Arial`; ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText(`${cnt} bet${cnt !== 1 ? 's' : ''}`, sX + dotR * 2.6, statsY);
    ctx.fillStyle = '#d6dbb7'; ctx.textAlign = 'end';
    ctx.fillText(fmtCurrency(bets[keyA]), sX + sW, statsY);
  }
  // Progress bar A (left→right)
  { const pBarX = tA.X + betOptionsGap, pBarW = tA.TW - tA.R - betOptionsGap * 2;
    const pbY = bO.Y + bO.H * 0.84;
    const pRatio = bets[keyA] / ((bets[keyA] + bets[keyB]) || 1);
    ctx.beginPath(); ctx.roundRect(pBarX, pbY, pBarW, pbH, pbR);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    if (pRatio > 0) {
      const fw = Math.max(pbH, pBarW * pRatio);
      const pg = ctx.createLinearGradient(pBarX, pbY, pBarX + fw, pbY);
      pg.addColorStop(0, colorA.stroke); pg.addColorStop(1, colorA.neon);
      ctx.save(); ctx.beginPath(); ctx.roundRect(pBarX, pbY, fw, pbH, pbR);
      ctx.fillStyle = pg; ctx.shadowColor = colorA.neon; ctx.shadowBlur = 8*scale; ctx.fill();
      const shine = ctx.createLinearGradient(pBarX, pbY, pBarX, pbY + pbH);
      shine.addColorStop(0, 'rgba(255,255,255,0.30)'); shine.addColorStop(0.5, 'rgba(255,255,255,0.00)');
      ctx.shadowBlur = 0; ctx.fillStyle = shine; ctx.fill(); ctx.restore();
      if (pRatio < 0.99) {
        ctx.save();
        ctx.beginPath(); ctx.arc(pBarX + fw, pbY + pbH * 0.5, pbH * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = colorA.neon; ctx.shadowColor = colorA.neon; ctx.shadowBlur = 10*scale; ctx.fill();
        ctx.restore();
      }
    }
  }

  // ── Tile B geometry (mirrors BANKER) ──
  const tB = {
    X: bO.X + bO.W * 0.5 + centerGap * 0.5,
    Y: bO.Y + betOptionsGap,
    TW: bO.W * 0.5 - betOptionsGap - centerGap * 0.5,
    LH: tileLH,
    CX: bO.X + bO.W * 0.5,
    CY: tileCY,
    R: arcRadius,
  };
  const tBStart = Math.atan2(tB.Y - tB.CY, tB.X - tB.CX);
  const tBArcX  = tB.CX + tB.R * Math.cos(tBStart);
  const shapeB  = new Path2D();
  shapeB.moveTo(tBArcX, tB.Y);
  shapeB.arc(tB.CX, tB.CY, tB.R, tBStart, tBEnd, false);                                                                   // CW: top → right → bottom
  shapeB.lineTo(tB.X, bO.Y + bO.H - betOptionsGap);                                                                        // down to inner edge at panel floor
  shapeB.lineTo(tB.X + tB.TW - borderRadius, bO.Y + bO.H - betOptionsGap);                                                 // right along floor
  shapeB.arc(tB.X + tB.TW - borderRadius, bO.Y + bO.H - betOptionsGap - borderRadius, borderRadius, Math.PI / 2, 0, true); // bottom-right corner
  shapeB.arc(tB.X + tB.TW - borderRadius, tB.Y + borderRadius, borderRadius, angle * 0, -angle * 45, true);                // top-right corner
  shapeB.closePath();
  hitRegions[keyB] = shapeB;

  const winB   = gamePhase === 'result' && winners.includes(keyB);
  const blinkB = winB && Math.sin(performance.now() * 0.006) > 0;
  ctx.save();
  ctx.shadowColor = colorB.stroke;
  ctx.shadowBlur  = winB ? (blinkB ? 50*scale : 6*scale) : betting && bets[keyB] > 0 ? 18*scale : 0;
  ctx.strokeStyle = blinkB ? '#ffffff' : colorB.stroke;
  ctx.lineWidth   = (betting && bets[keyB] > 0) || winB ? borderWidth * 1.8 : borderWidth;
  ctx.stroke(shapeB); ctx.shadowBlur = 0;
  ctx.fillStyle = colorB.fill; ctx.fill(shapeB);
  if (blinkB) { ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill(shapeB); }
  if (betting && pressedRegion === keyB) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(shapeB); }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = `600 ${mainBetfontSize}px Interroman, Arial`;
  ctx.fillStyle = '#d6dbb7';
  ctx.fillText(labelB, tB.X + tB.TW / 2 + tB.R / 2, tB.Y + tB.LH * 0.2);
  ctx.fillStyle = '#ffffff';
  ctx.font = `300 ${mainBetfontSize * 0.70}px Interroman, Arial`;
  ctx.fillText('1 : 1', tB.X + tB.TW / 2 + tB.R / 2, tB.Y + tB.LH * 0.325);

  if (gamePhase !== 'result') drawBetChip(tB.X + tB.TW * 0.65, tB.Y + tB.LH * 0.55, betChipR, bets[keyB]);
  betChipPositions[keyB] = { x: tB.X + tB.TW * 0.65, y: tB.Y + tB.LH * 0.55, r: betChipR };

  // Stats B (mirrored)
  { const statsY = bO.Y + bO.H * 0.74;
    const sFS = clamp(8*scale, tB.R * 0.22, 11*scale), dotR = sFS * 0.34;
    const sRX = tB.X + tB.TW - betOptionsGap, sW = tB.TW - tB.R - betOptionsGap * 2;
    const sX  = sRX - sW;
    const cnt = betHistory.filter(b => b.region === keyB).length;
    ctx.fillStyle = '#d6dbb7'; ctx.font = `600 ${sFS}px Interroman, Arial`;
    ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillText(fmtCurrency(bets[keyB]), sX, statsY);
    ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.textAlign = 'end';
    ctx.fillText(`${cnt} bet${cnt !== 1 ? 's' : ''}`, sRX - dotR * 2.6, statsY);
    ctx.save();
    ctx.fillStyle   = colorB.stroke;
    ctx.shadowColor = colorB.neon;
    ctx.shadowBlur  = 5 * scale;
    ctx.beginPath(); ctx.arc(sRX - dotR, statsY, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Progress bar B (right→left)
  { const bBarRX = tB.X + tB.TW - betOptionsGap, bBarW = tB.TW - tB.R - betOptionsGap * 2;
    const bBarX = bBarRX - bBarW, pbY = bO.Y + bO.H * 0.84;
    const bRatio = bets[keyB] / ((bets[keyA] + bets[keyB]) || 1);
    ctx.beginPath(); ctx.roundRect(bBarX, pbY, bBarW, pbH, pbR);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    if (bRatio > 0) {
      const fw = Math.max(pbH, bBarW * bRatio), fx = bBarRX - fw;
      const bg = ctx.createLinearGradient(bBarRX, pbY, fx, pbY);
      bg.addColorStop(0, colorB.stroke); bg.addColorStop(1, colorB.neon);
      ctx.save(); ctx.beginPath(); ctx.roundRect(fx, pbY, fw, pbH, pbR);
      ctx.fillStyle = bg; ctx.shadowColor = colorB.neon; ctx.shadowBlur = 8*scale; ctx.fill();
      const shine = ctx.createLinearGradient(fx, pbY, fx, pbY + pbH);
      shine.addColorStop(0, 'rgba(255,255,255,0.30)'); shine.addColorStop(0.5, 'rgba(255,255,255,0.00)');
      ctx.shadowBlur = 0; ctx.fillStyle = shine; ctx.fill(); ctx.restore();
      if (bRatio < 0.99) {
        ctx.save();
        ctx.beginPath(); ctx.arc(fx, pbY + pbH * 0.5, pbH * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = colorB.neon; ctx.shadowColor = colorB.neon; ctx.shadowBlur = 10*scale; ctx.fill();
        ctx.restore();
      }
    }
  }

  // ── Center TIE circle (ball for oddeven, round indicator for gostop) ──
  const centerShape = new Path2D();
  centerShape.arc(center.CX, center.CY, center.R, 0, Math.PI * 2); // full circle
  centerShape.closePath();

  if (showBall) {
    const winKey = gamePhase === 'result' ? winners[0] : null;
    const bc     = winKey ? TILE_COLORS[winKey] : null;
    const hasNum = revealNumber !== null;
    ctx.save();
    ctx.shadowColor = bc ? bc.neon : 'rgba(255,255,255,0.18)';
    ctx.shadowBlur  = hasNum ? 22*scale : 4*scale;
    ctx.fillStyle   = bc ? bc.fill : '#0a0816';
    ctx.fill(centerShape);
    ctx.strokeStyle = bc ? bc.stroke : 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = hasNum ? 2.5*scale : (betting && bets[keyA] > 0 ? borderWidth * 1.8 : borderWidth);
    ctx.stroke(centerShape);
    ctx.restore();
    if (hasNum) {
      // Ball number in upper portion, ODD/EVEN label below
      const numFs = clamp(12*scale, center.R * 0.60, 28*scale);
      ctx.font = `900 ${numFs}px Interroman, Arial`; ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = bc ? bc.neon : '#fff'; ctx.shadowBlur = 10*scale;
      ctx.fillText(String(revealNumber), center.CX, center.CY - center.R * 0.18);
      ctx.shadowBlur = 0;
      ctx.font = `400 ${clamp(7*scale, center.R * 0.26, 11*scale)}px Interroman, Arial`;
      ctx.fillStyle = bc ? bc.neon : 'rgba(255,255,255,0.55)';
      ctx.fillText(winKey ? winKey.toUpperCase() : '', center.CX, center.CY + center.R * 0.42);
    } else {
      const t = performance.now() * 0.0014;
      for (let d = 0; d < 3; d++) {
        const a = t + (d / 3) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(center.CX + Math.cos(a) * center.R * 0.40, center.CY + Math.sin(a) * center.R * 0.40,
          center.R * 0.11 * (0.6 + 0.4 * Math.sin(t * 2 + d)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.18 + 0.14 * Math.sin(t + d)})`; ctx.fill();
      }
    }
  } else {
    // GoStop: neutral round counter
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill(centerShape);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = borderWidth * 0.7; ctx.stroke(centerShape);
    const rndFs = clamp(7*scale, center.R * 0.30, 12*scale);
    ctx.font = `600 ${rndFs}px Interroman, Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${results.length + 1}`, center.CX, center.CY - center.R * 0.15);
    ctx.font = `300 ${clamp(6*scale, center.R * 0.22, 9*scale)}px Interroman, Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.fillText('RND', center.CX, center.CY + center.R * 0.26);
    ctx.restore();
  }

  // ── Result overlay — enhanced ──────────────────────────────────────────────
  if (gamePhase === 'result' && winners.length > 0) {
    const t      = performance.now();
    const glow   = (Math.sin(t * 0.003) + 1) * 0.5;
    const wKey   = winners[0];
    const isWinA = wKey === keyA;
    const winTile  = isWinA ? tA : tB;
    const winShape = isWinA ? shapeA : shapeB;
    const loseShp  = isWinA ? shapeB : shapeA;
    const winColor = isWinA ? colorA : colorB;
    const winLbl   = isWinA ? labelA : labelB;
    const profit   = bets[wKey];

    // Always anchor WIN/payout on the winning tile
    const wCX = isWinA ? tA.X + tA.TW * 0.5 - tA.R * 0.5 : tB.X + tB.TW * 0.5 + tB.R * 0.5;
    const wCY = winTile.Y + winTile.LH * 0.40;
    const textCX   = wCX;
    const winFs    = clamp(18*scale, winTile.LH * 0.26, 50*scale);
    const subFs    = clamp(8*scale,  winTile.LH * 0.09, 14*scale);
    const winTextY = wCY - winFs * 0.56;
    const payoutY  = wCY + subFs * 0.55;

    // Helper: hex color → rgb string
    const hr = (h) => `${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)}`;

    // 1 ─ Dim the losing tile
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill(loseShp);
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = scale;
    const lTile = isWinA ? tB : tA;
    for (let d = -lTile.TW; d < lTile.TW + lTile.LH; d += 14*scale) {
      ctx.save(); ctx.clip(loseShp);
      ctx.beginPath();
      ctx.moveTo(lTile.X + d, lTile.Y);
      ctx.lineTo(lTile.X + d + lTile.LH, lTile.Y + lTile.LH);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 2 ─ Radial glow — on winning tile
    ctx.save();
    const rg = ctx.createRadialGradient(wCX, wCY, 0, wCX, wCY, winTile.TW * 0.78);
    rg.addColorStop(0,   `rgba(${hr(winColor.neon)},0.28)`);
    rg.addColorStop(0.5, `rgba(${hr(winColor.stroke)},0.10)`);
    rg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fill(winShape);
    ctx.restore();

    // 3 ─ Orbiting sparkles — orbit winning tile
    ctx.save();
    const orCX = wCX;
    const orCY = wCY;
    const orR  = winTile.TW * 0.28;
    const orRy = orR * 0.52;
    for (let p = 0; p < 6; p++) {
      const a  = t * 0.0018 + (p / 6) * Math.PI * 2;
      const sx = orCX + Math.cos(a) * orR;
      const sy = orCY + Math.sin(a) * orRy;
      const sr = clamp(1.5*scale, (2.8 + Math.sin(a * 2 + t * 0.004) * 1.4)*scale, 5*scale);
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(0.48 + 0.48 * Math.sin(a + t * 0.003)).toFixed(2)})`;
      ctx.shadowColor = winColor.neon; ctx.shadowBlur = 9*scale;
      ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();

    // 4 ─ WIN text
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${winFs}px Interroman, Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = winColor.neon; ctx.shadowBlur = (14 + glow * 22)*scale;
    ctx.fillText('WIN', textCX, winTextY);
    ctx.shadowBlur = 0;

    // 5 ─ Payout (gold, profit only)
    if (profit > 0) {
      ctx.font = `700 ${subFs * 1.3}px Interroman, Arial`;
      ctx.fillStyle = '#fcd34d';
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10*scale;
      ctx.fillText(`+${fmtCurrency(profit)}`, textCX, payoutY);
      ctx.shadowBlur = 0;
    }

    // 6 ─ Outcome label pill — skipped for odd/even (ODD/EVEN already in arc)
    if (!showBall) {
      const plFs = clamp(7*scale, winTile.LH * 0.07, 11*scale);
      ctx.font = `700 ${plFs}px Interroman, Arial`;
      const plW = ctx.measureText(winLbl).width + 16*scale;
      const plH = plFs * 2.1;
      const plX = wCX - plW * 0.5;
      const plY = wCY + winFs * 0.56 + (profit > 0 ? subFs * 2.1 : subFs * 0.8);
      ctx.beginPath(); ctx.roundRect(plX, plY, plW, plH, plH * 0.5);
      ctx.fillStyle = winColor.fill; ctx.fill();
      ctx.strokeStyle = winColor.stroke; ctx.lineWidth = scale; ctx.stroke();
      ctx.fillStyle = winColor.neon; ctx.textBaseline = 'middle';
      ctx.fillText(winLbl, wCX, plY + plH * 0.5);
    }

    ctx.restore();
  }

  // ── Dealing overlay — animated spinner ──────────────────────────────────────
  if (gamePhase === 'dealing') {
    const t = performance.now();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(bO.X, bO.Y, bO.W, bO.H, borderRadius * 1.1);
    ctx.fillStyle = 'rgba(6,7,20,0.68)'; ctx.fill();
    ctx.restore();

    // Spinner ring
    const sR  = clamp(12*scale, bO.H * 0.075, 20*scale);
    const sCX = bO.X + bO.W * 0.5;
    const sCY = bO.Y + bO.H * 0.5;
    const arc = (t * 0.0028) % (Math.PI * 2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sCX, sCY, sR, arc, arc + Math.PI * 1.25);
    ctx.strokeStyle = colorA.stroke;
    ctx.lineWidth = sR * 0.20; ctx.lineCap = 'round'; ctx.stroke();
    // Trailing arc (faint)
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(sCX, sCY, sR, arc + Math.PI * 1.25, arc + Math.PI * 2);
    ctx.strokeStyle = colorA.stroke; ctx.lineWidth = sR * 0.14; ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();  

    // Animated label
    const dealFs = clamp(8*scale, bO.H * 0.058, 11*scale);
    const dotCnt = 1 + Math.floor((t / 480) % 3);
    const dtxt   = (showBall ? 'DRAWING' : 'DEALING') + '.'.repeat(dotCnt);
    ctx.save();
    ctx.font = `600 ${dealFs}px Interroman, Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.60)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(dtxt, sCX, sCY + sR * 1.90);
    ctx.restore();
  }

  // ── Betting status badge (identical to baccarat) ──
  { const statusFs = clamp(8, hRef * 0.055, 10) * scale;
    ctx.font = `700 ${statusFs}px Interroman, Arial`;
    const statusText = bettingOpen ? 'BETTING OPEN' : 'BETTING CLOSED';
    const dotColor   = bettingOpen ? '#4ade80'  : '#f87171';
    const bgColor    = bettingOpen ? 'rgba(74,222,128,0.12)'  : 'rgba(248,113,113,0.10)';
    const bdColor    = bettingOpen ? 'rgba(74,222,128,0.40)'  : 'rgba(248,113,113,0.28)';
    const txColor    = bettingOpen ? '#bbf7d0' : '#fecaca';
    const dotR = statusFs * 0.24, pad = 8*scale;
    const pillH = statusFs * 1.8;
    const pillW = ctx.measureText(statusText).width + dotR * 2 + pad * 2.5 + 4*scale;
    const pillX = bO.X + bO.W * 0.5 - pillW * 0.5;
    const pillY = bO.Y + betOptionsGap;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, pillH * 0.5);
    ctx.fillStyle = bgColor; ctx.fill();
    ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, pillH * 0.5);
    ctx.strokeStyle = bdColor; ctx.lineWidth = 1*scale; ctx.stroke();
    const dotX = pillX + pad + dotR, dotY = pillY + pillH * 0.5;
    ctx.beginPath(); ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    if (bettingOpen) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 4*scale; }
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = txColor; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(statusText, dotX + dotR + 4*scale, dotY);
    ctx.restore();
  }
};

// ── Color Game — 3 dice cubes display ────────────────────────────────────────
const _drawColorGameDice = (x, y, w, h) => {
  const gap = 6 * scale;
  const diceSize = Math.min(h, (w - gap * 4) / 3);
  const totalW = diceSize * 3 + gap * 2;
  const startX = x + (w - totalW) / 2;
  const startY = y + (h - diceSize) / 2;
  const dR = diceSize * 0.16;
  const t = performance.now();
  const isDealing = gamePhase === 'dealing';

  for (let i = 0; i < 3; i++) {
    const dx = startX + i * (diceSize + gap);
    const dy = startY;
    const cx = dx + diceSize / 2;
    const cy = dy + diceSize / 2;

    let colorKey;
    if (isDealing) {
      // Each die independently cycles through colors at different speeds
      const phase = (t * 0.010 + i * 1.7) % COLOR_GAME_KEYS.length;
      colorKey = COLOR_GAME_KEYS[Math.floor(phase)];
    } else {
      colorKey = colorGameDice[i];
    }

    const color = colorKey ? TILE_COLORS[colorKey] : null;

    // ── Die face ──
    ctx.save();
    if (color && !isDealing) {
      ctx.shadowColor = color.neon;
      ctx.shadowBlur  = 18 * scale;
    }
    ctx.beginPath();
    ctx.roundRect(dx, dy, diceSize, diceSize, dR);
    if (color) {
      const fg = ctx.createLinearGradient(dx, dy, dx + diceSize, dy + diceSize);
      fg.addColorStop(0, colorKey === 'white' ? '#c8d0d8' : color.stroke);
      fg.addColorStop(1, color.fill);
      ctx.fillStyle = fg;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color ? color.stroke : 'rgba(255,255,255,0.16)';
    ctx.lineWidth   = 2 * scale;
    ctx.stroke();

    // Diagonal bevel: bright top-left → dark bottom-right
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(dx, dy, diceSize, diceSize, dR);
    ctx.clip();
    const bv = ctx.createLinearGradient(dx, dy, dx + diceSize, dy + diceSize);
    bv.addColorStop(0,   'rgba(255,255,255,0.22)');
    bv.addColorStop(0.5, 'rgba(255,255,255,0)');
    bv.addColorStop(1,   'rgba(0,0,0,0.22)');
    ctx.fillStyle = bv;
    ctx.fillRect(dx, dy, diceSize, diceSize);
    ctx.restore();

    ctx.restore();

    // ── Color label ──
    if (colorKey) {
      const fs = clamp(8 * scale, diceSize * 0.22, 18 * scale);
      ctx.save();
      ctx.font = `700 ${fs}px Interroman, Arial`;
      ctx.fillStyle    = colorKey === 'white' ? '#1a1a2e' : '#ffffff';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      if (!isDealing && color) { ctx.shadowColor = color.neon; ctx.shadowBlur = 8 * scale; }
      ctx.fillText(colorKey.toUpperCase(), cx, cy);
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      ctx.font          = `300 ${diceSize * 0.36}px Interroman, Arial`;
      ctx.fillStyle     = 'rgba(255,255,255,0.18)';
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.fillText('?', cx, cy);
    }

    // Die index label
    ctx.font          = `400 ${clamp(7 * scale, diceSize * 0.16, 11 * scale)}px Interroman, Arial`;
    ctx.fillStyle     = 'rgba(255,255,255,0.28)';
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'top';
    ctx.fillText(`DIE ${i + 1}`, cx, dy + diceSize + 3 * scale);
  }
};

// ── Color Game — 6-tile bet options + dice strip ──────────────────────────────
const drawBetOptionsColorGame = (GEOMETRY) => {
  const bO = GEOMETRY['betOptions'];
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const gap          = 8 * scale;
  const bettingOpen  = gamePhase === 'betting';
  const tileR        = bO.H * 0.06;
  const borderWidth  = 2 * scale;
  const hRef         = bO.H / scale;

  // ── Layout — tiles fill the full bet options height (dice shown in popup) ──
  const tileAreaY  = bO.Y;
  const tileAreaH  = bO.H;
  const COLS = 3, ROWS = 2;
  const tileW = (bO.W - gap * (COLS + 1)) / COLS;
  const tileH = (tileAreaH - gap * (ROWS + 1)) / ROWS;
  const chipR = Math.min(tileW, tileH) * 0.13;

  // Screen-tint on any winning color
  if (gamePhase === 'result' && winners.length > 0) {
    const glow  = (Math.sin(performance.now() * 0.0032) + 1) * 0.5;
    const alpha = 0.04 + glow * 0.12;
    const c     = TILE_COLORS[winners[0]];
    const rgb   = c.neon.slice(1).match(/../g).map(h => parseInt(h, 16)).join(',');
    ctx.fillStyle = `rgba(${rgb},${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ── 6 color tiles ──
  const totalColorBets = COLOR_GAME_KEYS.reduce((s, k) => s + (bets[k] || 0), 0);
  const pbH  = clamp(3 * scale, tileH * 0.030, 6 * scale);
  const pbR2 = pbH * 0.5;
  COLOR_GAME_KEYS.forEach((key, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const tx  = bO.X + gap + col * (tileW + gap);
    const ty  = tileAreaY + gap + row * (tileH + gap);
    const cx  = tx + tileW / 2;
    const cy  = ty + tileH / 2;

    const color    = TILE_COLORS[key];
    const isWin    = gamePhase === 'result' && winners.includes(key);
    const blink    = isWin && Math.sin(performance.now() * 0.006) > 0;
    const hasBet   = bets[key] > 0;
    const matchCnt = colorGameDice.filter(d => d === key).length;

    // Border radius only on the 4 panel outer corners; inner edges are flush
    const rTL = (row === 0       && col === 0)       ? tileR : 0;
    const rTR = (row === 0       && col === COLS - 1) ? tileR : 0;
    const rBR = (row === ROWS - 1 && col === COLS - 1) ? tileR : 0;
    const rBL = (row === ROWS - 1 && col === 0)       ? tileR : 0;
    const shape = new Path2D();
    shape.roundRect(tx, ty, tileW, tileH, [rTL, rTR, rBR, rBL]);
    hitRegions[key] = shape;

    // ── Tile background ──
    ctx.save();
    ctx.shadowColor = color.stroke;
    ctx.shadowBlur  = isWin ? (blink ? 55 * scale : 10 * scale) : hasBet ? 18 * scale : 0;
    ctx.strokeStyle = blink ? '#ffffff' : color.stroke;
    ctx.lineWidth   = (hasBet || isWin) ? borderWidth * 2 : borderWidth;
    ctx.stroke(shape);
    ctx.shadowBlur = 0;
    ctx.fillStyle  = color.fill;
    ctx.fill(shape);
    // Gradient sheen
    const tg = ctx.createLinearGradient(tx, ty, tx, ty + tileH);
    tg.addColorStop(0, 'rgba(255,255,255,0.09)');
    tg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = tg; ctx.fill(shape);
    if (blink) { ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill(shape); }
    if (bettingOpen && pressedRegion === key) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(shape); }

    // Dim + hatch losing tiles during result
    if (gamePhase === 'result' && !isWin) {
      ctx.fillStyle = 'rgba(0,0,0,0.58)'; ctx.fill(shape);
      ctx.save();
      ctx.globalAlpha = 0.10; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = scale;
      for (let d = -tileW; d < tileW + tileH; d += 12 * scale) {
        ctx.save(); ctx.clip(shape);
        ctx.beginPath();
        ctx.moveTo(tx + d, ty); ctx.lineTo(tx + d + tileH, ty + tileH);
        ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    }

    // Dealing dim
    if (gamePhase === 'dealing') {
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(shape);
    }
    ctx.restore();

    // ── Labels — only during betting/dealing ──
    if (gamePhase !== 'result') {
      const nameFs = clamp(9 * scale, tileH * 0.20, 22 * scale);
      const pbMX   = tileW * 0.09;
      const pbW    = tileW - pbMX * 2;
      const chipCY = ty + tileH * 0.44;
      const statsY = ty + tileH * 0.74;
      const barY   = ty + tileH * 0.86;
      const pRatio = bets[key] / (totalColorBets || 1);
      const betCnt = betLog.filter(b => b.region === key).length;

      // ── Color name ──
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = `700 ${nameFs}px Interroman, Arial`;
      ctx.fillStyle    = '#ffffff';
      ctx.fillText(key.toUpperCase(), cx, ty + tileH * 0.21);

      // ── Stats row: [● N bets]  [₱amount] ──
      {
        const sFS  = clamp(5.5 * scale, tileH * 0.058, 9 * scale);
        const dotR = sFS * 0.36;
        // Glowing colored dot
        ctx.save();
        ctx.fillStyle   = color.stroke;
        ctx.shadowColor = color.neon;
        ctx.shadowBlur  = 5 * scale;
        ctx.beginPath(); ctx.arc(tx + pbMX + dotR, statsY, dotR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Bet count
        ctx.font         = `600 ${sFS}px Interroman, Arial`;
        ctx.textAlign    = 'start';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(255,255,255,0.62)';
        ctx.fillText(`${betCnt} bet${betCnt !== 1 ? 's' : ''}`, tx + pbMX + dotR * 2.8, statsY);
        // Amount (right-aligned, neon when bet placed)
        ctx.textAlign = 'end';
        ctx.fillStyle = bets[key] > 0 ? color.neon : 'rgba(255,255,255,0.22)';
        ctx.fillText(bets[key] > 0 ? fmtCurrency(bets[key]) : '· · ·', tx + tileW - pbMX, statsY);
      }

      // ── Bar track ──
      ctx.beginPath(); ctx.roundRect(tx + pbMX, barY, pbW, pbH, pbR2);
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();

      // ── Filled portion: gradient + glow + shine overlay + glowing endcap ──
      if (pRatio > 0) {
        const fw = Math.max(pbH, pbW * pRatio);
        const pg = ctx.createLinearGradient(tx + pbMX, barY, tx + pbMX + fw, barY);
        pg.addColorStop(0, color.stroke);
        pg.addColorStop(1, color.neon);
        ctx.save();
        ctx.beginPath(); ctx.roundRect(tx + pbMX, barY, fw, pbH, pbR2);
        ctx.fillStyle   = pg;
        ctx.shadowColor = color.neon;
        ctx.shadowBlur  = 8 * scale;
        ctx.fill();
        // Shine highlight on top half of fill
        const shine = ctx.createLinearGradient(tx + pbMX, barY, tx + pbMX, barY + pbH);
        shine.addColorStop(0,   'rgba(255,255,255,0.30)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0.00)');
        ctx.shadowBlur = 0;
        ctx.fillStyle  = shine;
        ctx.fill();
        ctx.restore();
        // Glowing endcap at fill tip
        if (pRatio < 0.99) {
          const tipX = tx + pbMX + fw;
          ctx.save();
          ctx.beginPath(); ctx.arc(tipX, barY + pbH * 0.5, pbH * 0.75, 0, Math.PI * 2);
          ctx.fillStyle   = color.neon;
          ctx.shadowColor = color.neon;
          ctx.shadowBlur  = 10 * scale;
          ctx.fill();
          ctx.restore();
        }
      }

      // ── Chip ──
      if (gamePhase === 'betting') {
        drawBetChip(cx, chipCY, chipR, bets[key]);
      }
    }
    betChipPositions[key] = { x: cx, y: ty + tileH * 0.44, r: chipR };

    // ── WIN result overlay on each winning tile ──
    if (isWin) {
      const t    = performance.now();
      const glow = (Math.sin(t * 0.003) + 1) * 0.5;
      const profit = bets[key] * matchCnt;

      // Radial glow fill
      ctx.save();
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, tileW * 0.70);
      rg.addColorStop(0, 'rgba(255,255,255,0.22)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fill(shape);

      // Orbiting sparkles
      for (let p = 0; p < 5; p++) {
        const a  = t * 0.0020 + (p / 5) * Math.PI * 2;
        const sx = cx + Math.cos(a) * tileW * 0.34;
        const sy = cy + Math.sin(a) * tileH * 0.28;
        const sr = clamp(1.5 * scale, (2.5 + Math.sin(a * 2 + t * 0.004) * 1.2) * scale, 4.5 * scale);
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle  = `rgba(255,255,255,${(0.45 + 0.45 * Math.sin(a + t * 0.003)).toFixed(2)})`;
        ctx.shadowColor = color.neon; ctx.shadowBlur = 8 * scale;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // WIN text
      const winFs = clamp(13 * scale, tileH * 0.24, 40 * scale);
      ctx.font      = `900 ${winFs}px Interroman, Arial`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color.neon; ctx.shadowBlur = (12 + glow * 20) * scale;
      ctx.fillText('WIN', cx, ty + tileH * (profit > 0 ? 0.24 : 0.35));
      ctx.shadowBlur = 0;

      // Multiplier badge (×2, ×3 — shown only when more than 1 die matched)
      if (matchCnt > 1) {
        const mFs = clamp(8 * scale, tileH * 0.16, 22 * scale);
        ctx.font      = `700 ${mFs}px Interroman, Arial`;
        ctx.fillStyle = color.neon;
        ctx.fillText(`×${matchCnt}`, cx, ty + tileH * 0.46);
      }

      // Payout
      if (profit > 0) {
        const payFs = clamp(8 * scale, tileH * 0.14, 18 * scale);
        ctx.font      = `700 ${payFs}px Interroman, Arial`;
        ctx.fillStyle = '#fcd34d';
        ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8 * scale;
        ctx.fillText(`+${fmtCurrency(profit)}`, cx, ty + tileH * (matchCnt > 1 ? 0.66 : 0.58));
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  });

  // ── Betting-open status badge ──
  { const statusFs = clamp(8, hRef * 0.055, 10) * scale;
    ctx.font = `700 ${statusFs}px Interroman, Arial`;
    const statusText = bettingOpen ? 'BETTING OPEN' : 'BETTING CLOSED';
    const dotColor   = bettingOpen ? '#4ade80'  : '#f87171';
    const bgColor    = bettingOpen ? 'rgba(74,222,128,0.12)'  : 'rgba(248,113,113,0.10)';
    const bdColor    = bettingOpen ? 'rgba(74,222,128,0.40)'  : 'rgba(248,113,113,0.28)';
    const txColor    = bettingOpen ? '#bbf7d0' : '#fecaca';
    const dotR = statusFs * 0.24, pad = 8 * scale;
    const pillH = statusFs * 1.8;
    const pillW = ctx.measureText(statusText).width + dotR * 2 + pad * 2.5 + 4 * scale;
    const pillX = bO.X + bO.W * 0.5 - pillW * 0.5;
    const pillY = bO.Y + gap * 0.5; // top-centre float, above tile content
    ctx.save();
    ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, pillH * 0.5);
    ctx.fillStyle = bgColor; ctx.fill();
    ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, pillH * 0.5);
    ctx.strokeStyle = bdColor; ctx.lineWidth = 1 * scale; ctx.stroke();
    const dotX = pillX + pad + dotR, dotY = pillY + pillH * 0.5;
    ctx.beginPath(); ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    if (bettingOpen) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 4 * scale; }
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = txColor; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(statusText, dotX + dotR + 4 * scale, dotY);
    ctx.restore();
  }
};

// ── Color Game — dice result popup (drawn on top of everything) ──────────────
const _drawColorGameResultPopup = (GEOMETRY) => {
  if (gamePhase !== 'dealing' && gamePhase !== 'result') return;

  const vid  = GEOMETRY['video'];
  const t    = performance.now();
  const isDealing = gamePhase === 'dealing';
  const gap  = 10 * scale;

  // ── Scrim over video area ──
  ctx.fillStyle = 'rgba(6,7,20,0.62)';
  ctx.fillRect(vid.X, vid.Y, vid.W, vid.H);

  // ── Popup geometry ──
  const popW    = Math.min(containerWidth * 0.84, 400 * scale);
  const diceH   = clamp(52 * scale, popW * 0.20, 96 * scale);
  const labelH  = clamp(11 * scale, diceH * 0.20, 16 * scale);
  const titleH  = gap * 2.6;
  const popH    = gap + titleH + gap * 0.8 + diceH + labelH + gap * 1.5;
  const popX    = vid.X + vid.W * 0.5 - popW * 0.5;
  const popY    = vid.Y + vid.H * 0.5 - popH * 0.5;
  const popR    = 10 * scale;

  // ── Glass panel background ──
  ctx.save();
  ctx.beginPath(); ctx.roundRect(popX, popY, popW, popH, popR);
  ctx.fillStyle = 'rgba(8,8,22,0.88)'; ctx.fill();
  const shimmer = ctx.createLinearGradient(popX, popY, popX, popY + popH * 0.4);
  shimmer.addColorStop(0, 'rgba(255,255,255,0.07)');
  shimmer.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.roundRect(popX, popY, popW, popH, popR);
  ctx.fillStyle = shimmer; ctx.fill();
  ctx.beginPath(); ctx.roundRect(popX, popY, popW, popH, popR);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = scale; ctx.stroke();
  ctx.restore();

  // ── Title row ──
  const dotCnt   = 1 + Math.floor((t / 460) % 3);
  const titleTxt = isDealing ? `ROLLING${'.'.repeat(dotCnt)}` : 'RESULT';
  const titleFs  = clamp(10 * scale, titleH * 0.56, 16 * scale);
  ctx.save();
  ctx.font      = `700 ${titleFs}px Interroman, Arial`;
  ctx.fillStyle = isDealing ? 'rgba(255,255,255,0.65)' : '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (!isDealing) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8 * scale; }
  ctx.fillText(titleTxt, popX + popW * 0.5, popY + gap + titleH * 0.5);
  ctx.shadowBlur = 0;

  // Thin divider
  ctx.beginPath();
  ctx.moveTo(popX + gap * 2, popY + gap + titleH + gap * 0.5);
  ctx.lineTo(popX + popW - gap * 2, popY + gap + titleH + gap * 0.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = scale; ctx.stroke();
  ctx.restore();

  // ── 3 dice ──
  const diceAreaY = popY + gap + titleH + gap;
  _drawColorGameDice(popX + gap, diceAreaY, popW - gap * 2, diceH + labelH);

  // ── Result footer: winning color pills ──
  if (!isDealing && winners.length > 0) {
    const winCounts = {};
    colorGameDice.forEach(c => { if (c) winCounts[c] = (winCounts[c] || 0) + 1; });
    const pillFs   = clamp(8 * scale, titleFs * 0.75, 12 * scale);
    const pillH2   = pillFs * 1.8;
    const pillGap  = 6 * scale;
    ctx.font = `700 ${pillFs}px Interroman, Arial`;
    // Measure total width to centre the row
    const items = Object.entries(winCounts).map(([k, cnt]) => ({
      key: k, cnt,
      lbl: cnt > 1 ? `${k.toUpperCase()} ×${cnt}` : k.toUpperCase(),
    }));
    const widths  = items.map(it => ctx.measureText(it.lbl).width + pillFs * 1.2);
    const totalW  = widths.reduce((a, b) => a + b, 0) + pillGap * (items.length - 1);
    let px = popX + popW * 0.5 - totalW * 0.5;
    const py = diceAreaY + diceH + labelH + gap * 0.4;
    items.forEach((it, idx) => {
      const c  = TILE_COLORS[it.key];
      const pw = widths[idx];
      ctx.save();
      ctx.beginPath(); ctx.roundRect(px, py, pw, pillH2, pillH2 * 0.5);
      ctx.fillStyle = c.fill; ctx.fill();
      ctx.strokeStyle = c.stroke; ctx.lineWidth = scale; ctx.stroke();
      ctx.fillStyle   = c.neon;
      ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = c.neon; ctx.shadowBlur = 6 * scale;
      ctx.fillText(it.lbl, px + pw * 0.5, py + pillH2 * 0.5);
      ctx.shadowBlur = 0;
      ctx.restore();
      px += pw + pillGap;
    });
  }
};

const drawStatistics = (GEOMETRY) => {

  ctx.setLineDash([])

  const gE = GEOMETRY['statisticsGridE'];
  const gA = GEOMETRY['statisticsGridA'];

  const summaryRatio = 0.20;
  const scoreBoardRatio = 1 - summaryRatio;

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
  };

  // Glassmorphic panel backgrounds
  ;[gE, gA].forEach(g => {
    const panelR = 6 * scale;
    ctx.beginPath();
    ctx.roundRect(g.X, g.Y, g.W, g.H, panelR);
    const grad = ctx.createLinearGradient(g.X, g.Y, g.X, g.Y + g.H);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
    ctx.lineWidth = 0.8 * scale;
    ctx.stroke();
  });


  // -- Fetch the Data here
  const goCount   = results.filter(r => r.value === 'G').length;
  const stopCount = results.filter(r => r.value === 'S').length;
  const oddCount  = results.filter(r => r.value === 'O').length;
  const evenCount = results.filter(r => r.value === 'E').length;
  const pCount    = results.filter(r => r.value === 'P').length;
  const bCount    = results.filter(r => r.value === 'B').length;
  const tCount    = results.filter(r => r.value === 'T').length;
  // colorgame: count each color across all dice faces
  const cgCounts  = GAME_TYPE === 'colorgame'
    ? COLOR_GAME_KEYS.reduce((acc, k) => {
        acc[k] = results.reduce((n, r) => n + (r.dice || []).filter(d => d === k).length, 0);
        return acc;
      }, {})
    : {};

  const stats = GAME_TYPE === 'gostop' ? {
    gameNo:         { bg: null,                hasIcon: false, value: results.length },
    goTotal:        { bg: TILE_COLORS.go.stroke,   hasIcon: true,  value: goCount,   label: 'G' },
    stopTotal:      { bg: TILE_COLORS.stop.stroke, hasIcon: true,  value: stopCount, label: 'S' },
    goPrediction:   { bg: TILE_COLORS.go.stroke,   isPred: true,   predKey: 'go'  },
    stopPrediction: { bg: TILE_COLORS.stop.stroke, isPred: true,   predKey: 'stop' },
  } : GAME_TYPE === 'oddeven' ? {
    gameNo:         { bg: null,                 hasIcon: false, value: results.length },
    oddTotal:       { bg: TILE_COLORS.odd.stroke,  hasIcon: true,  value: oddCount,  label: 'O' },
    evenTotal:      { bg: TILE_COLORS.even.stroke, hasIcon: true,  value: evenCount, label: 'E' },
    oddPrediction:  { bg: TILE_COLORS.odd.stroke,  isPred: true,   predKey: 'odd'  },
    evenPrediction: { bg: TILE_COLORS.even.stroke, isPred: true,   predKey: 'even' },
  } : GAME_TYPE === 'colorgame' ? {
    gameNo:      { bg: null,                      hasIcon: false, value: results.length },
    redCount:    { bg: TILE_COLORS.red.stroke,    hasIcon: true,  value: cgCounts.red,    label: 'R' },
    blueCount:   { bg: TILE_COLORS.blue.stroke,   hasIcon: true,  value: cgCounts.blue,   label: 'B' },
    yellowCount: { bg: TILE_COLORS.yellow.stroke, hasIcon: true,  value: cgCounts.yellow, label: 'Y' },
    greenCount:  { bg: TILE_COLORS.green.stroke,  hasIcon: true,  value: cgCounts.green,  label: 'G' },
    whiteCount:  { bg: TILE_COLORS.white.stroke,  hasIcon: true,  value: cgCounts.white,  label: 'W' },
    pinkCount:   { bg: TILE_COLORS.pink.stroke,   hasIcon: true,  value: cgCounts.pink,   label: 'P' },
  } : {
    gameNo: { bg: null, hasIcon: false, value: 42 },
    playerTotal: { bg: COLORS.PLAYERBLUE, hasIcon: true, value: pCount,  label: 'P' },
    bankerTotal: { bg: COLORS.BANKERRED,  hasIcon: true, value: bCount,  label: 'B' },
    tieTotal:    { bg: COLORS.TIEGREEN,   hasIcon: true, value: tCount,  label: 'T' },
    playerPairTotal: { bg: COLORS.PLAYERBLUE, hasIcon: true, value: 3, label: 'PP' },
    bankerPairTotal: { bg: COLORS.BANKERRED,  hasIcon: true, value: 3, label: 'BP' },
    playerPrediction: { bg: COLORS.PLAYERBLUE, isPred: true, predKey: 'player' },
    bankerPrediction: { bg: COLORS.BANKERRED,  isPred: true, predKey: 'banker' },
  }
  const cols = Object.keys(stats).length;


  // ── Summary bar: two-tier layout (badge row + value row) ──
  const slotW  = summary.W / cols;
  const icoR   = clamp(4 * scale, summary.H * 0.20, 8 * scale);
  const valFs  = clamp(8 * scale, summary.H * 0.30, 13 * scale);
  const lblFs  = clamp(5 * scale, summary.H * 0.18, 9  * scale);
  const badgeY = summary.Y + summary.H * 0.34;   // center of badge row
  const valY   = summary.Y + summary.H * 0.72;   // center of value row
  const pctY   = summary.Y + summary.H * 0.90;   // sub-label (% or ratio)

  // Total non-tie results for percentage calculation
  const totalForPct = results.filter(r => r.value !== 'T').length || 1;
  const cgTotalDice = GAME_TYPE === 'colorgame'
    ? (results.reduce((n, r) => n + (r.dice ? r.dice.length : 0), 0) || 1)
    : 1;

  ctx.save();
  ctx.beginPath();
  ctx.rect(summary.X, summary.Y, summary.W, summary.H);
  ctx.clip();

  // Background gradient
  const sumGrad = ctx.createLinearGradient(summary.X, summary.Y, summary.X, summary.Y + summary.H);
  sumGrad.addColorStop(0, 'rgba(255,255,255,0.09)');
  sumGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = sumGrad;
  ctx.fillRect(summary.X, summary.Y, summary.W, summary.H);

  // Bottom border
  ctx.beginPath();
  ctx.moveTo(summary.X, summary.Y + summary.H);
  ctx.lineTo(summary.X + summary.W, summary.Y + summary.H);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 0.5 * scale;
  ctx.stroke();

  let slotIndex = 0;
  for (const [key, obj] of Object.entries(stats)) {
    const slotMidX = summary.X + slotIndex * slotW + slotW * 0.5;

    // Vertical separator (skip first)
    if (slotIndex > 0) {
      ctx.beginPath();
      ctx.moveTo(summary.X + slotIndex * slotW, summary.Y + summary.H * 0.15);
      ctx.lineTo(summary.X + slotIndex * slotW, summary.Y + summary.H * 0.85);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 0.5 * scale;
      ctx.stroke();
    }

    ctx.textBaseline = 'middle';

    if (obj.hasIcon) {
      const lbl = obj.label || key.toUpperCase()[0];
      const pct = GAME_TYPE === 'colorgame'
        ? Math.round((cgCounts[key.replace('Count', '')] || obj.value) / cgTotalDice * 100)
        : Math.round(obj.value / totalForPct * 100);

      // Colored pill badge
      const pillW = icoR * 2.8, pillH = icoR * 1.7, pillR = pillH * 0.5;
      const pillX = slotMidX - pillW * 0.5, pillY = badgeY - pillH * 0.5;
      ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
      ctx.fillStyle = obj.bg + 'cc'; ctx.fill();
      ctx.strokeStyle = obj.bg; ctx.lineWidth = 0.7 * scale; ctx.stroke();
      ctx.font = `700 ${lblFs}px Interroman, Arial`;
      ctx.fillStyle = key.includes('white') || key.includes('White') ? '#1a1a2e' : '#fff';
      ctx.textAlign = 'center'; ctx.fillText(lbl, slotMidX, badgeY);

      // Count value
      ctx.font = `600 ${valFs}px Interroman, Arial`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.fillText(String(obj.value), slotMidX, valY);

      // Percentage sub-label
      if (summary.H > 28 * scale) {
        ctx.font = `400 ${lblFs * 0.88}px Interroman, Arial`;
        ctx.fillStyle = obj.bg + 'bb';
        ctx.fillText(`${pct}%`, slotMidX, pctY);
      }

    } else if (key === 'gameNo') {
      // "GAME" label on top row, number on value row
      ctx.font = `400 ${lblFs}px Interroman, Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.40)';
      ctx.textAlign = 'center'; ctx.fillText('GAME', slotMidX, badgeY);
      ctx.font = `700 ${valFs * 1.1}px Interroman, Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.fillText(String(obj.value), slotMidX, valY);

    } else if (obj.isPred) {
      // Prediction capsule — trend dots + arrow
      const capH = clamp(10 * scale, summary.H * 0.44, 16 * scale);
      const capW = clamp(32 * scale, slotW * 0.78, 52 * scale);
      const capX = slotMidX - capW * 0.5, capY = badgeY - capH * 0.5;
      const capR = capH * 0.5;
      const dot  = clamp(1.5 * scale, capH * 0.16, 3.2 * scale);
      const col  = obj.bg;
      ctx.beginPath(); ctx.roundRect(capX, capY, capW, capH, capR);
      ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fill();
      ctx.strokeStyle = col + 'aa'; ctx.lineWidth = 0.7 * scale; ctx.stroke();

      // Two-dot pattern
      ctx.beginPath(); ctx.arc(slotMidX - dot * 2.2, badgeY, dot, 0, Math.PI * 2);
      ctx.strokeStyle = col; ctx.lineWidth = 0.6 * scale; ctx.stroke();
      ctx.beginPath(); ctx.arc(slotMidX + dot * 0.4, badgeY, dot, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      // Arrow
      ctx.beginPath();
      ctx.moveTo(slotMidX + dot * 2.6, badgeY + dot * 0.8);
      ctx.lineTo(slotMidX + dot * 4.2, badgeY - dot * 0.4);
      ctx.strokeStyle = col; ctx.lineWidth = 0.8 * scale; ctx.lineCap = 'round'; ctx.stroke();

      // Label below
      ctx.font = `500 ${lblFs}px Interroman, Arial`;
      ctx.fillStyle = col + 'cc';
      ctx.textAlign = 'center';
      ctx.fillText((obj.predKey || '').toUpperCase().slice(0, 3), slotMidX, valY);
    }

    slotIndex++;
  }

  ctx.restore();





  // --- Scoreboards — inset 5% on each side so grid sits at ~90% of panel area ---
  const sbPadX = gE.W * 0.05;
  const sbPadY = gE.H * 0.04;
  const scoreBoardE = {
    X: gE.X + sbPadX,
    Y: gE.Y + gE.H * summaryRatio + sbPadY,
    W: gE.W - sbPadX * 2,
    H: gE.H * scoreBoardRatio - sbPadY * 2,
  };
  const sbPadXA = gA.W * 0.05;
  const sbPadYA = gA.H * 0.04;
  const scoreBoardA = {
    X: gA.X + sbPadXA,
    Y: gA.Y + gA.H * summaryRatio + sbPadYA,
    W: gA.W - sbPadXA * 2,
    H: gA.H * scoreBoardRatio - sbPadYA * 2,
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

  const BEAD_MAP = GAME_TYPE === 'gostop'
    ? { G: TILE_COLORS.go.stroke,   S: TILE_COLORS.stop.stroke  }
    : GAME_TYPE === 'oddeven'
    ? { O: TILE_COLORS.odd.stroke,  E: TILE_COLORS.even.stroke  }
    : { P: COLORS.PLAYERBLUE, B: COLORS.BANKERRED, T: COLORS.TIEGREEN };

  const populateBeadRoad = (grid) => {
    const { rows, cols, posX, posY, cellW, cellH } = grid;
    results.forEach((result, index) => {
      const col = Math.floor(index / rows);
      if (col >= cols) return;
      const row = index % rows;
      const cx = posX + col * cellW + cellW / 2;
      const cy = posY + row * cellH + cellH / 2;
      const r = cellW * 0.45;
      const bg = BEAD_MAP[result.value] || COLORS.TIEGREEN;
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2, false); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${clamp(8 * scale, r * 0.95, r * 1.2)}px Interroman, Arial`;
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
        const r  = cellW * 0.4;
        const color = BEAD_MAP[entry.value] || COLORS.BANKERRED;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2, false); ctx.closePath();
        ctx.strokeStyle = color; ctx.lineWidth = 1.6 * scale; ctx.stroke();
        if (entry.ties > 0) {
          ctx.save();
          ctx.strokeStyle = COLORS.TIEGREEN; ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.65, cy + r * 0.65); ctx.lineTo(cx + r * 0.65, cy - r * 0.65);
          ctx.stroke(); ctx.restore();
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
  if (GAME_TYPE === 'colorgame') {
    // ── Color Game: both sections side-by-side inside gE (color stats no longer in gA) ──
    maxScrollXA = 0; maxScrollXE = 0;

    // ── LEFT column: recent rolls (1/4); RIGHT column: color stats (3/4) ──
    const divW      = 1 * scale;
    const rollsW    = Math.floor(scoreBoardE.W * 0.25);
    const statsX    = scoreBoardE.X + rollsW + divW;
    const statsW    = scoreBoardE.W - rollsW - divW;

    // Thin vertical divider
    ctx.beginPath();
    ctx.moveTo(scoreBoardE.X + rollsW, scoreBoardE.Y);
    ctx.lineTo(scoreBoardE.X + rollsW, scoreBoardE.Y + scoreBoardE.H);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = divW; ctx.stroke();

    // Layout metrics for the rolls column
    const cgHdrFs   = clamp(5 * scale, scoreBoardE.H * 0.055, 9 * scale);
    const topPad    = cgHdrFs + 3 * scale;
    const cgGap     = clamp(2 * scale, rollsW * 0.035, 4 * scale);
    const rnColW    = clamp(7 * scale, rollsW * 0.14, 13 * scale);
    const diceAreaW = rollsW - rnColW;
    const DPER      = 3;
    const cgRounds  = results.slice().reverse();
    const isLive    = gamePhase === 'dealing' || gamePhase === 'result';
    const contentH  = scoreBoardE.H - topPad;

    const histForSizing = Math.max(1, Math.min(cgRounds.length, 15));
    const cellSzW       = (diceAreaW - cgGap * (DPER + 1)) / DPER;
    const cellSzH       = (contentH - cgGap) / histForSizing;
    const cellSz        = Math.min(cellSzW, cellSzH);
    const rowH          = cellSz + cgGap;
    const maxRows       = Math.floor(contentH / rowH);
    const histCount     = Math.min(cgRounds.length, maxRows);
    const usedH         = histCount * rowH;

    // ── Recent rolls (clipped to left quarter) ──
    ctx.save();
    ctx.beginPath(); ctx.rect(scoreBoardE.X, scoreBoardE.Y, rollsW, scoreBoardE.H); ctx.clip();

    // Section label
    ctx.font = `500 ${cgHdrFs}px Interroman, Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('RECENT ROLLS', scoreBoardE.X + 2 * scale, scoreBoardE.Y + 1 * scale);

    // Helper — draw one dice row at a given Y, given an array of 3 color keys
    const drawDiceRow = (dice, rowIdx, dy, isLatest, isLiveRow) => {
      const t = performance.now();
      dice.forEach((colorKeyRaw, di) => {
        let colorKey = colorKeyRaw;
        // Cycling animation for live row during dealing
        if (isLiveRow && gamePhase === 'dealing') {
          const phase = (t * 0.010 + di * 1.7) % COLOR_GAME_KEYS.length;
          colorKey = COLOR_GAME_KEYS[Math.floor(phase)];
        }
        const c = colorKey ? TILE_COLORS[colorKey] : null;
        const dx = scoreBoardE.X + rnColW + cgGap + di * (cellSz + cgGap);

        // Cell background
        ctx.beginPath(); ctx.roundRect(dx, dy, cellSz, cellSz, cellSz * 0.20);
        if (c) {
          const cg = ctx.createLinearGradient(dx, dy, dx, dy + cellSz);
          cg.addColorStop(0, c.stroke + '55'); cg.addColorStop(1, c.fill + 'dd');
          ctx.fillStyle = cg;
        } else {
          ctx.fillStyle = isLiveRow ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
        }
        ctx.fill();

        // Border
        if (c) {
          ctx.save();
          const glow = isLiveRow && gamePhase === 'result';
          if (glow) { ctx.shadowColor = c.neon; ctx.shadowBlur = 6 * scale; }
          ctx.strokeStyle = (isLatest || glow) ? c.neon : c.stroke + '88';
          ctx.lineWidth   = (isLatest || glow)  ? 1.2 * scale : 0.6 * scale;
          ctx.stroke(); ctx.restore();
        } else if (isLiveRow) {
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.8 * scale; ctx.stroke();
        }

        // Letter / question mark
        if (colorKey) {
          const fs = clamp(5 * scale, cellSz * 0.32, 11 * scale);
          ctx.font = `700 ${fs}px Interroman, Arial`;
          ctx.fillStyle = colorKey === 'white' ? '#1a1a2e' : '#fff';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (isLiveRow && gamePhase === 'result' && c) { ctx.shadowColor = c.neon; ctx.shadowBlur = 5 * scale; }
          ctx.fillText(colorKey[0].toUpperCase(), dx + cellSz * 0.5, dy + cellSz * 0.5);
          ctx.shadowBlur = 0;
        } else if (isLiveRow) {
          const fs = clamp(5 * scale, cellSz * 0.36, 12 * scale);
          ctx.font = `300 ${fs}px Interroman, Arial`;
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const dotCnt = 1 + Math.floor((t / 300) % 3);
          ctx.fillText('.'.repeat(dotCnt), dx + cellSz * 0.5, dy + cellSz * 0.5);
        }
      });
    };

    // ── Draw history rows ──
    cgRounds.slice(0, histCount).forEach((r, rowIdx) => {
      const dice     = r.dice || [null, null, null];
      const dy       = scoreBoardE.Y + topPad + rowIdx * rowH + cgGap * 0.5;
      const isLatest = rowIdx === 0 && !isLive;
      const rn       = results.length - rowIdx;

      ctx.font = `400 ${clamp(4 * scale, cellSz * 0.28, 8 * scale)}px Interroman, Arial`;
      ctx.fillStyle = isLatest ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(`${rn}`, scoreBoardE.X + rnColW - 2 * scale, dy + cellSz * 0.5);

      drawDiceRow(dice, rowIdx, dy, isLatest, false);
    });

    // ── Live dice in remaining space ──
    if (isLive) {
      const liveY = scoreBoardE.Y + topPad + usedH;
      const remH  = contentH - usedH;

      // Separator between history and live
      if (histCount > 0) {
        ctx.beginPath();
        ctx.moveTo(scoreBoardE.X + 2 * scale, liveY + cgGap * 0.3);
        ctx.lineTo(scoreBoardE.X + rollsW - 2 * scale, liveY + cgGap * 0.3);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5 * scale;
        ctx.setLineDash([2 * scale, 3 * scale]); ctx.stroke(); ctx.setLineDash([]);
      }

      // Status tag (ROLLING... or RESULT)
      const t0       = performance.now();
      const isDealing0 = gamePhase === 'dealing';
      const tagFs    = clamp(4.5 * scale, cellSz * 0.22, 8 * scale);
      const dotCnt0  = 1 + Math.floor((t0 / 460) % 3);
      const tagTxt   = isDealing0 ? `ROLLING${'.'.repeat(dotCnt0)}` : 'RESULT';
      ctx.font = `600 ${tagFs}px Interroman, Arial`;
      ctx.fillStyle = isDealing0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,220,100,0.90)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(tagTxt, scoreBoardE.X + rollsW - 2 * scale, liveY + cgGap + cellSz * 0.5);

      // Live dice — same row height as history
      const liveDy = liveY + cgGap * 0.5;
      const liveDice = isDealing0 ? [null, null, null] : colorGameDice;
      drawDiceRow(liveDice, -1, liveDy, false, true);

      // Winning pills if result + more room below
      if (!isDealing0 && winners.length > 0 && remH > rowH + tagFs * 2.4) {
        const winCounts = {};
        colorGameDice.forEach(c => { if (c) winCounts[c] = (winCounts[c] || 0) + 1; });
        const pillFs  = clamp(5 * scale, cellSz * 0.22, 8 * scale);
        const pillH2  = pillFs * 1.8;
        const pillGap = 4 * scale;
        ctx.font = `700 ${pillFs}px Interroman, Arial`;
        const items = Object.entries(winCounts).map(([k, cnt]) => ({
          key: k, cnt, lbl: cnt > 1 ? `${k[0].toUpperCase()}×${cnt}` : k[0].toUpperCase(),
        }));
        const widths = items.map(it => ctx.measureText(it.lbl).width + pillFs * 1.0);
        const totalPW = widths.reduce((a, b) => a + b, 0) + pillGap * (items.length - 1);
        let px = scoreBoardE.X + rnColW + (diceAreaW - totalPW) * 0.5;
        const py = liveDy + cellSz + cgGap;
        items.forEach((it, idx) => {
          const c = TILE_COLORS[it.key];
          const pw = widths[idx];
          ctx.save();
          ctx.beginPath(); ctx.roundRect(px, py, pw, pillH2, pillH2 * 0.5);
          ctx.fillStyle = c.fill + 'cc'; ctx.fill();
          ctx.strokeStyle = c.stroke; ctx.lineWidth = 0.7 * scale; ctx.stroke();
          ctx.fillStyle = c.neon; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.shadowColor = c.neon; ctx.shadowBlur = 5 * scale;
          ctx.fillText(it.lbl, px + pw * 0.5, py + pillH2 * 0.5);
          ctx.shadowBlur = 0; ctx.restore();
          px += pw + pillGap;
        });
      }
    }
    ctx.restore();

    // ── RIGHT: color stats tile grid (3/4 of panel width) ──
    ctx.save();
    ctx.beginPath(); ctx.rect(statsX, scoreBoardE.Y, statsW, scoreBoardE.H); ctx.clip();

    const cgHdrFsA = clamp(5 * scale, scoreBoardE.H * 0.055, 9 * scale);
    ctx.font = `500 ${cgHdrFsA}px Interroman, Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('COLOR STATS', statsX + 2 * scale, scoreBoardE.Y + 1 * scale);

    const totalDice  = results.reduce((n, r) => n + (r.dice ? r.dice.length : 0), 0) || 1;
    const maxCgCount = Math.max(1, ...COLOR_GAME_KEYS.map(k => cgCounts[k] || 0));
    const fqTopPad   = cgHdrFsA + 3 * scale;
    const fqGap      = clamp(2 * scale, statsW * 0.025, 4 * scale);
    const FQ_COLS = 3, FQ_ROWS = 2;
    const tW = (statsW - fqGap * (FQ_COLS + 1)) / FQ_COLS;
    const tH = (scoreBoardE.H - fqTopPad - fqGap * (FQ_ROWS + 1)) / FQ_ROWS;
    const tR = Math.min(tW, tH) * 0.14;

    COLOR_GAME_KEYS.forEach((key, ki) => {
      const col = ki % FQ_COLS, row = Math.floor(ki / FQ_COLS);
      const tx  = statsX + fqGap + col * (tW + fqGap);
      const ty  = scoreBoardE.Y + fqTopPad + fqGap + row * (tH + fqGap);
      const cx  = tx + tW * 0.5, cy  = ty + tH * 0.5;
      const cnt   = cgCounts[key] || 0;
      const ratio = cnt / totalDice;
      const isHot = cnt === maxCgCount && cnt > 0;
      const c     = TILE_COLORS[key];

      // ── Tile background ──
      ctx.save();
      const tileGrad = ctx.createLinearGradient(tx, ty, tx + tW, ty + tH);
      tileGrad.addColorStop(0, c.fill + 'ee');
      tileGrad.addColorStop(1, c.fill + '88');
      ctx.beginPath(); ctx.roundRect(tx, ty, tW, tH, tR);
      ctx.fillStyle = tileGrad; ctx.fill();
      // Border
      ctx.strokeStyle = isHot ? c.neon : c.stroke + '66';
      ctx.lineWidth   = isHot ? 1.2 * scale : 0.6 * scale;
      if (isHot) { ctx.shadowColor = c.neon; ctx.shadowBlur = 8 * scale; }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // ── Radial arc ring ──
      const arcR    = Math.min(tW, tH) * 0.36;
      const arcLW   = clamp(1.5 * scale, arcR * 0.14, 3.5 * scale);
      const arcStart = -Math.PI * 0.5; // 12 o'clock
      const arcEnd   = arcStart + ratio * Math.PI * 2;
      // Track (empty)
      ctx.beginPath(); ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = arcLW; ctx.stroke();
      // Fill arc
      if (cnt > 0) {
        ctx.save();
        ctx.shadowColor = c.neon; ctx.shadowBlur = isHot ? 7 * scale : 3 * scale;
        ctx.beginPath(); ctx.arc(cx, cy, arcR, arcStart, arcEnd);
        ctx.strokeStyle = c.neon; ctx.lineWidth = arcLW; ctx.lineCap = 'round';
        ctx.stroke(); ctx.restore();
      }
      // Arc cap dot at tip
      if (cnt > 0) {
        const capX = cx + Math.cos(arcEnd) * arcR;
        const capY = cy + Math.sin(arcEnd) * arcR;
        ctx.beginPath(); ctx.arc(capX, capY, arcLW * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = c.neon; ctx.fill();
      }

      // ── Count (large, centered inside ring) ──
      const countFs2 = clamp(6 * scale, arcR * 0.72, 16 * scale);
      ctx.font = `700 ${countFs2}px Interroman, Arial`;
      ctx.fillStyle = key === 'white' ? '#1a1a2e' : '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(cnt), cx, cy);

      // ── Color label (top-left corner of tile) ──
      const lblFs2 = clamp(4.5 * scale, tH * 0.12, 8 * scale);
      ctx.font = `700 ${lblFs2}px Interroman, Arial`;
      ctx.fillStyle = c.neon + 'cc';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(key[0].toUpperCase(), tx + tR * 0.6, ty + tR * 0.4);

      // ── Percentage (bottom-right corner) ──
      const pct2 = Math.round(ratio * 100);
      ctx.font = `500 ${lblFs2}px Interroman, Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${pct2}%`, tx + tW - tR * 0.6, ty + tH - tR * 0.4);

      // ── HOT badge (top-right) ──
      if (isHot) {
        const badgeFs = clamp(4 * scale, tH * 0.10, 7 * scale);
        ctx.font = `700 ${badgeFs}px Interroman, Arial`;
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText('HOT', tx + tW - tR * 0.6, ty + tR * 0.4);
      }
    });
    ctx.restore();

    // ── Bet Log — fills blank scoreBoardA panel ──
    {
      // Inject a synthetic bet periodically during betting phase
      if (gamePhase === 'betting') {
        const _now = performance.now();
        if (_now - _fakeBetTimer > 1400) {
          _fakeBetTimer = _now + Math.random() * 900; // jitter next threshold
          _pushFakeBet();
        }
      }

      const logHdrFs   = clamp(6 * scale, scoreBoardA.H * 0.060, 10 * scale);
      const logTopPad  = logHdrFs + 4 * scale;
      const logRowH    = clamp(13 * scale, scoreBoardA.H * 0.065, 19 * scale);
      const logPx      = clamp(7.5 * scale, scoreBoardA.H * 0.036, 11 * scale);
      const logPad     = 5 * scale;
      const logMaxRows = Math.floor((scoreBoardA.H - logTopPad) / logRowH);

      ctx.save();
      ctx.beginPath(); ctx.rect(scoreBoardA.X, scoreBoardA.Y, scoreBoardA.W, scoreBoardA.H); ctx.clip();

      // Header
      ctx.font = `500 ${logHdrFs}px Interroman, Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('BET LOG', scoreBoardA.X + 2 * scale, scoreBoardA.Y + 1 * scale);

      // Live dot (green pulse during betting)
      if (gamePhase === 'betting') {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
        const ldX = scoreBoardA.X + ctx.measureText('BET LOG').width + logHdrFs * 1.6;
        const ldY = scoreBoardA.Y + logHdrFs * 0.55;
        ctx.beginPath(); ctx.arc(ldX, ldY, 2.2 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60,210,90,${0.55 + pulse * 0.45})`; ctx.fill();
      }

      // Row list (newest first)
      betLog.slice(0, logMaxRows).forEach((entry, i) => {
        const ry  = scoreBoardA.Y + logTopPad + i * logRowH;
        const tc  = TILE_COLORS[entry.region];
        const neon = tc ? tc.neon : 'rgba(255,255,255,0.55)';

        // Alternating row tint
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.025)';
          ctx.fillRect(scoreBoardA.X, ry, scoreBoardA.W, logRowH);
        }

        // Color dot
        ctx.beginPath(); ctx.arc(scoreBoardA.X + logPad * 0.9, ry + logRowH * 0.5, logPx * 0.30, 0, Math.PI * 2);
        ctx.fillStyle = neon; ctx.fill();

        // Player name — clipped to left 42% of the panel
        ctx.save();
        ctx.beginPath(); ctx.rect(scoreBoardA.X + logPad * 1.7, ry, scoreBoardA.W * 0.42, logRowH); ctx.clip();
        ctx.font = `${entry.isYou ? 700 : 500} ${logPx}px Interroman, Arial`;
        ctx.fillStyle = entry.isYou ? '#ffe060' : 'rgba(255,255,255,0.72)';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(entry.player, scoreBoardA.X + logPad * 1.7, ry + logRowH * 0.5);
        ctx.restore();

        // Amount — right-aligned to 78% mark
        ctx.font = `600 ${logPx}px Interroman, Arial`;
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText('₱' + entry.amount.toLocaleString(), scoreBoardA.X + scoreBoardA.W * 0.78, ry + logRowH * 0.5);

        // Region label — neon color, right edge
        const regionLabel = entry.region.charAt(0).toUpperCase() + entry.region.slice(1);
        ctx.font = `600 ${logPx * 0.86}px Interroman, Arial`;
        ctx.fillStyle = neon;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(regionLabel, scoreBoardA.X + scoreBoardA.W - logPad * 0.6, ry + logRowH * 0.5);
      });

      ctx.restore();
    }

  } else {
  const roadHdrFs = clamp(5 * scale, scoreBoardA.H * 0.050, 8.5 * scale);

  // --- gridA (Big Road) ---
  const roadALabel = GAME_TYPE === 'gostop' ? 'BIG ROAD' : GAME_TYPE === 'oddeven' ? 'BIG ROAD' : 'BIG ROAD';
  ctx.font = `500 ${roadHdrFs}px Interroman, Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(roadALabel, scoreBoardA.X + 2 * scale, scoreBoardA.Y + 1 * scale);
  const roadATopPad = roadHdrFs + 2 * scale;

  const cellHA = (scoreBoardA.H - roadATopPad) / 9;
  const colsA = Math.max(3, Math.ceil(scoreBoardA.W / cellHA / 3) * 3);
  ctx.save();
  ctx.beginPath();
  ctx.rect(scoreBoardA.X, scoreBoardA.Y + roadATopPad, scoreBoardA.W, scoreBoardA.H - roadATopPad);
  ctx.clip();
  ctx.translate(-scrollXA, 0);
  const gridA = constructGrid(9, colsA, scoreBoardA.X, scoreBoardA.Y + roadATopPad, scoreBoardA.H - roadATopPad, 1, 3, 6, scoreBoardA.W);
  populateBigRoad(gridA);
  if (GAME_TYPE === 'baccarat') {
    populateBigEye(gridA);
    populateSmallEye(gridA);
    populateCockroach(gridA);
  }
  ctx.restore();
  maxScrollXA = Math.max(0, gridA.totalWidth - scoreBoardA.W);

  // --- gridE (Bead Road) ---
  const roadELabel = 'BEAD ROAD';
  ctx.font = `500 ${roadHdrFs}px Interroman, Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(roadELabel, scoreBoardE.X + 2 * scale, scoreBoardE.Y + 1 * scale);
  const roadETopPad = roadHdrFs + 2 * scale;

  const cellHE = (scoreBoardE.H - roadETopPad) / 6;
  const colsE = Math.max(6, Math.ceil(scoreBoardE.W / cellHE));
  ctx.save();
  ctx.beginPath();
  ctx.rect(scoreBoardE.X, scoreBoardE.Y + roadETopPad, scoreBoardE.W, scoreBoardE.H - roadETopPad);
  ctx.clip();
  ctx.translate(-scrollXE, 0);
  const gridE = constructGrid(6, colsE, scoreBoardE.X, scoreBoardE.Y + roadETopPad, scoreBoardE.H - roadETopPad, 1, undefined, undefined, scoreBoardE.W);
  populateBeadRoad(gridE);
  ctx.restore();
  maxScrollXE = Math.max(0, gridE.totalWidth - scoreBoardE.W);
  } // end non-colorgame
  // --- SCROLLABLE END ********************************************************************************

}

const drawMenuBar = (GEOMETRY) => {

  ctx.setLineDash([])

  // --- Main ---
  const main = {
    X: GEOMETRY['menuBar'].X,
    Y: GEOMETRY['menuBar'].Y,
    W: GEOMETRY['menuBar'].W,
    H: GEOMETRY['menuBar'].H * 0.65,
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

  // Chip controller fills the full bottom bar
  const chipsController = {
    X: main.X + main.W * 0.05,
    Y: main.Y + main.H * 0.125,
    W: main.W * 0.90,
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
    const rowR = Math.min(chipsController.H * 0.55, slotW * 0.46);
    const rowCY = chipsController.Y + chipsController.H * 0.5;
    chips.forEach((_, i) => {
      const isActive = i === currentChipIndex;
      const cx = chipAreaX + slotW * i + slotW * 0.5;
      const r = isActive ? rowR * 1.32 : rowR;
      const cy = isActive ? rowCY - rowR * 0.18 : rowCY;
      drawSingleChip(cx, cy, r, i, isActive);
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
    : { X: GEOMETRY['menuBar'].X, Y: GEOMETRY['menuBar'].Y + main.H, W: GEOMETRY['menuBar'].W, H: GEOMETRY['menuBar'].H - main.H };
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
  const _cfg = window.GAME_CONFIG || {};
  ctx.fillText((_cfg.title || 'Speed Baccarat') + '  ' + (_cfg.limits || '₱50–10,000'), wallet.X + wPad, row1CY);

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

  // Row 2 — enhanced coin-stack icon + balance (left) | total bet (right)
  const icoCX    = wallet.X + wPad + icoR;
  const coinRX   = icoR;           // horizontal radius of coin ellipse
  const coinRY   = icoR * 0.28;   // vertical radius (flat coin look)
  const coinGap  = coinRY * 1.10; // vertical spacing between coin centres
  const numCoins = 4;
  const stackH   = (numCoins - 1) * coinGap;
  const icoBaseY = row2CY + stackH * 0.5; // bottom coin centre

  ctx.save();
  // Draw coins bottom → top so top coins render over lower ones
  for (let i = 0; i < numCoins; i++) {
    const cy   = icoBaseY - i * coinGap;
    const isTop = i === numCoins - 1;
    const t    = performance.now() * 0.0018;
    const glow = isTop ? (Math.sin(t) * 0.5 + 0.5) : 0;

    // Coin body fill — gradient: gold on top
    const cg = ctx.createLinearGradient(icoCX - coinRX, cy - coinRY, icoCX + coinRX, cy + coinRY);
    if (isTop) {
      cg.addColorStop(0, `rgba(255,220,60,${0.90 + glow * 0.10})`);
      cg.addColorStop(0.5, `rgba(200,155,20,${0.85})`);
      cg.addColorStop(1, `rgba(140,95,10,0.80)`);
    } else {
      const dim = 0.55 + i * 0.10;
      cg.addColorStop(0, `rgba(200,160,40,${dim})`);
      cg.addColorStop(1, `rgba(100,70,10,${dim * 0.75})`);
    }
    ctx.beginPath(); ctx.ellipse(icoCX, cy, coinRX, coinRY, 0, 0, Math.PI * 2);

    // Side cylinder fill between this coin and the one below
    if (i > 0) {
      const prevCY = icoBaseY - (i - 1) * coinGap;
      ctx.fillStyle = `rgba(120,80,10,${0.50 + i * 0.06})`;
      ctx.fillRect(icoCX - coinRX, prevCY, coinRX * 2, cy - prevCY);
    }

    ctx.fillStyle = cg; ctx.fill();

    // Rim stroke
    ctx.strokeStyle = isTop
      ? `rgba(255,240,100,${0.60 + glow * 0.40})`
      : `rgba(180,130,30,0.45)`;
    ctx.lineWidth = Math.max(0.6 * scale, coinRY * 0.22);
    if (isTop && glow > 0.3) { ctx.shadowColor = 'rgba(255,220,60,0.70)'; ctx.shadowBlur = icoR * glow; }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ₱ symbol on top coin only
    if (isTop) {
      const symFs = clamp(5 * scale, coinRX * 0.48, 9 * scale);
      ctx.font = `700 ${symFs}px Interroman, Arial`;
      ctx.fillStyle = `rgba(255,240,120,${0.80 + glow * 0.20})`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('₱', icoCX, cy);
    }
  }
  ctx.restore();

  ctx.font = `600 ${balFs}px Interroman, Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'middle';
  ctx.fillText(fmtCurrency(balance), icoCX + icoR + wPad * 0.6, row2CY);
  walletChipTarget = { x: icoCX, y: row2CY, r: icoR * 0.70 };

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
    const w = winners[0];
    if (GAME_TYPE !== 'baccarat') {
      label    = w ? w.toUpperCase() + ' WINS' : '';
      sublabel = revealNumber ? `Ball: ${revealNumber}` : null;
      const tc = TILE_COLORS[w];
      accentColor = tc ? tc.neon : '#e8c84a';
      tintRgb = w === 'go' || w === 'odd' ? '176,64,255' : '16,192,96';
      if (w === 'go')   tintRgb = '255,64,64';
      if (w === 'stop') tintRgb = '64,128,255';
      if (w === 'odd')  tintRgb = '176,64,255';
      if (w === 'even') tintRgb = '16,192,96';
    } else {
      const pTotal = handTotal(playerCards);
      const bTotal = handTotal(bankerCards);
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

// ─── Chat Overlay ────────────────────────────────────────────────────────────
const getChatInput = () => {
  if (!chatInputEl) {
    chatInputEl = document.createElement('input');
    chatInputEl.type = 'text';
    chatInputEl.placeholder = 'Type a message…';
    chatInputEl.style.cssText = [
      'position:fixed', 'background:rgba(255,255,255,0.08)',
      'border:1px solid rgba(255,255,255,0.22)', 'border-radius:999px',
      'color:#fff', 'font-size:13px', 'font-family:Interroman,Arial,sans-serif',
      'outline:none', 'padding:0 12px', 'box-sizing:border-box', 'display:none',
    ].join(';');
    chatInputEl.addEventListener('input', e => { chatInputValue = e.target.value; });
    chatInputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && chatInputValue.trim()) {
        chatMessages.push({ user: 'You', text: chatInputValue.trim(), isSelf: true, isSystem: false });
        chatInputValue = '';
        chatInputEl.value = '';
        chatScrollY = 0;
      }
    });
    document.body.appendChild(chatInputEl);
  }
  return chatInputEl;
};

const drawChat = () => {
  const inp = getChatInput();
  if (!isChatOpen) { inp.style.display = 'none'; return; }

  const rect = canvas.getBoundingClientRect();
  const cssScale = rect.width / canvas.width;

  // Panel dimensions — right side of screen, tall
  const panelW = Math.min(containerWidth * 0.90, 300 * scale);
  const panelH = canvas.height * 0.70;
  const panelX = canvas.width - panelW - leftGutter - 6 * scale;
  const panelY = canvas.height * 0.06;
  const panelR = 10 * scale;

  const headerH = panelH * 0.09;
  const inputH  = panelH * 0.10;
  const msgAreaH = panelH - headerH - inputH;
  const pad = panelW * 0.05;

  // Backdrop blur simulation — dark semi-transparent fill
  ctx.save();
  ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, panelH, panelR);
  ctx.fillStyle = 'rgba(8, 9, 24, 0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 0.8 * scale;
  ctx.stroke();

  // Header
  const headerGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY);
  headerGrad.addColorStop(0, 'rgba(80,60,200,0.55)');
  headerGrad.addColorStop(1, 'rgba(40,30,120,0.40)');
  ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, headerH, [panelR, panelR, 0, 0]);
  ctx.fillStyle = headerGrad; ctx.fill();

  const hFs = clamp(10 * scale, headerH * 0.38, 14 * scale);
  ctx.font = `600 ${hFs}px Interroman, Arial`;
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
  ctx.fillText('Live Chat', panelX + pad * 1.2, panelY + headerH * 0.5);

  // Close button
  const closeR = headerH * 0.28;
  const closeCX = panelX + panelW - pad * 1.2 - closeR;
  const closeCY = panelY + headerH * 0.5;
  ctx.beginPath(); ctx.arc(closeCX, closeCY, closeR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 0.6 * scale; ctx.stroke();
  const cx = closeR * 0.40;
  ctx.strokeStyle = 'rgba(255,255,255,0.80)'; ctx.lineWidth = 1.4 * scale; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(closeCX - cx, closeCY - cx); ctx.lineTo(closeCX + cx, closeCY + cx); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(closeCX + cx, closeCY - cx); ctx.lineTo(closeCX - cx, closeCY + cx); ctx.stroke();
  chatCloseBounds = { X: closeCX - closeR * 1.4, Y: closeCY - closeR * 1.4, W: closeR * 2.8, H: closeR * 2.8 };

  // Divider
  ctx.beginPath();
  ctx.moveTo(panelX + pad, panelY + headerH);
  ctx.lineTo(panelX + panelW - pad, panelY + headerH);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 0.5 * scale; ctx.stroke();

  // Message area — clipped
  const msgY = panelY + headerH;
  ctx.save();
  ctx.beginPath(); ctx.rect(panelX, msgY, panelW, msgAreaH); ctx.clip();

  const msgFs = clamp(9 * scale, panelW * 0.040, 12 * scale);
  const nameFs = clamp(8 * scale, panelW * 0.034, 10 * scale);
  const lineH = msgFs * 1.55;
  const bubblePad = pad * 0.8;

  // Layout messages bottom-up: measure total height first
  let totalMsgH = pad;
  const rendered = chatMessages.map(m => {
    const maxBW = panelW * 0.75;
    ctx.font = `400 ${msgFs}px Interroman, Arial`;
    const tw = Math.min(ctx.measureText(m.text).width + bubblePad * 2, maxBW);
    const rows = Math.ceil((ctx.measureText(m.text).width + bubblePad * 2) / maxBW);
    const bH = lineH * rows + bubblePad * 1.2;
    totalMsgH += bH + pad * 0.6;
    return { ...m, bH, tw };
  });

  const maxScroll = Math.max(0, totalMsgH - msgAreaH);
  chatScrollY = Math.min(chatScrollY, maxScroll);
  let curY = msgY + msgAreaH - pad - chatScrollY;

  for (let i = rendered.length - 1; i >= 0; i--) {
    const m = rendered[i];
    curY -= m.bH;
    if (curY + m.bH > msgY && curY < msgY + msgAreaH) {
      const bX = m.isSelf ? panelX + panelW - m.tw - pad : panelX + pad;
      const bR = m.bH * 0.30;

      // Bubble
      if (m.isSystem) {
        ctx.beginPath(); ctx.roundRect(panelX + panelW * 0.08, curY, panelW * 0.84, m.bH, bR);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
        ctx.font = `300 ${msgFs * 0.88}px Interroman, Arial`;
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(m.text, panelX + panelW * 0.5, curY + m.bH * 0.5);
      } else {
        ctx.beginPath(); ctx.roundRect(bX, curY, m.tw, m.bH, bR);
        ctx.fillStyle = m.isSelf ? 'rgba(80,60,200,0.55)' : 'rgba(255,255,255,0.09)';
        ctx.fill();
        if (!m.isSelf) {
          ctx.font = `600 ${nameFs}px Interroman, Arial`;
          ctx.fillStyle = 'rgba(160,140,255,0.90)'; ctx.textAlign = 'start'; ctx.textBaseline = 'top';
          ctx.fillText(m.user, bX + bubblePad, curY + bubblePad * 0.4);
        }
        ctx.font = `400 ${msgFs}px Interroman, Arial`;
        ctx.fillStyle = m.isSelf ? '#ffffff' : 'rgba(255,255,255,0.85)';
        ctx.textAlign = m.isSelf ? 'end' : 'start';
        ctx.textBaseline = 'middle';
        const textX = m.isSelf ? bX + m.tw - bubblePad : bX + bubblePad;
        const textY = m.isSystem ? curY + m.bH * 0.5 : curY + m.bH * (m.isSelf ? 0.5 : 0.65);
        ctx.fillText(m.text, textX, textY);
      }
    }
    curY -= pad * 0.6;
  }
  ctx.restore();

  // Input row background
  const inpY = panelY + headerH + msgAreaH;
  ctx.beginPath(); ctx.roundRect(panelX, inpY, panelW, inputH, [0, 0, panelR, panelR]);
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(panelX + pad, inpY); ctx.lineTo(panelX + panelW - pad, inpY);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 0.5 * scale; ctx.stroke();

  // Send button
  const sendR = inputH * 0.28;
  const sendCX = panelX + panelW - pad * 1.4 - sendR;
  const sendCY = inpY + inputH * 0.5;
  ctx.beginPath(); ctx.arc(sendCX, sendCY, sendR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(80,60,200,0.75)'; ctx.fill();
  ctx.strokeStyle = 'rgba(130,110,255,0.60)'; ctx.lineWidth = 0.8 * scale; ctx.stroke();
  // arrow
  ctx.save(); ctx.translate(sendCX, sendCY);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2 * scale; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-sendR * 0.38, sendR * 0.20); ctx.lineTo(sendR * 0.36, 0); ctx.lineTo(-sendR * 0.38, -sendR * 0.20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-sendR * 0.10, 0); ctx.lineTo(sendR * 0.36, 0); ctx.stroke();
  ctx.restore();
  chatSendBounds = { X: sendCX - sendR * 1.5, Y: sendCY - sendR * 1.5, W: sendR * 3, H: sendR * 3 };

  // Position DOM input over the input area
  const inpFieldX = panelX + pad;
  const inpFieldW = (sendCX - sendR * 1.5) - inpFieldX - pad * 0.5;
  inp.style.display = 'block';
  inp.style.left   = `${(rect.left + inpFieldX * cssScale)}px`;
  inp.style.top    = `${(rect.top  + (inpY + inputH * 0.18) * cssScale)}px`;
  inp.style.width  = `${inpFieldW * cssScale}px`;
  inp.style.height = `${inputH * 0.64 * cssScale}px`;

  ctx.restore();
};

// ─── Top Navigation Bar ──────────────────────────────────────────────────────
const drawTopNav = () => {
  const S       = scale;
  const navH    = clamp(30*S, canvas.height * 0.042, 44*S);
  const navY    = 7*S;
  const navR    = navH * 0.5;
  const navW    = clamp(260*S, containerWidth * 0.88, containerWidth * 0.94);
  const navX    = leftGutter + (containerWidth - navW) * 0.5;
  const divX    = navX + navW * 0.56;
  const pad          = 4*S;
  const inBound      = (b) => b && _mx >= b.X && _mx <= b.X + b.W && _my >= b.Y && _my <= b.Y + b.H;
  const gameSectionW = divX - navX;
  // Wide when each tab has at least 50 CSS-px — otherwise collapse to dropdown
  const wideMode     = gameSectionW / GAME_NAV.length >= 50 * S;

  // ── Panel background ──
  ctx.save();
  ctx.beginPath(); ctx.roundRect(navX, navY, navW, navH, navR);
  const bg = ctx.createLinearGradient(navX, navY, navX, navY + navH);
  bg.addColorStop(0, 'rgba(255,255,255,0.10)');
  bg.addColorStop(1, 'rgba(255,255,255,0.03)');
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.8*S; ctx.stroke();
  ctx.restore();

  // Clip interior
  ctx.save();
  ctx.beginPath(); ctx.roundRect(navX, navY, navW, navH, navR); ctx.clip();

  // Divider line
  ctx.beginPath();
  ctx.moveTo(divX, navY + navH * 0.15); ctx.lineTo(divX, navY + navH * 0.85);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.8*S; ctx.stroke();

  // ── Game selector — row (wide) or dropdown (narrow) ──
  const tabFs    = clamp(7*S, navH * 0.28, 10*S);
  const activeId = (window.GAME_CONFIG && window.GAME_CONFIG.gameId) || 'baccarat1';
  topNavGameHits = [];

  if (wideMode) {
    // Horizontal tab row — one pill per game
    if (isGameDropOpen) isGameDropOpen = false;
    const tabW = gameSectionW / GAME_NAV.length;
    GAME_NAV.forEach((g, i) => {
      const tx = navX + tabW * i, isAct = g.id === activeId;
      if (isAct) {
        ctx.beginPath(); ctx.roundRect(tx + pad * 0.5, navY + pad * 0.4, tabW - pad, navH - pad * 0.8, navH * 0.28);
        ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx + tabW * 0.22, navY + navH - pad * 0.5);
        ctx.lineTo(tx + tabW * 0.78, navY + navH - pad * 0.5);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5 * S; ctx.lineCap = 'round'; ctx.stroke();
      }
      ctx.font = `${isAct ? 600 : 400} ${tabFs}px Interroman, Arial`;
      ctx.fillStyle = isAct ? '#ffffff' : 'rgba(255,255,255,0.50)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(g.label, tx + tabW * 0.5, navY + navH * 0.5);
      topNavGameHits.push({ id: g.id, X: tx, Y: navY, W: tabW, H: navH });
    });
  } else {
    // Narrow — single toggle button with dropdown
    const activeGame = GAME_NAV.find(g => g.id === activeId) || GAME_NAV[0];
    topNavGameHits.push({ id: '__toggle__', X: navX, Y: navY, W: gameSectionW, H: navH });
    if (isGameDropOpen) {
      ctx.beginPath(); ctx.roundRect(navX + pad * 0.5, navY + pad * 0.4, gameSectionW - pad, navH - pad * 0.8, navH * 0.30);
      ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill();
    }
    ctx.font = `600 ${tabFs}px Interroman, Arial`;
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillText(activeGame.label, navX + pad * 1.8, navY + navH * 0.5);
    const chevX = navX + gameSectionW - pad * 2.2, chevY = navY + navH * 0.5, chevSz = navH * 0.17;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.2 * S; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (isGameDropOpen) {
      ctx.moveTo(chevX - chevSz, chevY + chevSz * 0.4); ctx.lineTo(chevX, chevY - chevSz * 0.4); ctx.lineTo(chevX + chevSz, chevY + chevSz * 0.4);
    } else {
      ctx.moveTo(chevX - chevSz, chevY - chevSz * 0.4); ctx.lineTo(chevX, chevY + chevSz * 0.4); ctx.lineTo(chevX + chevSz, chevY - chevSz * 0.4);
    }
    ctx.stroke();
  }

  // ── Utility slots: Chat | Volume | Video | Layout | Lobby | Labels | User ──
  const utilW = navX + navW - divX;
  const NUM_UTIL = 7;
  const slotW = utilW / NUM_UTIL;
  const icoSz = navH * 0.36;
  const midY  = navY + navH * 0.5;
  const uCX   = divX + slotW * 6.5; // slot 6 (User) center — used by dropdown

  const drawNavSlot = (i, isActive, accentColor) => {
    const cx = divX + slotW * (i + 0.5);
    if (isActive) {
      ctx.beginPath(); ctx.roundRect(cx - slotW * 0.46, navY + pad * 0.4, slotW * 0.92, navH - pad * 0.8, navH * 0.28);
      ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill();
      if (accentColor) {
        ctx.beginPath();
        ctx.moveTo(cx - slotW * 0.28, navY + navH - pad * 0.5);
        ctx.lineTo(cx + slotW * 0.28, navY + navH - pad * 0.5);
        ctx.strokeStyle = accentColor; ctx.lineWidth = 1.5*S; ctx.lineCap = 'round'; ctx.stroke();
      }
    }
    return cx;
  };

  // Slot 0 — Chat
  { const cx = drawNavSlot(0, isChatOpen, 'rgba(100,180,255,0.80)');
    const bw = icoSz, bh = bw * 0.78, br = bw * 0.22;
    const bx = cx - bw * 0.5, by = midY - bh * 0.60;
    ctx.fillStyle = isChatOpen ? '#ffffff' : 'rgba(255,255,255,0.70)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, br); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx+bw*0.18, by+bh); ctx.lineTo(bx+bw*0.06, by+bh+bh*0.28); ctx.lineTo(bx+bw*0.40, by+bh); ctx.fill();
    const s = new Path2D(); s.rect(cx - slotW * 0.5, navY, slotW, navH); hitRegions.chat = s;
  }

  // Slot 1 — Volume / Mute
  { const cx = drawNavSlot(1, isMuted, 'rgba(255,100,100,0.80)');
    const sw = icoSz * 0.62, sh = icoSz * 0.78, sx = cx - sw * 0.68, sy = midY - sh * 0.5;
    ctx.fillStyle = 'rgba(255,255,255,0.70)';
    ctx.beginPath(); ctx.moveTo(sx, sy+sh*0.28); ctx.lineTo(sx, sy+sh*0.72); ctx.lineTo(sx+sw*0.42, sy+sh*0.72); ctx.lineTo(sx+sw*0.42+sw*0.36, sy+sh); ctx.lineTo(sx+sw*0.42+sw*0.36, sy); ctx.lineTo(sx+sw*0.42, sy+sh*0.28); ctx.closePath(); ctx.fill();
    if (!isMuted) {
      ctx.strokeStyle = 'rgba(255,255,255,0.70)'; ctx.lineWidth = 1.1*S; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(sx+sw*0.78+sw*0.36, midY, sh*0.26, -Math.PI*0.55, Math.PI*0.55); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx+sw*0.78+sw*0.36, midY, sh*0.44, -Math.PI*0.45, Math.PI*0.45); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,80,80,0.90)'; ctx.lineWidth = 1.2*S; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx-icoSz*0.12, midY-icoSz*0.18); ctx.lineTo(cx+icoSz*0.12, midY+icoSz*0.18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+icoSz*0.12, midY-icoSz*0.18); ctx.lineTo(cx-icoSz*0.12, midY+icoSz*0.18); ctx.stroke();
    }
    volumeBounds = { X: cx - slotW * 0.5, Y: navY, W: slotW, H: navH };
  }

  // Slot 2 — Video toggle
  { const cx = drawNavSlot(2, !isVideoOn, 'rgba(255,100,100,0.80)');
    const cw = icoSz * 0.68, ch = cw * 0.64, cx3 = cx - cw*0.5 - cw*0.10, cy3 = midY - ch*0.5;
    ctx.fillStyle = isVideoOn ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.roundRect(cx3, cy3, cw*0.72, ch, ch*0.18); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx3+cw*0.72, cy3+ch*0.18); ctx.lineTo(cx3+cw, cy3+ch*0.5); ctx.lineTo(cx3+cw*0.72, cy3+ch*0.82); ctx.closePath(); ctx.fill();
    if (!isVideoOn) {
      ctx.strokeStyle = 'rgba(255,80,80,0.90)'; ctx.lineWidth = 1.2*S; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx-icoSz*0.28, midY-icoSz*0.22); ctx.lineTo(cx+icoSz*0.28, midY+icoSz*0.22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+icoSz*0.28, midY-icoSz*0.22); ctx.lineTo(cx-icoSz*0.28, midY+icoSz*0.22); ctx.stroke();
    }
    videoBounds = { X: cx - slotW * 0.5, Y: navY, W: slotW, H: navH };
  }

  // Slot 3 — Layout toggle
  { const isMonitor = layoutMode === 'monitoring';
    const cx = drawNavSlot(3, isMonitor, 'rgba(150,120,255,0.80)');
    const g = icoSz * 0.82, gx = cx - g*0.5, gy = midY - g*0.5;
    ctx.strokeStyle = isMonitor ? '#ffffff' : 'rgba(255,255,255,0.70)';
    ctx.lineWidth = 1.1*S; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (isMonitor) {
      ctx.beginPath(); ctx.roundRect(gx, gy+g*0.06, g, g*0.70, 2*S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, gy+g*0.76); ctx.lineTo(cx, gy+g*0.94); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx-g*0.22, gy+g*0.94); ctx.lineTo(cx+g*0.22, gy+g*0.94); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.roundRect(gx, gy+g*0.18, g, g*0.64, g*0.18); ctx.stroke();
      const cx2 = cx-g*0.22, cy2 = midY;
      ctx.beginPath(); ctx.moveTo(cx2, cy2-g*0.14); ctx.lineTo(cx2, cy2+g*0.14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx2-g*0.14, cy2); ctx.lineTo(cx2+g*0.14, cy2); ctx.stroke();
      const rx2 = cx+g*0.22;
      ctx.beginPath(); ctx.arc(rx2-g*0.10, cy2, g*0.06, 0, Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.70)'; ctx.fill();
      ctx.beginPath(); ctx.arc(rx2+g*0.10, cy2, g*0.06, 0, Math.PI*2); ctx.fill();
    }
    layoutBounds = { X: cx - slotW * 0.5, Y: navY, W: slotW, H: navH };
  }

  // Slot 4 — Lobby
  { const cx = drawNavSlot(4, false, null);
    const hw = icoSz * 0.78, hh = hw * 0.88, hx = cx-hw*0.5, hy = midY-hh*0.54;
    const rH = hh*0.42, bH = hh*0.58;
    ctx.fillStyle = 'rgba(255,255,255,0.70)';
    ctx.beginPath(); ctx.moveTo(hx+hw*0.5, hy); ctx.lineTo(hx+hw, hy+rH); ctx.lineTo(hx, hy+rH); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.rect(hx+hw*0.12, hy+rH, hw*0.76, bH); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    const dw = hw*0.26, dh = bH*0.56;
    ctx.beginPath(); ctx.roundRect(cx-dw*0.5, hy+rH+bH-dh, dw, dh, dw*0.30); ctx.fill();
    const ls = new Path2D(); ls.rect(cx-slotW*0.5, navY, slotW, navH); hitRegions.lobby = ls;
  }

  // Slot 5 — Section Labels toggle
  { const cx = drawNavSlot(5, isLabelsOn, 'rgba(80,230,160,0.80)');
    const iw = icoSz * 0.80, ih = icoSz * 0.80;
    const ix = cx - iw*0.5, iy = midY - ih*0.5;
    ctx.strokeStyle = isLabelsOn ? '#ffffff' : 'rgba(255,255,255,0.70)';
    ctx.lineWidth = 1.0*S; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.roundRect(ix, iy, iw, ih, iw*0.12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ix, iy+ih*0.30); ctx.lineTo(ix+iw, iy+ih*0.30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ix+iw*0.5, iy+ih*0.30); ctx.lineTo(ix+iw*0.5, iy+ih); ctx.stroke();
    ctx.fillStyle = isLabelsOn ? '#ffffff' : 'rgba(255,255,255,0.70)';
    ctx.beginPath(); ctx.arc(ix+iw*0.5, iy+ih*0.15, iw*0.07, 0, Math.PI*2); ctx.fill();
    labelsBounds = { X: cx - slotW*0.5, Y: navY, W: slotW, H: navH };
  }

  // Slot 6 — User/Profile
  { const cx = drawNavSlot(6, isUserPrefOpen, null);
    const ur = icoSz * 0.46;
    ctx.strokeStyle = isUserPrefOpen ? '#ffffff' : 'rgba(255,255,255,0.70)';
    ctx.lineWidth = 1.2*S; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, midY-ur*0.20, ur*0.36, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, midY+ur*0.68, ur*0.58, Math.PI*1.15, Math.PI*1.85, false); ctx.stroke();
    topNavUserHit = { X: cx-slotW*0.5, Y: navY, W: slotW, H: navH };
  }

  topNavSettingsHit = null;
  ctx.restore(); // end clip

  // ── Game dropdown list ──
  if (!wideMode && isGameDropOpen) {
    const dropW = clamp(100*S, gameSectionW * 0.62, 148*S);
    const dropX = navX;
    const dropY = navY + navH + 3*S;
    const itemH = navH * 0.68;
    const dropH = GAME_NAV.length * itemH + 6*S;
    const dropR = 6*S;

    ctx.save();
    ctx.beginPath(); ctx.roundRect(dropX, dropY, dropW, dropH, dropR);
    ctx.fillStyle = 'rgba(6,7,20,0.97)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.8*S; ctx.stroke();

    const dFs = clamp(8*S, itemH * 0.30, 11*S);
    GAME_NAV.forEach((g, i) => {
      const iy = dropY + 3*S + i * itemH;
      const isAct = g.id === activeId;

      if (isAct) {
        ctx.beginPath(); ctx.roundRect(dropX + 4*S, iy + 2*S, dropW - 8*S, itemH - 4*S, 5*S);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
      }
      ctx.font = `${isAct ? 600 : 400} ${dFs}px Interroman, Arial`;
      ctx.fillStyle = isAct ? '#ffffff' : 'rgba(255,255,255,0.60)';
      ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
      ctx.fillText(g.label, dropX + 14*S, iy + itemH * 0.5);

      if (isAct) {
        ctx.beginPath(); ctx.arc(dropX + dropW - 11*S, iy + itemH * 0.5, 2.5*S, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.80)'; ctx.fill();
      }
      // each row is a game hit target
      topNavGameHits.push({ id: g.id, X: dropX, Y: iy, W: dropW, H: itemH });
    });
    ctx.restore();
  }

  // ── User prefs dropdown ──
  if (isUserPrefOpen) {
    const dropW = clamp(170*S, navW * 0.40, 250*S);
    const dropX = Math.min(uCX - dropW * 0.5, navX + navW - dropW - 4*S);
    const dropY = navY + navH + 3*S;
    const dropH = clamp(88*S, navH * 3.4, 120*S);
    const pd    = 12*S;

    ctx.save();
    ctx.beginPath(); ctx.roundRect(dropX, dropY, dropW, dropH, 8*S);
    ctx.fillStyle = 'rgba(6,7,20,0.96)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.8*S; ctx.stroke();

    const valFs = clamp(9*S, dropH * 0.11, 13*S);
    const subFs = clamp(7*S, dropH * 0.08, 10*S);

    // Avatar
    const avR  = dropH * 0.17;
    const avCX = dropX + pd + avR;
    const avCY = dropY + dropH * 0.38;
    const avG  = ctx.createLinearGradient(avCX - avR, avCY - avR, avCX + avR, avCY + avR);
    avG.addColorStop(0, '#5040cc'); avG.addColorStop(1, '#3020a0');
    ctx.beginPath(); ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
    ctx.fillStyle = avG; ctx.fill();
    ctx.strokeStyle = 'rgba(160,140,255,0.60)'; ctx.lineWidth = S; ctx.stroke();
    ctx.font = `700 ${avR * 0.88}px Interroman, Arial`;
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('P', avCX, avCY);

    const txX = avCX + avR + pd * 0.65;
    ctx.font = `600 ${valFs}px Interroman, Arial`; ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillText('Player_777', txX, avCY - valFs * 0.55);
    ctx.font = `300 ${subFs}px Interroman, Arial`; ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.fillText('Live Member', txX, avCY + subFs * 0.65);

    // Divider
    const divY2 = dropY + dropH * 0.64;
    ctx.beginPath(); ctx.moveTo(dropX + pd, divY2); ctx.lineTo(dropX + dropW - pd, divY2);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 0.5*S; ctx.stroke();

    // Balance row
    const rowCY = divY2 + (dropY + dropH - divY2) * 0.45;
    const lFs   = clamp(8*S, dropH * 0.08, 11*S);
    ctx.font = `400 ${lFs}px Interroman, Arial`; ctx.fillStyle = 'rgba(255,255,255,0.46)';
    ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillText('Balance', dropX + pd, rowCY);
    ctx.font = `600 ${valFs * 0.88}px Interroman, Arial`; ctx.fillStyle = '#e8c84a';
    ctx.textAlign = 'end';
    ctx.fillText(fmtCurrency(balance), dropX + dropW - pd, rowCY);

    ctx.restore();
  }
};
// ─────────────────────────────────────────────────────────────────────────────

let _mx = 0, _my = 0; // last pointer position for top-nav hover (canvas coords)

const loop = () => {
  // --- Clear ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateGameState();
  // drawGrid();
  // drawLayout();
  drawUI();
  drawTopNav();
  if (isLabelsOn) drawSectionLabels(lastGEOMETRY);
  drawPopup();
  drawFlyingChips();
  drawPhaseBanner();
  drawChat();
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
  _mx = x; _my = y;

  const inB = (b) => b && x >= b.X && x <= b.X + b.W && y >= b.Y && y <= b.Y + b.H;
  const overNavGame    = topNavGameHits.some(b => inB(b));
  const overNavSetting = topNavSettingsHit && inB(topNavSettingsHit);
  const overNavUser    = topNavUserHit    && inB(topNavUserHit);
  const overNavToggle  = topNavSettingHits.some(b => inB(b));

  const overChip = hitRegions.chip && ctx.isPointInPath(hitRegions.chip, x, y);
  let overBetOption = false;
  let hoverBetKey = null;
  for (const k of Object.keys(REGION_INFO)) {
    if (hitRegions[k] && ctx.isPointInPath(hitRegions[k], x, y)) { hoverBetKey = k; overBetOption = true; break; }
  }
  hoverRegion = hoverBetKey || (overChip ? 'chip' : null);
  const overChat      = hitRegions.chat  && ctx.isPointInPath(hitRegions.chat,  x, y);
  const overLobby     = hitRegions.lobby && ctx.isPointInPath(hitRegions.lobby, x, y);
  const overVolume    = volumeBounds    && x >= volumeBounds.X    && x <= volumeBounds.X    + volumeBounds.W    && y >= volumeBounds.Y    && y <= volumeBounds.Y    + volumeBounds.H;
  const overLayout    = layoutBounds    && x >= layoutBounds.X    && x <= layoutBounds.X    + layoutBounds.W    && y >= layoutBounds.Y    && y <= layoutBounds.Y    + layoutBounds.H;
  const overChatClose = isChatOpen && chatCloseBounds && x >= chatCloseBounds.X && x <= chatCloseBounds.X + chatCloseBounds.W && y >= chatCloseBounds.Y && y <= chatCloseBounds.Y + chatCloseBounds.H;
  const overChatSend  = isChatOpen && chatSendBounds  && x >= chatSendBounds.X  && x <= chatSendBounds.X  + chatSendBounds.W  && y >= chatSendBounds.Y  && y <= chatSendBounds.Y  + chatSendBounds.H;
  const overUndo      = undoBounds   && x >= undoBounds.X   && x <= undoBounds.X   + undoBounds.W   && y >= undoBounds.Y   && y <= undoBounds.Y   + undoBounds.H;
  const overCancel    = cancelBounds && x >= cancelBounds.X && x <= cancelBounds.X + cancelBounds.W && y >= cancelBounds.Y && y <= cancelBounds.Y + cancelBounds.H;
  const overChipRow   = chipRowBounds.some(b => x >= b.X && x <= b.X + b.W && y >= b.Y && y <= b.Y + b.H);
  canvas.style.cursor = (overChip || overChipRow || overBetOption || overChat || overLobby || overVolume || overLayout || overUndo || overCancel || overChatClose || overChatSend || overNavGame || overNavSetting || overNavUser || overNavToggle) ? 'pointer' : 'default';
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

  // ── Top-nav hit detection ──
  {
    const inB = (b) => b && x >= b.X && x <= b.X + b.W && y >= b.Y && y <= b.Y + b.H;
    const navGame    = topNavGameHits.find(b => inB(b));
    const navSetting = topNavSettingHits.find(b => inB(b));
    if (navGame)    { pressedRegion = navGame.id === '__toggle__' ? 'nav_game_toggle' : 'nav_game_' + navGame.id; hoverRegion = pressedRegion; return; }
    if (inB(topNavSettingsHit)) { pressedRegion = 'nav_settings'; hoverRegion = pressedRegion; return; }
    if (inB(topNavUserHit))     { pressedRegion = 'nav_user';     hoverRegion = pressedRegion; return; }
    if (navSetting) { pressedRegion = 'nav_setting_' + navSetting.key; hoverRegion = pressedRegion; return; }
    // Dismiss open panels when clicking outside nav area
    if (isGameDropOpen || isSettingsOpen || isUserPrefOpen) { isGameDropOpen = false; isSettingsOpen = false; isUserPrefOpen = false; }
  }

  let hitBetKey = null;
  for (const k of Object.keys(REGION_INFO)) {
    if (hitRegions[k] && ctx.isPointInPath(hitRegions[k], x, y)) { hitBetKey = k; break; }
  }
  if (hitBetKey) {
    pressedRegion = hitBetKey;
  } else if (chipRowBounds.length > 0 && chipRowBounds.some(b => x >= b.X && x <= b.X + b.W && y >= b.Y && y <= b.Y + b.H)) {
    const hit = chipRowBounds.find(b => x >= b.X && x <= b.X + b.W && y >= b.Y && y <= b.Y + b.H);
    currentChipIndex = hit.index;
    pressedRegion = 'chip';
  } else if (hitRegions.chip && ctx.isPointInPath(hitRegions.chip, x, y)) {
    pressedRegion = 'chip';
    currentChipIndex = (currentChipIndex + 1) % chips.length;
  } else if (hitRegions.chat && ctx.isPointInPath(hitRegions.chat, x, y)) {
    pressedRegion = 'chat';
  } else if (hitRegions.lobby && ctx.isPointInPath(hitRegions.lobby, x, y)) {
    pressedRegion = 'lobby';
  } else if (volumeBounds && x >= volumeBounds.X && x <= volumeBounds.X + volumeBounds.W && y >= volumeBounds.Y && y <= volumeBounds.Y + volumeBounds.H) {
    pressedRegion = 'volume';
  } else if (layoutBounds && x >= layoutBounds.X && x <= layoutBounds.X + layoutBounds.W && y >= layoutBounds.Y && y <= layoutBounds.Y + layoutBounds.H) {
    pressedRegion = 'layout';
  } else if (videoBounds && x >= videoBounds.X && x <= videoBounds.X + videoBounds.W && y >= videoBounds.Y && y <= videoBounds.Y + videoBounds.H) {
    pressedRegion = 'video';
  } else if (labelsBounds && x >= labelsBounds.X && x <= labelsBounds.X + labelsBounds.W && y >= labelsBounds.Y && y <= labelsBounds.Y + labelsBounds.H) {
    pressedRegion = 'labels';
  } else if (isChatOpen && chatCloseBounds && x >= chatCloseBounds.X && x <= chatCloseBounds.X + chatCloseBounds.W && y >= chatCloseBounds.Y && y <= chatCloseBounds.Y + chatCloseBounds.H) {
    pressedRegion = 'chatClose';
  } else if (isChatOpen && chatSendBounds && x >= chatSendBounds.X && x <= chatSendBounds.X + chatSendBounds.W && y >= chatSendBounds.Y && y <= chatSendBounds.Y + chatSendBounds.H) {
    pressedRegion = 'chatSend';
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
  // ── Top-nav actions ──
  if (pressedRegion === 'nav_game_toggle') {
    isGameDropOpen = !isGameDropOpen;
    if (isGameDropOpen) { isUserPrefOpen = false; isSettingsOpen = false; }
    pressedRegion = null; return;
  }
  if (pressedRegion && pressedRegion.startsWith('nav_game_')) {
    const gid = pressedRegion.slice(9);
    isGameDropOpen = false;
    window.location.href = '/betzone/pages/game.html?game=' + gid;
    pressedRegion = null; return;
  }
  if (pressedRegion === 'nav_settings') {
    isSettingsOpen = !isSettingsOpen;
    if (isSettingsOpen) isUserPrefOpen = false;
    pressedRegion = null; return;
  }
  if (pressedRegion === 'nav_user') {
    isUserPrefOpen = !isUserPrefOpen;
    if (isUserPrefOpen) isSettingsOpen = false;
    pressedRegion = null; return;
  }
  if (pressedRegion === 'nav_setting_mute') {
    isMuted = !isMuted; musicEl.muted = isMuted;
    pressedRegion = null; return;
  }
  if (pressedRegion === 'nav_setting_layout') {
    layoutMode = layoutMode === 'playing' ? 'monitoring' : 'playing';
    pressedRegion = null; return;
  }

  if (pressedRegion === 'lobby') { window.location.href = '/'; return; }

  if (pressedRegion === 'chat') {
    isChatOpen = !isChatOpen;
    if (!isChatOpen && chatInputEl) chatInputEl.style.display = 'none';
    pressedRegion = null; return;
  }
  if (pressedRegion === 'chatClose') {
    isChatOpen = false;
    if (chatInputEl) chatInputEl.style.display = 'none';
    pressedRegion = null; return;
  }
  if (pressedRegion === 'chatSend') {
    if (chatInputValue.trim()) {
      chatMessages.push({ user: 'You', text: chatInputValue.trim(), isSelf: true, isSystem: false });
      chatInputValue = '';
      if (chatInputEl) chatInputEl.value = '';
      chatScrollY = 0;
    }
    pressedRegion = null; return;
  }
  if (pressedRegion === 'volume') {
    isMuted = !isMuted;
    musicEl.muted = isMuted;
    pressedRegion = null; return;
  }
  if (pressedRegion === 'layout') {
    layoutMode = layoutMode === 'playing' ? 'monitoring' : 'playing';
    pressedRegion = null; return;
  }
  if (pressedRegion === 'video') {
    isVideoOn = !isVideoOn;
    pressedRegion = null; return;
  }
  if (pressedRegion === 'labels') {
    isLabelsOn = !isLabelsOn;
    pressedRegion = null; return;
  }

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
      bets = GAME_TYPE === 'gostop'  ? { go: 0, stop: 0 }
           : GAME_TYPE === 'oddeven' ? { odd: 0, even: 0 }
           : { player: 0, banker: 0, tie: 0, p_bonus: 0, p_pair: 0, b_bonus: 0, b_pair: 0 };
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
      betLog.unshift({ player: 'You', amount, region: pressedRegion, isYou: true });
      if (betLog.length > 80) betLog.length = 80;
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

canvas.addEventListener('wheel', (e) => {
  if (!isChatOpen) return;
  chatScrollY = Math.max(0, chatScrollY - e.deltaY * 0.5);
}, { passive: true });

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