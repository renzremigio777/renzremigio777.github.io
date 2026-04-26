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


const maxWidth = 800; // your max container width
const padding = 16;



let containerAvailableWidth = 0;
let containerMaxWidth =580;
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
    X: leftGutter ,
    Y: canvas.height * 0.4,
    W: containerWidth,
    H: canvas.height * 0.23
  }

  // --- Statistics ---
  const statistics = {
    X: leftGutter,
    Y: canvas.height * 0.62 ,
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

const constructGrid = (rows, cols, posX, posY, gridHeight, cellSize = 1, divX,divY) => {

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
    rows, cols, posX, posY, gridHeight, cellW,cellH, totalWidth,
  }
}

const drawGrid = () => {
  // --- Clear ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Background ---
  // ctx.fillStyle = "rgb(54, 50, 50)";
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
  for (const [index, rect] of  Object.entries(GEOMETRY)) {
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
    canvas.height/2,
    canvas.width,
    canvas.height/2
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
  ctx.strokeStyle ="#00000059";
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
    CX: GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.5 ,
    CY: GEOMETRY['betOptions'].Y + GEOMETRY['betOptions'].H * 0.65,
    R: arcRadius ,
  }


  const playerStartAngle = Math.atan2(player.Y - player.CY, (player.X + player.TW) - player.CX + betOptionsGap *0.25);
  const playerArcX = player.CX + player.R * Math.cos(playerStartAngle);

  const playerCardsG = 5 * scale
  const playerCardW = clamp(20 * scale, (player.TW - player.R) * 0.2, 32 * scale);
  const playerCardH = playerCardW * (4 / 3);
  const playerCardR = 2 * scale;

  const totalCardWidth = ((playerCardW + playerCardsG) * 3)

  const playerCardsX = GEOMETRY['betOptions'].X + GEOMETRY['betOptions'].W * 0.25 - totalCardWidth;
  const playerCardsY = player.Y + (player.LH) * 0.40;


  ctx.beginPath();
  ctx.moveTo(playerArcX, player.Y);

  // -- Inner Arc --
  ctx.arc(player.CX, player.CY, player.R, playerStartAngle, Math.PI, true);

  ctx.lineTo(player.X, player.Y + player.LH);

  // -- Outer Arc --
  ctx.arc(player.X + borderRadius, player.Y + borderRadius,  borderRadius, angle * 90, -angle * 45, false);

  ctx.strokeStyle = COLORS.STROKEBLUE;
  ctx.lineWidth = borderWidth;
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = COLORS.FILLBLUE;
  ctx.fill();


  // -- Name --
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize}px Arial`
  ctx.fillText('PLAYER', player.X + player.TW * 0.5 - player.R * 0.5, player.Y + player.LH * 0.2 );

  // -- Odds --
  ctx.fillStyle = "#fff";
  ctx.font = `300 ${mainBetfontSize * 0.75}px Arial`
  ctx.fillText('0.95:1', player.X + player.TW * 0.5 - player.R * 0.5, player.Y + player.LH * 0.325 );

  // -- Cards --

  ctx.fillStyle = "rgba(117, 110, 110, 0.27)";
  ctx.lineWidth = 1 * scale;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.76)";

  ctx.beginPath();
  ctx.roundRect(playerCardsX, playerCardsY, playerCardW, playerCardH, playerCardR);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(playerCardsX + playerCardW + playerCardsG, playerCardsY, playerCardW, playerCardH, playerCardR);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(playerCardsX + (playerCardW + playerCardsG) * 2 , playerCardsY, playerCardW, playerCardH, playerCardR);
  ctx.closePath();
  ctx.stroke();

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

  ctx.beginPath();
  ctx.moveTo(bankerArcX, banker.Y);

  // -- Inner Arc --
  ctx.arc(banker.CX, banker.CY, banker.R, bankerStartAngle, 0, false);

  ctx.lineTo(banker.X + banker.TW, banker.Y + banker.RH);

  // -- Outer Arc --
  ctx.arc(banker.X + banker.TW - borderRadius, banker.Y + borderRadius, borderRadius, angle * 0, -angle * 45, true);

  ctx.strokeStyle = COLORS.STROKERED;
  ctx.lineWidth = borderWidth;
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = COLORS.FILLRED;
  ctx.fill();

  // -- Name --
  ctx.textAlign = `center`
  ctx.font = `600 ${mainBetfontSize}px Arial`
  ctx.fillStyle = "#d6dbb7";
  ctx.fillText('BANKER', banker.X + banker.TW / 2 + banker.R / 2, banker.Y + banker.RH * 0.2);

  // -- Odds --
  ctx.fillStyle = "#ffffff";
  ctx.font = `300 ${mainBetfontSize * 0.75}px Arial`
  ctx.fillText('0.95:1', banker.X + banker.TW / 2 + banker.R / 2, banker.Y + banker.RH * 0.325);


  // -- Cards --

  ctx.fillStyle = "rgba(117, 110, 110, 0.27)";
  ctx.lineWidth = 1 * scale;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.76)";

  ctx.beginPath();
  ctx.roundRect(bankerCardsX, bankerCardsY, bankerCardW, bankerCardH, bankerCardR);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(bankerCardsX - bankerCardW - bankerCardsG, bankerCardsY, bankerCardW, bankerCardH, bankerCardR);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(bankerCardsX - (bankerCardW + bankerCardsG) * 2, bankerCardsY, bankerCardW, bankerCardH, bankerCardR);
  ctx.closePath();
  ctx.stroke();
  
  
 // -- Total Bets --
  ctx.fillStyle = "#d6dbb7";
  ctx.beginPath();
  ctx.arc(banker.X + banker.TW * 0.5 , banker.CY - banker.R * 0.19, 7, Math.PI * 45, 0, false)
  ctx.fill();
  ctx.closePath()
  ctx.beginPath()
  ctx.arc(banker.X + banker.TW * 0.5 ,banker.CY - banker.R * 0.28,4,Math.PI *2,0,false)
  ctx.closePath()
  ctx.fill();
  ctx.textAlign = `start`
  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.fillText('12', banker.X + banker.TW * 0.53, (banker.CY - banker.R * 0.225));


  // Percentage
  ctx.textAlign = "end"
  ctx.fillStyle = "#d6dbb7";
  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.fillText('₱1,233,990', banker.X + banker.TW * 0.5 + banker.R , banker.CY - banker.R * 0.225);


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
  ctx.beginPath();
  ctx.arc(tie.CX, tie.CY, tie.R, angle * 90, angle * 0, false);
  ctx.strokeStyle = COLORS.STROKEGREEN;
  ctx.lineWidth = borderWidth;
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = COLORS.FILLGREEN;
  ctx.fill();


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
  ctx.arc(tie.CX - progressBarW  /2, tie.CY - tie.R * 0.19, 7, Math.PI * 45, 0, false)
  ctx.fill();
  ctx.closePath()
  ctx.beginPath()
  ctx.arc(tie.CX - progressBarW / 2,tie.CY - tie.R * 0.28,4,Math.PI *2,0,false)
  ctx.closePath()
  ctx.fill();
  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.fillText('12', tie.CX - progressBarW  /3, (tie.CY - tie.R * 0.225));

  ctx.font = `600 ${mainBetfontSize * 0.5}px Arial`
  ctx.textAlign = "end"
  ctx.fillText('₱220,330', tie.CX + progressBarW / 2, tie.CY - tie.R * 0.225);

  // Percentage
  ctx.beginPath();
  ctx.fillStyle = "#00000079"
  ctx.roundRect(tie.CX - progressBarW * 0.5, tie.CY - tie.R * 0.15, progressBarW, progressBarH, progressBarR);
  ctx.roundRect(tie.CX - progressBarW * 0.5, tie.CY - tie.R * 0.15, progressBarW, progressBarH, progressBarR);
  ctx.closePath();
  ctx.fill()

  ctx.beginPath();
  ctx.fillStyle =  COLORS.TIEGREEN


  ctx.save();
  ctx.shadowColor = COLORS.NEONGREEN;
  ctx.shadowBlur = 5;
  ctx.roundRect(tie.CX - progressBarW * 0.5, tie.CY - tie.R * 0.15, progressBarW*0.15, progressBarH, progressBarR);
  ctx.fill();

  ctx.restore();


  ctx.textAlign = "center"

  // ────────────────────────────────────────────────────────────────────────────────────────────────
  // SIDEBETS
  // ────────────────────────────────────────────────────────────────────────────────────────────────
  let sideX = GEOMETRY['betOptions'].X + betOptionsGap;
  let sideBets = ['P BONUS', 'P PAIR', 'P BONUS', 'B PAIR']
  sideBets.forEach((side, index) => {
    const sideBet = {
      X: sideX,
      Y: GEOMETRY['betOptions'].Y + GEOMETRY['betOptions'].H * 0.65 + betOptionsGap,
      W: (GEOMETRY['betOptions'].W - betOptionsGap * (sideBets.length + 1)) / sideBets.length,
      H: (GEOMETRY['betOptions'].H * 0.25),
    }
    ctx.strokeStyle = COLORS.STROKESIDE
    ctx.fillStyle = COLORS.FILLSIDE;
    ctx.lineWidth = borderWidth;
    ctx.closePath();
    ctx.beginPath();
    if(index === 0) {
      ctx.moveTo(sideBet.X, sideBet.Y);
      ctx.lineTo(sideBet.X + sideBet.W, sideBet.Y);
      ctx.lineTo(sideBet.X + sideBet.W, sideBet.Y + sideBet.H);
      ctx.arc(sideBet.X + borderRadius, sideBet.Y + sideBet.H - borderRadius, borderRadius, angle * 45, angle * 90, false)
    } else if(index === sideBets.length - 1) {
      ctx.moveTo(sideBet.X, sideBet.Y);
      ctx.lineTo(sideBet.X + sideBet.W, sideBet.Y);
      ctx.arc(sideBet.X + sideBet.W - borderRadius, sideBet.Y + sideBet.H - borderRadius, borderRadius, angle * 0, angle * 45, false)
      ctx.lineTo(sideBet.X, sideBet.Y + sideBet.H);
    } else {
      ctx.moveTo(sideBet.X, sideBet.Y);
      ctx.lineTo(sideBet.X + sideBet.W, sideBet.Y);
      ctx.lineTo(sideBet.X + sideBet.W, sideBet.Y + sideBet.H);
      ctx.lineTo(sideBet.X, sideBet.Y + sideBet.H);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // -- Name --
    ctx.fillStyle = "#d6dbb7";
    ctx.font = `600 ${sideBetfontSize}px Arial`
    ctx.fillText(side, sideBet.X + sideBet.W * 0.5, sideBet.Y + sideBet.H * 0.40);

    // -- Odds --
    ctx.fillStyle = "#ffffff";
    ctx.font = `300 ${sideBetfontSize*0.85}px Arial`
    ctx.fillText('04:20', sideBet.X + sideBet.W *0.5, sideBet.Y + sideBet.H * 0.70);
    
 

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
    gameNo: {bg: null, hasIcon: false, value: 42},
    playerTotal: {bg: COLORS.PLAYERBLUE, hasIcon: true, value: 22},
    bankerTotal: {bg: COLORS.BANKERRED, hasIcon: true, value: 16},
    tieTotal: { bg: COLORS.TIEGREEN, hasIcon: true, value:4},
    playerPairTotal: {bg: COLORS.PLAYERBLUE, hasIcon: true, value:3},
    bankerPairTotal: { bg: COLORS.BANKERRED, hasIcon: true, value:3},
    playerPrediction: {bg: COLORS.PLAYERBLUE, hasIcon: true, value:3},
    bankerPrediction: { bg: COLORS.BANKERRED, hasIcon: true, value:3},
  }
  const cols = Object.keys(stats).length;


  let startX = summary.X + tileSize;
  const radius = summary.H * 0.2;
  for(const [key,obj] of Object.entries(stats)) {
    let spaceToNext = radius * 4.5
    ctx.font = `300 ${getFontSize(summary.W * 0.5, summary.H * 0.25)}px Arial`
    ctx.fillStyle = "#fff"
    ctx.textAlign ="center";
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


      if (['playerTotal' ,'bankerTotal', 'tieTotal'].includes(key)) {
        ctx.fillText(key.toUpperCase()[0], startX, summary.Y + summary.H * 0.525)
        ctx.fillText(obj.value,startX + radius * 2, summary.Y + summary.H * 0.525)
      }

      else if (['playerPairTotal','bankerPairTotal',].includes(key)) {
        ctx.fillText(obj.value,startX + radius * 2, summary.Y + summary.H * 0.525)
      }

     
    }


    // -- Game Number --
    else if (['gameNo'].includes(key)) {
      ctx.font = `600 ${clamp(summary.W / cols * 0.75, 15, radius * 1.5) }px Arial`;
      ctx.fillText(`#${obj.value}`, startX + radius * 2, summary.Y + summary.H * 0.5)
      spaceToNext = radius * 2 + 35
    }
    // -- Prediction --
    else if (['playerPrediction','bankerPrediction'].includes(key)) {
      const predictionWidth = clamp(100, summary.W * 0.1, 120);
      const predictionRadius = clamp(12, predictionWidth/4, radius * 0.65); 
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
      ctx.fillText(`${key.toUpperCase()[0]}`, startX + predictionWidth *0.15, summary.Y + summary.H * 0.52);

      ctx.beginPath();
      ctx.arc(startX + predictionWidth * 0.35, summary.Y + summary.H * 0.5, predictionRadius, 0, Math.PI * 90, false)
      ctx.strokeStyle = key === 'playerPrediction' ? COLORS.STROKEBLUE: COLORS.STROKERED;
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




  // --- SCROLLABLE START -********************************************************************************
  const populateBeadRoad = (grid) => {
    const { rows, cols, posX, posY, gridHeight, cellW, cellH, totalWidth } = grid

    
    results.forEach((result,index)=> {
      const col = Math.floor(index / rows); // vertical fill
      const row = index % rows;

      const x = posX + col * cellW;
      const y = posY + row * cellH;

      const cellCX = x + cellW / 2;
      const cellCY = y + cellH / 2;
      const cellR = cellW * 0.45;


      const bg = result.value === "P"? COLORS.PLAYERBLUE
      :result.value === "B"? COLORS.BANKERRED
      :COLORS.TIEGREEN

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
  const populateBigRoad = (grid) => {0.5
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
        col+=0.5;
        row = 6;
      }

      if (col >= cols || row >= rows) return;

      const x = posX + col * cellW;
      const y = posY + row * cellH;
      const cellCX = x + cellW *0.25;
      const cellCY = y + cellH *0.25;
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
      row+=0.5;
    });
  }
  const populateSmallEye = (grid) => {
    const { rows, cols, posX, posY, cellW, cellH } = grid;

    let col = 7;
    let row = 6;
    let prevValue = null;

    results.forEach((result) => {
      if (prevValue !== null && result.value !== prevValue) {
        col+=0.5;
        row = 6;
      }

      if (col >= cols || row >= rows) return;

      const x = posX + col * cellW;
      const y = posY + row * cellH;
      const cellCX = x + cellW *0.25;
      const cellCY = y + cellH *0.25;
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
      row+=0.5;
    });
  }
  const populateCockroach = (grid) => {
    const { rows, cols, posX, posY, cellW, cellH } = grid;

    let col = 14;
    let row = 6;
    let prevValue = null;

    results.forEach((result) => {
      if (prevValue !== null && result.value !== prevValue) {
        col+=0.5;
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
      ctx.lineTo(cellW*0.5, 0);
      ctx.stroke();

      ctx.restore(); // restore original state

   

      prevValue = result.value;
      row+=0.5;
    });
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(scoreBoard.X, scoreBoard.Y, containerWidth, scoreBoard.H);
  ctx.clip();
  ctx.translate(-scrollX, 0);


  const gridA = constructGrid(9, 21, scoreBoard.X, scoreBoard.Y, scoreBoard.H ,1,3,6);
  const gridE = constructGrid(6, 54, scoreBoard.X + gridA.totalWidth, scoreBoard.Y, scoreBoard.H);
 

  populateBigRoad(gridA)
  populateBigEye(gridA)
  populateSmallEye(gridA)
  populateCockroach(gridA)
  populateBeadRoad(gridE)
  

  maxScrollX = (gridA.totalWidth + gridE.totalWidth)/5;


  ctx.restore();
  // --- SCROLLABLE END ********************************************************************************


  
}

const drawMenuBar = (GEOMETRY) => {

  ctx.setLineDash([])

  // --- Main ---
  const main = {
    X: GEOMETRY['menuBar'].X,
    Y: GEOMETRY['menuBar'].Y,
    W: GEOMETRY['menuBar'].W ,
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
  const angle = Math.PI /90;
  const radius = main.H * 0.40;
  const diameter = radius * 2;

  ctx.arc(main.X + main.W * 0.10 , main.Y + radius + 10, radius, -angle * 45, angle * 0, false)
  ctx.arc(main.X + main.W * 0.10 + diameter, main.Y + radius, radius, angle * 87, angle * 45, true)
  ctx.arc(main.X + main.W * 0.90 - diameter, main.Y + radius, radius, angle * 45, angle * 3, true)
  ctx.arc(main.X + main.W * 0.90, main.Y + radius + 10, radius, -angle * 90, -angle * 45, false)
  ctx.lineTo(main.X + main.W, main.Y + 10)
  ctx.lineTo(main.X + main.W, main.Y +main.H)

  ctx.strokeStyle = "#1f1f1f"
  ctx.lineWidth = 1.75 * scale;
  ctx.stroke();

  ctx.lineTo(main.X, main.Y +main.H)
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
  ctx.font = `30 ${clamp(10, chatButton.W * 0.5, 18)}px Arial`
  ctx.fillStyle = "#ffffff5d"
  ctx.fillText("Chat", chatButton.X + chatButton.W * 0.5, chatButton.Y + chatButton.H + 28)


  // -- Lobby Button
  const lobbyButton = {
    X: main.X + main.W - (main.H * 0.3) - radius * 0.75,
    Y: main.Y + radius * 0.75,
    H: main.H * 0.2,
    W: main.H * 0.3,
    R: 5,
  }

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
    W: chipsController.W /3,
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
    Math.PI /2,            // end (right)
    false         // clockwise
  );
  ctx.lineTo(undoButton.X + undoButton.W * 0.5 - undoButton.R, undoButton.Y + undoButton.H * 0.50+ undoButton.R );

  ctx.moveTo(undoButton.X + undoButton.W * 0.5 - undoButton.R + 5, undoButton.Y + undoButton.H * 0.30)
  ctx.lineTo(undoButton.X + undoButton.W * 0.5 - undoButton.R - 2, undoButton.Y + undoButton.H * 0.38)

  ctx.lineTo(undoButton.X + undoButton.W * 0.5 - undoButton.R + 5, undoButton.Y + undoButton.H * 0.45)
  // ctx.lineTo(undoButton.X + 5, undoButton.Y + undoButton.H * 0.25 -7)

  ctx.strokeStyle = "#ffffff6c"
  ctx.lineWidth = 2 * scale
  ctx.stroke();
  
  const mainCX = main.X + main.W * 0.5
  const iconWidth = main.H * 0.25

  // --- Rebet Button
  const rebetButton = {
    X: chipsController.X + (chipsController.W /3) * 2,
    Y: chipsController.Y,
    W: chipsController.W / 3,
    H: chipsController.H,
    CX: chipsController.X + chipsController /2,
    CY: chipsController.H /2,
    R: chipsController.H * 0.125
  }

  
  ctx.beginPath();


   ctx.arc(
    rebetButton.X + rebetButton.W / 2,
    rebetButton.Y + rebetButton.H * 0.5,
    rebetButton.H * 0.15,
    Math.PI * 0, // start (top)
    Math.PI *1.6,            // end (right)
    false         // clockwise
  );

  ctx.moveTo(rebetButton.X + rebetButton.W * 0.5, rebetButton.Y + rebetButton.H * 0.3 )
  ctx.lineTo(rebetButton.X + rebetButton.W * 0.5 + 5, rebetButton.Y + rebetButton.H * 0.35)
  ctx.lineTo(rebetButton.X + rebetButton.W * 0.5, rebetButton.Y + rebetButton.H * 0.4 )

  ctx.strokeStyle = "#ffffff6c"
  ctx.lineWidth = 2 * scale
  ctx.stroke();


  // --- Chip Button
  const chipButton = {
    X: chipsController.X + (chipsController.W /3),
    Y: chipsController.Y,
    W: chipsController.W / 3,
    H: chipsController.H,
    CX: chipsController.X + chipsController /2,
    CY: chipsController.H /2,
    R: chipsController.H * 0.125
  }

  const chipCX = chipButton.X + chipButton.W / 2;
  const chipCY = chipButton.Y + chipButton.H * 0.5;
  const chipR = chipButton.H * 0.38;

  // Outer body
  ctx.beginPath();
  ctx.arc(chipCX, chipCY, chipR, 0, Math.PI * 2);
  ctx.fillStyle = "#9da010";
  ctx.fill();
  ctx.strokeStyle = "#e8c84a";
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

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
  ctx.strokeStyle = "#e8c84a";
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Label
  const chipFontSize = clamp(10, chipR * 0.58, 40);
  ctx.font = `700 ${chipFontSize}px Arial`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("5K", chipCX, chipCY);


  

  // --- Wallet ---
  const wallet = {
    X: GEOMETRY['menuBar'].X,
    Y: GEOMETRY['menuBar'].Y + main.H,
    W: GEOMETRY['menuBar'].W,
    H: GEOMETRY['menuBar'].H * 0.5,
  }

  ctx.fillStyle = COLORS.FILLBLUE
  // ctx.fillRect(wallet.X, wallet.Y, wallet.W, wallet.H)


  ctx.fillStyle="#818181";
  ctx.textAlign = "start";
  ctx.font = `100 ${clamp(10, wallet.H * 0.15, tileSize)}px Arial`
  ctx.fillText("Speed Bacarrat ₱50-10,000",wallet.X + tileSize, wallet.Y);

  const timeText = "04:20:34";
  const timeTextW= ctx.measureText(timeText).width;
  ctx.textAlign = "end";
  ctx.fillText(timeText,wallet.X + wallet.W - tileSize, wallet.Y);
  

  ctx.strokeStyle ="#ffffff";
  ctx.beginPath()
  ctx.moveTo(wallet.X + tileSize , wallet.Y + wallet.H * 0.125);
  ctx.lineTo(wallet.X + tileSize * 2 , wallet.Y + wallet.H * 0.125);
  ctx.stroke();

  ctx.beginPath()
  ctx.roundRect(wallet.X + tileSize , wallet.Y + wallet.H * 0.15, tileSize*1.225, wallet.H * 0.17, 2);
  ctx.lineWidth = 1 * scale
  ctx.stroke();

  ctx.beginPath()
  ctx.arc(
    wallet.X + tileSize*1.7,
    wallet.Y + wallet.H * 0.225,
    2,
    0,
    Math.PI * 2,
    false
  )
  ctx.fillStyle ="#ffffff";
  ctx.fill();
  

  ctx.fillStyle="#ffffff";
  ctx.textAlign = "start";
  ctx.font = `100 ${clamp(10, wallet.H * 0.225, tileSize)}px Arial`
  ctx.fillText("₱510,000", wallet.X + tileSize * 2.5, wallet.Y + wallet.H * 0.225);


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
  const text = "435,324.34";
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
  ctx.arc(iconX + iconSize / 2, stackY + tileSize *0.75, iconSize / 2, -Math.PI * 0.8, -Math.PI * 0.2, false);
  ctx.lineWidth = 1 * scale
  ctx.stroke();
  for(let y=0; y<3;y++) {
    // draw icon (example: circle avatar)
    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, stackY, iconSize / 2, Math.PI * 0.2, Math.PI * 0.8, false);
    ctx.stroke();
    stackY+=5
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


  tileSize = Math.min(canvas.width, canvas.height) / 32 ;
  
  const isMobile = canvas.width <=580;
  const spacing = 10;
  const buttonGap = spacing / 2;

  containerAvailableWidth = canvas.width;
  containerMaxWidth =580 * scale;
  containerWidth = isMobile ? containerAvailableWidth   // full width on phone
    : Math.min(containerAvailableWidth, containerMaxWidth);
  leftGutter = (canvas.width - containerWidth) / 2;


  scrollX = 0;
  maxScrollX = containerWidth; // depends on your content width
}


const loop = () => {
  // --- Clear ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawLayout();
  drawUI();
  requestAnimationFrame(loop)
};


resize();
loop();


// -- Event Listeners --
window.addEventListener('resize', resize);


canvas.addEventListener("touchstart", (e) => {
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