// --- Canvas Setup ---
const canvas = document.createElement('canvas');
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');

// --- Dimensions & DPI Scaling ---
let width = window.innerWidth;
let height = window.innerHeight;
let scale = window.devicePixelRatio;
let tileSize = Math.min(width, height) / 32;
let scrollX = 0;
let isTouching = false;
let screenX = 0;
let scoreBoardBounds = null;
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
const BETTING_DURATION = 12000;
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
let maxScrollX = containerMaxWidth; // depends on your content width
let leftGutter = 0;

// optional height (full or constrained)
const containerY = 0;
const containerHeight = canvas.height;


const values = ["P", "B", "T"];
const results = []
for (let i = 0; i < 15; i++) {
  const randomValue = values[Math.floor(Math.random() * values.length)];
  // results.push({ value: randomValue });
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
    ctx.font = `700 ${cf}px Arial`; ctx.fillText(rank, w * 0.1, h * 0.05);
    ctx.font = `${cf}px Arial`; ctx.fillText(suit, w * 0.1, h * 0.05 + cf * 1.1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${center}px Arial`; ctx.fillText(suit, w * 0.5, h * 0.5);
    ctx.save(); ctx.translate(w * 0.9, h * 0.9); ctx.rotate(Math.PI);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = `700 ${cf}px Arial`; ctx.fillText(rank, 0, 0);
    ctx.font = `${cf}px Arial`; ctx.fillText(suit, 0, cf * 1.1);
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
  if (w <= 480) return "mobile";
  if (w <= 768) return "tablet";
  if (w <= 1200) return "desktop";
  return "wide";
};

const computeGeometry = () => {

  const bp = getBreakpoint(containerWidth);

  // --- Video ---
  const video = {
    X: leftGutter,
    Y: 0,
    W: containerWidth,
    H: canvas.height * 0.5
  }

  // --- Bet Options ---
  const betOptionsW = Math.min(
    containerWidth * 0.98,  // preferred responsive width
    containerWidth / 2 - containerWidth / 2                  // max width (set your limit)
  );

  const betOptions = {
    X: leftGutter,
    Y: canvas.height * 0.4,
    W: containerWidth,
    H: canvas.height * 0.23
  }

  // --- Statistics ---
  const statistics = {
    X: leftGutter,
    Y: canvas.height * 0.62,
    W: containerWidth,
    H: canvas.height * 0.18
  }

  // --- Menu Bar ---
  const menuBar = {
    X: leftGutter,
    Y: canvas.height * 0.80,
    W: containerWidth,
    H: canvas.height * 0.20
  }


  return {
    video,
    betOptions,
    statistics,
    menuBar,
  }
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
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (gamePhase === 'result' && winners.length > 0) {
    const w = winners[0];
    const blink = Math.sin(performance.now() * 0.006) > 0;
    const tint = w === 'player' ? `rgba(119,82,255,${blink ? 0.07 : 0.03})`
      : w === 'banker' ? `rgba(245,88,88,${blink ? 0.07 : 0.03})`
        : `rgba(88,179,115,${blink ? 0.07 : 0.03})`;
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
    ctx.fillRect(
      rect.X,
      rect.Y,
      rect.W,
      rect.H
    );
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
    ctx.font = "600 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      index.toUpperCase(),
      rect.X + rect.W / 2,
      rect.Y + rect.H / 2,
    );


  }
}

const drawUI = () => {

  const GEOMETRY = computeGeometry();

  drawbetOptions(GEOMETRY);
  drawStatistics(GEOMETRY);
  drawMenuBar(GEOMETRY);

}

const drawbetOptions = (GEOMETRY) => {

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.PRIMARYBLACK
  ctx.fillRect(
    0,
    canvas.height / 2,
    canvas.width,
    canvas.height / 2
  );

  const arcRadius = Math.min(GEOMETRY['betOptions'].W * 0.2, GEOMETRY['betOptions'].H * 0.5)
  const angle = Math.PI / 90
  const betOptionsGap = 7 * scale

  const borderRadius = GEOMETRY['betOptions'].H * 0.15;
  const borderWidth = 2.5 * scale;

  const mainBetfontSize = clamp(12, GEOMETRY['betOptions'].W * 0.033, 16) * scale;
  const sideBetfontSize = clamp(10, GEOMETRY['betOptions'].W * 0.025, 12) * scale;

  const progressBarW = GEOMETRY['betOptions'].W * 0.2;
  const progressBarH = 2 * scale;
  const progressBarR = 10;
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
  ctx.stroke();

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
  const playerWin = gamePhase === 'result' && winners.includes('player');
  const playerBlink = playerWin && Math.sin(performance.now() * 0.006) > 0;
  ctx.shadowColor = COLORS.STROKEBLUE;
  ctx.shadowBlur = playerWin ? (playerBlink ? 50 * scale : 6 * scale) : bets.player > 0 ? 18 * scale : 0;
  ctx.strokeStyle = playerBlink ? '#ffffff' : COLORS.STROKEBLUE;
  ctx.lineWidth = bets.player > 0 || playerWin ? borderWidth * 1.8 : borderWidth;
  ctx.stroke(playerShape);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.FILLBLUE;
  ctx.fill(playerShape);
  if (playerBlink) { ctx.fillStyle = 'rgba(119,82,255,0.38)'; ctx.fill(playerShape); }
  if (pressedRegion === 'player') { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(playerShape); }
  ctx.restore();


  // -- Name --
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize}px Arial`
  ctx.fillText('PLAYER', player.X + player.TW * 0.5 - player.R * 0.5, player.Y + player.LH * 0.2);

  // -- Odds --
  ctx.fillStyle = "#fff";
  ctx.font = `300 ${mainBetfontSize * 0.75}px Arial`
  ctx.fillText('0.95:1', player.X + player.TW * 0.5 - player.R * 0.5, player.Y + player.LH * 0.325);

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
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
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
  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.fillText('12', player.X + player.TW * 0.57 - player.R, (player.CY - player.R * 0.225));

  // Percentage
  ctx.textAlign = "end"
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.fillText('₱1,233,990', player.X + player.TW * 0.5, player.CY - player.R * 0.225);
  betChipPositions.player = { x: player.X + player.TW * 0.35, y: player.Y + player.LH * 0.55, r: arcRadius * 0.32 };
  if (gamePhase !== 'result') drawBetChip(player.X + player.TW * 0.35, player.Y + player.LH * 0.55, arcRadius * 0.32, bets.player);
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
  ctx.shadowBlur = bankerWin ? (bankerBlink ? 50 * scale : 6 * scale) : bets.banker > 0 ? 18 * scale : 0;
  ctx.strokeStyle = bankerBlink ? '#ffffff' : COLORS.STROKERED;
  ctx.lineWidth = bets.banker > 0 || bankerWin ? borderWidth * 1.8 : borderWidth;
  ctx.stroke(bankerShape);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.FILLRED;
  ctx.fill(bankerShape);
  if (bankerBlink) { ctx.fillStyle = 'rgba(245,88,88,0.38)'; ctx.fill(bankerShape); }
  if (pressedRegion === 'banker') { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(bankerShape); }
  ctx.restore();

  // -- Name --
  ctx.textAlign = `center`
  ctx.font = `600 ${mainBetfontSize}px Arial`
  ctx.fillStyle = "#d6dbb7";
  ctx.fillText('BANKER', banker.X + banker.TW / 2 + banker.R / 2, banker.Y + banker.RH * 0.2);

  // -- Odds --
  ctx.fillStyle = "#ffffff";
  ctx.font = `300 ${mainBetfontSize * 0.7}px Arial`
  ctx.fillText('0.95:1', banker.X + banker.TW / 2 + banker.R / 2, banker.Y + banker.RH * 0.325);


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
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
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
  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.fillText('12', banker.X + banker.TW * 0.53, (banker.CY - banker.R * 0.225));


  // Percentage
  ctx.textAlign = "end"
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.fillText('₱1,233,990', banker.X + banker.TW * 0.5 + banker.R, banker.CY - banker.R * 0.225);
  betChipPositions.banker = { x: banker.X + banker.TW * 0.65, y: banker.Y + banker.RH * 0.55, r: arcRadius * 0.32 };
  if (gamePhase !== 'result') drawBetChip(banker.X + banker.TW * 0.65, banker.Y + banker.RH * 0.55, arcRadius * 0.32, bets.banker);


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
  ctx.shadowBlur = tieWin ? (tieBlink ? 50 * scale : 6 * scale) : bets.tie > 0 ? 18 * scale : 0;
  ctx.strokeStyle = tieBlink ? '#ffffff' : COLORS.STROKEGREEN;
  ctx.lineWidth = bets.tie > 0 || tieWin ? borderWidth * 1.8 : borderWidth;
  ctx.stroke(tieShape);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.FILLGREEN;
  ctx.fill(tieShape);
  if (tieBlink) { ctx.fillStyle = 'rgba(88,179,115,0.38)'; ctx.fill(tieShape); }
  if (pressedRegion === 'tie') {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill(tieShape);
  }
  ctx.restore();


  // -- Name --
  ctx.textAlign = `center`
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize}px Arial`
  ctx.fillText('TIE', tie.CX, tie.CY - (tie.R * 0.55));

  // -- Odds --
  ctx.fillStyle = "#ffffff";
  ctx.font = `300 ${mainBetfontSize * 0.75}px Arial`
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
  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.fillText('12', tie.CX - progressBarW / 3, (tie.CY - tie.R * 0.225));

  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.textAlign = "end"
  ctx.fillText('₱220,330', tie.CX + progressBarW / 2, tie.CY - tie.R * 0.225);
  betChipPositions.tie = { x: tie.CX, y: tie.CY - tie.R * 0.35, r: tie.R * 0.38 };
  if (gamePhase !== 'result') drawBetChip(tie.CX, tie.CY - tie.R * 0.35, tie.R * 0.38, bets.tie);

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
      H: (GEOMETRY['betOptions'].H * 0.25),
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
    ctx.font = `600 ${sideBetfontSize}px Arial`
    ctx.fillText(side.replace(/_/g, ' '), sideBet.X + sideBet.W * 0.5, sideBet.Y + sideBet.H * 0.40);

    // -- Odds --
    ctx.fillStyle = "#ffffff";
    ctx.font = `300 ${sideBetfontSize * 0.85}px Arial`
    ctx.fillText('04:20', sideBet.X + sideBet.W * 0.5, sideBet.Y + sideBet.H * 0.70);
    betChipPositions[side.toLowerCase()] = { x: sideBet.X + sideBet.W * 0.5, y: sideBet.Y + sideBet.H * 0.5, r: sideBet.H * 0.28 };
    if (gamePhase !== 'result') drawBetChip(sideBet.X + sideBet.W * 0.5, sideBet.Y + sideBet.H * 0.5, sideBet.H * 0.28, bets[side.toLowerCase()]);



    sideX += sideBet.W + betOptionsGap
  });
}

const drawStatistics = (GEOMETRY) => {

  ctx.setLineDash([])

  const summaryRatio = 0.20
  const scoreBoardRatio = 1 - summaryRatio

  // --- Summary ---
  const summary = {
    X: GEOMETRY['statistics'].X,
    Y: GEOMETRY['statistics'].Y,
    W: GEOMETRY['statistics'].W,
    H: GEOMETRY['statistics'].H * summaryRatio,
  }



  ctx.fillStyle = COLORS.PRIMARYBLACK
  ctx.fillRect(
    GEOMETRY['statistics'].X,
    GEOMETRY['statistics'].Y,
    GEOMETRY['statistics'].W,
    GEOMETRY['statistics'].H
  );


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


  let startX = summary.X + tileSize;
  const radius = summary.H * 0.2;
  for (const [key, obj] of Object.entries(stats)) {
    let spaceToNext = radius * 4.5
    ctx.font = `300 ${getFontSize(summary.W * 0.5, summary.H * 0.25)}px Arial`
    ctx.fillStyle = "#fff"
    ctx.textAlign = "center";
    // ctx.fillText('#42', startX, summary.Y + summary.H * 0.5)

    if ([
      'playerTotal', 'bankerTotal', 'tieTotal', 'playerPairTotal', 'bankerPairTotal',].includes(key)) {

      // -- Result Summary --
      ctx.beginPath();
      ctx.arc(startX, summary.Y + summary.H * 0.5, radius, 0, Math.PI * 90, false)
      ctx.closePath();
      ctx.fillStyle = stats[key].bg
      ctx.fill();
      ctx.font = `600 ${clamp(summary.W / cols * 0.75, 15, radius * 1.5)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";


      if (['playerTotal', 'bankerTotal', 'tieTotal'].includes(key)) {
        ctx.fillText(key.toUpperCase()[0], startX, summary.Y + summary.H * 0.525)
        ctx.fillText(obj.value, startX + radius * 2, summary.Y + summary.H * 0.525)
      }

      else if (['playerPairTotal', 'bankerPairTotal',].includes(key)) {
        ctx.fillText(obj.value, startX + radius * 2, summary.Y + summary.H * 0.525)
      }


    }


    // -- Game Number --
    else if (['gameNo'].includes(key)) {
      ctx.font = `600 ${clamp(summary.W / cols * 0.75, 15, radius * 1.5)}px Arial`;
      ctx.fillText(`#${obj.value}`, startX + radius * 2, summary.Y + summary.H * 0.5)
      spaceToNext = radius * 2 + 35
    }
    // -- Prediction --
    else if (['playerPrediction', 'bankerPrediction'].includes(key)) {
      const predictionWidth = clamp(100, summary.W * 0.1, 120);
      const predictionRadius = clamp(12, predictionWidth / 4, radius * 0.65);
      ctx.beginPath();
      ctx.roundRect(startX, summary.Y + summary.H * 0.2, predictionWidth, summary.H * 0.6, 5);
      // ctx.fillStyle = key === 'playerPrediction' ? COLORS.PLAYERBLUE: COLORS.BANKERRED
      ctx.fillStyle = key === 'playerPrediction' ? COLORS.FILLBLUE : COLORS.FILLRED;
      ctx.fill();
      ctx.strokeStyle = key === 'playerPrediction' ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.lineWidth = 1 * scale;
      ctx.setLineDash([]);
      ctx.stroke();
      spaceToNext = predictionWidth + radius;
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${getFontSize(summary.W / cols * 0.75, summary.H)}px Arial`;
      ctx.fillText(`${key.toUpperCase()[0]}`, startX + predictionWidth * 0.15, summary.Y + summary.H * 0.52);

      ctx.beginPath();
      ctx.arc(startX + predictionWidth * 0.35, summary.Y + summary.H * 0.5, predictionRadius, 0, Math.PI * 90, false)
      ctx.strokeStyle = key === 'playerPrediction' ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(startX + predictionWidth * 0.58, summary.Y + summary.H * 0.5, predictionRadius, 0, Math.PI * 90, false)
      ctx.fillStyle = key === 'playerPrediction' ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.strokeStyle = key === 'playerPrediction' ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.stroke();
      ctx.fill();

      ctx.beginPath();
      const temp = startX + predictionWidth * 0.75
      ctx.moveTo(temp, summary.Y + summary.H * 0.5 + radius * 0.5)
      ctx.lineTo(temp + radius, summary.Y + summary.H * 0.5 - predictionRadius)
      ctx.strokeStyle = key === 'playerPrediction' ? COLORS.STROKEBLUE : COLORS.STROKERED;
      ctx.stroke();

    }
    // startX += summary.W / cols
    startX += spaceToNext
  }





  // --- Scoreboard ---
  const scoreBoard = {
    X: GEOMETRY['statistics'].X,
    Y: GEOMETRY['statistics'].Y + summary.H,
    W: GEOMETRY['statistics'].W,
    H: GEOMETRY['statistics'].H * scoreBoardRatio,
  }
  scoreBoardBounds = scoreBoard;




  // --- SCROLLABLE START -********************************************************************************
  const populateBeadRoad = (grid) => {
    const { rows, cols, posX, posY, gridHeight, cellW, cellH, totalWidth } = grid


    results.forEach((result, index) => {
      const col = Math.floor(index / rows); // vertical fill
      const row = index % rows;

      const x = posX + col * cellW;
      const y = posY + row * cellH;

      const cellCX = x + cellW / 2;
      const cellCY = y + cellH / 2;
      const cellR = cellW * 0.45;


      const bg = result.value === "P" ? COLORS.PLAYERBLUE
        : result.value === "B" ? COLORS.BANKERRED
          : COLORS.TIEGREEN

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(
        cellCX,
        cellCY,
        cellR,
        0, Math.PI * 2,
        false
      );
      ctx.closePath();
      ctx.fill();


      ctx.fillStyle = "#fff"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.font = `600 ${clamp(12, cellW / 2, radius * 2)}px Arial`
      ctx.fillText(result.value, cellCX, cellCY)


    })

  }
  const populateBigRoad = (grid) => {
    0.5
    const { rows, cols, posX, posY, cellW, cellH } = grid;

    let col = 0;
    let row = 0;
    let prevValue = null;

    results.forEach((result) => {
      if (prevValue !== null && result.value !== prevValue) {
        col++;
        row = 0;
      }

      if (col >= cols || row >= rows) return;

      const x = posX + col * cellW;
      const y = posY + row * cellH;
      const cellCX = x + cellW / 2;
      const cellCY = y + cellH / 2;
      const cellR = cellW * 0.4;

      const bg = result.value === "P" ? COLORS.PLAYERBLUE
        : result.value === "B" ? COLORS.BANKERRED
          : COLORS.TIEGREEN;

      ctx.strokeStyle = bg;
      ctx.beginPath();
      ctx.arc(cellCX, cellCY, cellR, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.lineWidth = 1.6 * scale
      ctx.stroke();

      // ctx.fillStyle = "#fff";
      // ctx.textAlign = "center";
      // ctx.textBaseline = "middle";
      // ctx.font = `600 ${clamp(12, cellW / 2, cellR)}px Arial`;
      // ctx.fillText(result.value, cellCX, cellCY);

      prevValue = result.value;
      row++;
    });
  }
  const populateBigEye = (grid) => {
    const { rows, cols, posX, posY, cellW, cellH } = grid;

    let col = 0;
    let row = 6;
    let prevValue = null;

    results.forEach((result) => {
      if (prevValue !== null && result.value !== prevValue) {
        col += 0.5;
        row = 6;
      }

      if (col >= cols || row >= rows) return;

      const x = posX + col * cellW;
      const y = posY + row * cellH;
      const cellCX = x + cellW * 0.25;
      const cellCY = y + cellH * 0.25;
      const cellR = cellW * 0.18;

      const bg = result.value === "P" ? COLORS.PLAYERBLUE
        : result.value === "B" ? COLORS.BANKERRED
          : COLORS.TIEGREEN;

      ctx.strokeStyle = bg;
      ctx.beginPath();
      ctx.arc(cellCX, cellCY, cellR, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.lineWidth = 0.5 * scale
      ctx.stroke();



      prevValue = result.value;
      row += 0.5;
    });
  }
  const populateSmallEye = (grid) => {
    const { rows, cols, posX, posY, cellW, cellH } = grid;

    let col = 7;
    let row = 6;
    let prevValue = null;

    results.forEach((result) => {
      if (prevValue !== null && result.value !== prevValue) {
        col += 0.5;
        row = 6;
      }

      if (col >= cols || row >= rows) return;

      const x = posX + col * cellW;
      const y = posY + row * cellH;
      const cellCX = x + cellW * 0.25;
      const cellCY = y + cellH * 0.25;
      const cellR = cellW * 0.18;

      const bg = result.value === "P" ? COLORS.PLAYERBLUE
        : result.value === "B" ? COLORS.BANKERRED
          : COLORS.TIEGREEN;

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cellCX, cellCY, cellR, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.lineWidth = 1 * scale
      ctx.fill();



      prevValue = result.value;
      row += 0.5;
    });
  }
  const populateCockroach = (grid) => {
    const { rows, cols, posX, posY, cellW, cellH } = grid;

    let col = 14;
    let row = 6;
    let prevValue = null;

    results.forEach((result) => {
      if (prevValue !== null && result.value !== prevValue) {
        col += 0.5;
        row = 6;
      }

      if (col >= cols || row >= rows) return;

      const x = posX + col * cellW;
      const y = posY + row * cellH;
      const cellCX = x + cellW * 0.25;
      const cellCY = y + cellH * 0.25;
      const cellR = cellW * 0.2;

      const bg = result.value === "P" ? COLORS.PLAYERBLUE
        : result.value === "B" ? COLORS.BANKERRED
          : COLORS.TIEGREEN;

      ctx.strokeStyle = bg;

      ctx.save(); // save current state

      // move origin to rotation point (pivot)
      ctx.translate(x + 2, cellCY + 4);

      // rotate (in radians)
      ctx.rotate(-Math.PI / 4); // example: 45 degrees

      // draw relative to new origin (0,0)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cellW * 0.5, 0);
      ctx.stroke();

      ctx.restore(); // restore original state



      prevValue = result.value;
      row += 0.5;
    });
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(scoreBoard.X, scoreBoard.Y, containerWidth, scoreBoard.H);
  ctx.clip();
  ctx.translate(-scrollX, 0);


  const gridA = constructGrid(9, 21, scoreBoard.X, scoreBoard.Y, scoreBoard.H, 1, 3, 6);
  const gridE = constructGrid(6, 54, scoreBoard.X + gridA.totalWidth, scoreBoard.Y, scoreBoard.H);


  populateBigRoad(gridA)
  populateBigEye(gridA)
  populateSmallEye(gridA)
  populateCockroach(gridA)
  populateBeadRoad(gridE)


  maxScrollX = (gridA.totalWidth + gridE.totalWidth) / 5;


  ctx.restore();
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

  ctx.fillStyle = COLORS.PRIMARYBLACK;
  ctx.fillRect(GEOMETRY['menuBar'].X, GEOMETRY['menuBar'].Y, GEOMETRY['menuBar'].W, GEOMETRY['menuBar'].H);

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

  ctx.arc(main.X + main.W * 0.10, main.Y + radius + 10, radius, -angle * 45, angle * 0, false)
  ctx.arc(main.X + main.W * 0.10 + diameter, main.Y + radius, radius, angle * 87, angle * 45, true)
  ctx.arc(main.X + main.W * 0.90 - diameter, main.Y + radius, radius, angle * 45, angle * 3, true)
  ctx.arc(main.X + main.W * 0.90, main.Y + radius + 10, radius, -angle * 90, -angle * 45, false)
  ctx.lineTo(main.X + main.W, main.Y + 10)
  ctx.lineTo(main.X + main.W, main.Y + main.H)

  ctx.strokeStyle = "#1f1f1f"
  ctx.lineWidth = 1.75 * scale;
  ctx.stroke();

  ctx.lineTo(main.X, main.Y + main.H)
  ctx.fillStyle = COLORS.SECONDARYBLACK;

  ctx.fill();

  // -- Chat Button--

  const chatButton = {
    X: main.X + radius * 0.75,
    Y: main.Y + radius * 0.75,
    H: main.H * 0.2,
    W: main.H * 0.3,
    R: 5
  }
  ctx.beginPath();
  // ctx.moveTo(chatButton.X, chatButton.Y)
  ctx.arc(
    chatButton.X + chatButton.W - chatButton.R,
    chatButton.Y + chatButton.R,
    chatButton.R,
    Math.PI * 1.5, // start (top)
    0,            // end (right)
    false         // clockwise
  );
  ctx.arc(
    chatButton.X + chatButton.W - chatButton.R,
    chatButton.Y + chatButton.H - chatButton.R,
    chatButton.R,
    0,            // end (right)
    -Math.PI * 1.5, // start (top)
    false         // clockwise
  );

  // ctx.lineTo(chatButton.X + chatButton.W, chatButton.Y + chatButton.H )
  ctx.lineTo(chatButton.X + radius * 0.3, chatButton.Y + chatButton.H)
  ctx.lineTo(chatButton.X, chatButton.Y + chatButton.H + 5)

  ctx.arc(
    chatButton.X + chatButton.R,
    chatButton.Y + chatButton.R,
    chatButton.R,
    Math.PI,
    Math.PI * 1.5,
    false
  );

  ctx.closePath();
  ctx.strokeStyle = "#fff"
  ctx.stroke();
  ctx.font = `30 ${clamp(12, chatButton.W * 0.5, 20)}px Arial`
  ctx.fillStyle = "#ffffffda"
  ctx.fillText("Chat", chatButton.X + chatButton.W * 0.5, chatButton.Y + chatButton.H + 28)


  // -- Lobby Button
  const lobbyButton = {
    X: main.X + main.W - (main.H * 0.3) - radius * 0.75,
    Y: main.Y + radius * 0.75,
    H: main.H * 0.2,
    W: main.H * 0.3,
    R: 5,
  }

  const lobbyShape = new Path2D();
  lobbyShape.rect(lobbyButton.X, lobbyButton.Y, lobbyButton.W, lobbyButton.H);
  hitRegions.lobby = lobbyShape;

  // -- Controller icon inside lobby button --
  ctx.save();
  ctx.setLineDash([]);
  const pad = lobbyButton.H * 0.12;
  const gX = lobbyButton.X + pad;
  const gY = lobbyButton.Y + pad;
  const gW = lobbyButton.W - pad * 2;
  const gH = lobbyButton.H;
  const bodyH = gH;

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 0.8 * scale;

  // Body
  ctx.beginPath();
  ctx.roundRect(gX, gY, gW, bodyH, bodyH * 0.28);
  ctx.stroke();

  // Left grip
  ctx.beginPath();
  ctx.arc(gX + gW * 0.22, gY + bodyH, gW * 0.14, Math.PI, 0, true);
  ctx.stroke();

  // Right grip
  ctx.beginPath();
  ctx.arc(gX + gW * 0.78, gY + bodyH, gW * 0.14, Math.PI, 0, true);
  ctx.stroke();

  // D-pad (+ cross)
  const dpSize = bodyH * 0.18;
  const dpCX = gX + gW * 0.27;
  const dpCY = gY + bodyH * 0.5;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.rect(dpCX - dpSize * 1.5, dpCY - dpSize * 0.5, dpSize * 3, dpSize);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(dpCX - dpSize * 0.5, dpCY - dpSize * 1.5, dpSize, dpSize * 3);
  ctx.fill();

  // Action buttons (4 dots in diamond)
  const btnR = bodyH * 0.1;
  const btnCX = gX + gW * 0.73;
  const btnCY = gY + bodyH * 0.5;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(btnCX + dx * btnR * 2, btnCY + dy * btnR * 2, btnR, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

  ctx.font = `30 ${clamp(10, lobbyButton.W * 0.5, 18)}px Arial`
  ctx.fillStyle = "#ffffff5d"
  ctx.fillText("Lobby", lobbyButton.X + lobbyButton.W * 0.5, lobbyButton.Y + lobbyButton.H + 28)

  const chipsController = {
    X: main.X + main.W / 2 - (main.W * 0.325),
    Y: main.Y,
    W: main.W * 0.65,
    H: main.H * 0.75
  }

  // --- Undo Button
  const undoButton = {
    X: chipsController.X,
    Y: chipsController.Y,
    W: chipsController.W / 3,
    H: chipsController.H,
    CX: chipsController.H * 0.125,
    CY: chipsController.H * 0.25,
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

  ctx.moveTo(undoButton.X + undoButton.W * 0.5 - undoButton.R + 5, undoButton.Y + undoButton.H * 0.30)
  ctx.lineTo(undoButton.X + undoButton.W * 0.5 - undoButton.R - 2, undoButton.Y + undoButton.H * 0.38)

  ctx.lineTo(undoButton.X + undoButton.W * 0.5 - undoButton.R + 5, undoButton.Y + undoButton.H * 0.45)
  // ctx.lineTo(undoButton.X + 5, undoButton.Y + undoButton.H * 0.25 -7)

  ctx.strokeStyle = betHistory.length > 0 ? "#ffffffcc" : "#ffffff3a"
  ctx.lineWidth = 2 * scale
  ctx.stroke();

  undoBounds = { X: undoButton.X, Y: undoButton.Y, W: undoButton.W, H: undoButton.H };

  const mainCX = main.X + main.W * 0.5
  const iconWidth = main.H * 0.25

  // --- cancel Button
  const cancelButton = {
    X: chipsController.X + (chipsController.W / 3) * 2,
    Y: chipsController.Y,
    W: chipsController.W / 3,
    H: chipsController.H,
    CX: chipsController.X + chipsController / 2,
    CY: chipsController.H / 2,
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
  ctx.lineTo(cancelButton.X + cancelButton.W * 0.5 + 5, cancelButton.Y + cancelButton.H * 0.35)
  ctx.lineTo(cancelButton.X + cancelButton.W * 0.5, cancelButton.Y + cancelButton.H * 0.4)

  ctx.strokeStyle = "#ffffffcc"
  ctx.lineWidth = 2 * scale
  ctx.stroke();

  cancelBounds = { X: cancelButton.X, Y: cancelButton.Y, W: cancelButton.W, H: cancelButton.H };


  // --- Chip Button
  const chipButton = {
    X: chipsController.X + (chipsController.W / 3),
    Y: chipsController.Y,
    W: chipsController.W / 3,
    H: chipsController.H,
    CX: chipsController.X + chipsController / 2,
    CY: chipsController.H / 2,
    R: chipsController.H * 0.125
  }

  const chipCX = chipButton.X + chipButton.W / 2;
  const chipCY = chipButton.Y + chipButton.H * 0.5;
  const chipR = chipButton.H * 0.38;
  chipButtonCenter = { x: chipCX, y: chipCY, r: chipR };

  // Outer body
  const chipShape = new Path2D();
  ctx.lineWidth = 1.5 * scale;
  chipShape.arc(chipCX, chipCY, chipR, 0, Math.PI * 2);
  chipShape.closePath();

  const chipColor = CHIP_COLORS[currentChipIndex];
  hitRegions.chip = chipShape;
  ctx.save();
  ctx.shadowColor = chipColor.shadow;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = chipColor.stroke;
  ctx.stroke(chipShape);
  ctx.fillStyle = chipColor.fill;
  ctx.fill(chipShape);
  if (pressedRegion === 'chip') {
    ctx.fill(chipShape);
    ctx.shadowColor = "#f7f6d1";
  }
  ctx.restore();

  // Edge segments
  const chipSegs = 8;
  for (let i = 0; i < chipSegs; i++) {
    const segStart = (Math.PI * 2 / chipSegs) * i;
    const segEnd = segStart + (Math.PI * 2 / chipSegs) * 0.55;
    ctx.beginPath();
    ctx.arc(chipCX, chipCY, chipR * 0.9, segStart, segEnd);
    ctx.arc(chipCX, chipCY, chipR * 0.74, segEnd, segStart, true);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
    ctx.fill();
  }

  // Inner ring
  ctx.beginPath();
  ctx.arc(chipCX, chipCY, chipR * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = chipColor.stroke;
  ctx.lineWidth = 1 * scale;
  ctx.stroke();



  // Label
  const chipFontSize = clamp(10, chipR * 0.58, 40);
  ctx.font = `700 ${chipFontSize}px Arial`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const formatter = new Intl.NumberFormat('en', { notation: 'compact' });
  let formattedValue = chips[currentChipIndex] > 900 ? formatter.format(chips[currentChipIndex]) : chips[currentChipIndex].toString();
  ctx.fillText(formattedValue, chipCX, chipCY);



  // --- Wallet ---
  const wallet = {
    X: GEOMETRY['menuBar'].X,
    Y: GEOMETRY['menuBar'].Y + main.H,
    W: GEOMETRY['menuBar'].W,
    H: GEOMETRY['menuBar'].H * 0.5,
  }

  ctx.fillStyle = COLORS.FILLBLUE
  // ctx.fillRect(wallet.X, wallet.Y, wallet.W, wallet.H)


  ctx.fillStyle = "#818181";
  ctx.textAlign = "start";
  ctx.font = `100 ${clamp(10, wallet.H * 0.15, tileSize)}px Arial`
  ctx.fillText("Speed Bacarrat ₱50-10,000", wallet.X + tileSize, wallet.Y);

  const timeText = "04:20:34";
  const timeTextW = ctx.measureText(timeText).width;
  ctx.textAlign = "end";
  ctx.fillText(timeText, wallet.X + wallet.W - tileSize, wallet.Y);


  ctx.strokeStyle = "#ffffff";
  ctx.beginPath()
  ctx.moveTo(wallet.X + tileSize, wallet.Y + wallet.H * 0.125);
  ctx.lineTo(wallet.X + tileSize * 2, wallet.Y + wallet.H * 0.125);
  ctx.stroke();

  ctx.beginPath()
  ctx.roundRect(wallet.X + tileSize, wallet.Y + wallet.H * 0.15, tileSize * 1.225, wallet.H * 0.17, 2);
  ctx.lineWidth = 1 * scale
  ctx.stroke();

  ctx.beginPath()
  ctx.arc(
    wallet.X + tileSize * 1.7,
    wallet.Y + wallet.H * 0.225,
    2,
    0,
    Math.PI * 2,
    false
  )
  ctx.fillStyle = "#ffffff";
  ctx.fill();


  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "start";
  ctx.font = `100 ${clamp(10, wallet.H * 0.225, tileSize)}px Arial`
  ctx.fillText(fmtCurrency(balance), wallet.X + tileSize * 2.5, wallet.Y + wallet.H * 0.225);


  // ctx.beginPath()
  // ctx.arc(
  //   wallet.X + wallet.W - tileSize ,
  //   wallet.Y + wallet.H * 0.225,
  //   10,
  //   0,
  //   Math.PI * 2,
  //   false
  // )
  // ctx.stroke();
  const text = fmtCurrency(balance);
  const x = wallet.X + wallet.W - tileSize;
  const y = wallet.Y + wallet.H * 0.225;

  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.font = `${clamp(10, wallet.H * 0.225, tileSize)}px Arial`;

  // measure text
  const textWidth = ctx.measureText(text).width;

  // icon settings
  const iconSize = 28;
  const gap = 6;

  // compute icon position (BEFORE text)
  const iconX = x - textWidth - gap - iconSize;
  const iconY = y - iconSize / 2;
  let stackY = iconY
  ctx.beginPath();
  ctx.arc(iconX + iconSize / 2, stackY + 15, iconSize / 2, -Math.PI * 0.8, -Math.PI * 0.2, false);
  ctx.lineWidth = 1 * scale
  ctx.stroke();
  for (let y = 0; y < 3; y++) {
    // draw icon (example: circle avatar)
    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, stackY, iconSize / 2, Math.PI * 0.2, Math.PI * 0.8, false);
    ctx.stroke();
    stackY += 5
  }

  // draw text
  ctx.fillText(text, x, y);

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

  const isMobile = canvas.width <= 580;
  const spacing = 10;
  const buttonGap = spacing / 2;

  containerAvailableWidth = canvas.width;
  containerMaxWidth = 580 * scale;
  containerWidth = isMobile ? containerAvailableWidth   // full width on phone
    : Math.min(containerAvailableWidth, containerMaxWidth);
  leftGutter = (canvas.width - containerWidth) / 2;


  scrollX = 0;
  maxScrollX = containerWidth; // depends on your content width
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
  ctx.font = `${13 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', closeX, closeY);

  // Label
  ctx.fillStyle = info.color;
  ctx.font = `700 ${20 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(info.label, cardX + cardW / 2, cardY + cardH * 0.28);

  // Odds
  ctx.fillStyle = '#facc15';
  ctx.font = `300 ${32 * scale}px Arial`;
  ctx.fillText(info.odds, cardX + cardW / 2, cardY + cardH * 0.55);

  // Description
  ctx.fillStyle = '#9ca3af';
  ctx.font = `${12 * scale}px Arial`;
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
  const now = performance.now();
  let label, color;
  if (gamePhase === 'betting') {
    const left = Math.max(0, BETTING_DURATION - (now - bettingCountdownStart));
    const secs = Math.ceil(left / 1000);
    label = `PLACE YOUR BETS  ${secs}`;
    color = secs <= 3 ? '#f55858' : '#e8c84a';
  } else if (gamePhase === 'dealing') {
    label = 'NO MORE BETS';
    color = '#ffffff66';
  } else if (gamePhase === 'result') {
    const pTotal = handTotal(playerCards);
    const bTotal = handTotal(bankerCards);
    const w = winners[0];
    label = w === 'tie' ? `TIE  ${pTotal} - ${bTotal}` : w === 'player' ? `PLAYER WINS  ${pTotal} - ${bTotal}` : `BANKER WINS  ${bTotal} - ${pTotal}`;
    color = w === 'player' ? COLORS.STROKEBLUE : w === 'banker' ? COLORS.STROKERED : COLORS.STROKEGREEN;
  }
  if (!label) return;
  const bx = leftGutter + containerWidth * 0.5;
  const by = canvas.height * 0.39;
  const fontSize = clamp(10, containerWidth * 0.03, 18) * scale;
  ctx.save();
  ctx.font = `700 ${fontSize}px Interroman, Arial`;
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(bx - tw / 2 - 14 * scale, by - fontSize * 0.75, tw + 28 * scale, fontSize * 1.5, 4 * scale);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx, by);
  ctx.restore();
};

const loop = () => {
  // --- Clear ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateGameState();
  drawGrid();
  drawLayout();
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
  } else if (hitRegions.chip && ctx.isPointInPath(hitRegions.chip, x, y)) {
    pressedRegion = 'chip';

    currentChipIndex++;
    if (currentChipIndex >= chips.length) {
      currentChipIndex = 0
    }

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
  if (pressedRegion === 'lobby') { window.location.href = 'index.html'; return; }

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
  if (!scoreBoardBounds) return;
  const rect = canvas.getBoundingClientRect();
  const tx = (e.touches[0].clientX - rect.left) * scale;
  const ty = (e.touches[0].clientY - rect.top) * scale;
  const sb = scoreBoardBounds;
  if (tx < sb.X || tx > sb.X + sb.W || ty < sb.Y || ty > sb.Y + sb.H) return;
  isTouching = true;
  screenX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", (e) => {
  if (!isTouching) return;

  const currentX = e.touches[0].clientX;
  const dx = screenX - currentX;

  scrollX += dx;
  scrollX = Math.max(0, Math.min(scrollX, maxScrollX));
  screenX = currentX;


});

canvas.addEventListener("touchend", () => {
  isTouching = false;
});