class StatusBar {
  constructor(value, x, y, w, h, bg) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // this.bg = bg ?? "#414be2"
    this.bg = bg
  }
  // 🔥 detect click inside rect
  isInside(mx, my) {
    return mx >= this.x &&
      mx <= this.x + this.w &&
      my >= this.y &&
      my <= this.y + this.h;
  }
  setStatus(value, bg) {
    this.value = value;
    this.bg = bg;
  }
  draw(ctx) {

    ctx.fillStyle = this.bg ?? "#106650";
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.strokeStyle = "rgb(199, 196, 196)";
    ctx.lineWidth = 0.1;
    ctx.setLineDash([]);
    // ctx.strokeRect(this.x, this.y, this.w, this.h);


    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(14, getFontSize(this.w, this.h))}px Trebuchet MS`;

    ctx.fillStyle = colors.WHITE;
    ctx.fillText(this.value, this.x + this.w / 2, this.y + this.h / 2);
  }
}

class Chip {
  constructor(value, x, y, size, bg) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.size = size;

    this.isHovered = false;
    this.isActive = false;
    this.bg = bg ?? null;
  }
  get radius() {
    return this.size / 2; // ✅ single source of truth
  }

  // 🔥 detect click inside circle
  isInside(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  draw(ctx) {
    const radius = this.radius;

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    
    ctx.fillStyle = this.bg ?? "rgb(255, 255, 255)";
    // ctx.fill();
    ctx.strokeStyle = "rgb(255, 255, 255)";
    // 🎨 visual states

    if (this.isActive) {
      ctx.fillStyle = colors.ACTIVEBG;
      ctx.fill();
    }

    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 0.1;

    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(14, this.size / 2.5)}px Trebuchet MS`;

    const formatter = new Intl.NumberFormat('en', {
      notation: 'compact'
    });

    let formattedValue = this.value > 900 ? formatter.format(this.value) : this.value.toString();
    ctx.fillStyle = colors.WHITE;
    ctx.fillText(formattedValue, this.x, this.y);
  }
}
class QuickButton {
  constructor(value, symbol, x, y, size, bg) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.size = size;
    this.symbol = symbol ?? '☺︎'
    this.isHovered = false;
    this.isActive = false;
    this.bg = bg;
  }
  // 🔥 detect click inside rect
  isInside(mx, my) {
    return mx >= this.x &&
      mx <= this.x + this.size &&
      my >= this.y &&
      my <= this.y + this.size;
  }
  draw(ctx) {


    ctx.fillStyle = this.bg;
    ctx.strokeStyle = "rgb(255, 255, 255)";
    // ctx.fillRect(this.x, this.y, this.size, this.size);

    if (this.isActive) {
      ctx.fillStyle = colors.ACTIVEBG;
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    ctx.lineWidth = 0.1;
    ctx.setLineDash([]);
    ctx.strokeRect(this.x, this.y, this.size, this.size);


    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(14, this.size / 2)}px Trebuchet MS`;

    ctx.fillStyle = this.isHovered
      ? "rgba(255, 255, 255, 0.75)"
      : "rgba(255, 255, 255, 0.45)";

    ctx.fillText(this.symbol, this.x + this.size / 2, this.y + this.size / 2);
  }
}


//===========================
//  SETUP CANVAS
//===========================

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const scale = 1;
let hovered = null;
let clicked = null;

const colors = {
  ACTIVEBG: "rgba(15, 14, 14,0.5)",
  NEONRED: "rgb(241, 48, 48)",
  NEONBLUE: "rgb(88, 70, 252)",
  BLUE: "rgba(46, 34, 156, 0.5)",
  RED: " rgba(105, 14, 14, 0.5)",
  GREEN: " rgba(30, 97, 33, 0.5)",
  HOVERBLUE: "rgba(46, 34, 156, 0.53)",
  HOVERRED: " rgb(105, 14, 14)",
  HOVERGREEN: " rgb(30, 97, 33)",
  ACTIVEBLUE: "rgb(76, 57, 252)",
  ACTIVERED: " rgba(197, 54, 54, 1)",
  ACTIVEGREEN: " rgb(59, 161, 65)",
  WHITE: " rgba(255, 255, 255, 1)",
  TRANSPARENT: " rgba(255, 255, 255, 0)",
}


//=================================================================================
//  COMPONENTS
//=================================================================================
const buttons = [];
const chips = [];
const quicktools = [];
let statusBar = null;

//======================================
//  DRAW CONTAINER
//======================================
const layoutPadding = 0;
const layoutGap = 0;
let containerAvailableWidth = 0;
let containerMaxWidth = 980;
let containerWidth = containerMaxWidth;
//======================================
//  ROOT LAYOUT RATIO
//======================================
let videoW = 0;
let videoH = 0;

let hudY = 0;
let hudH = 0;
//======================================
//  HUD LAYOUT RATIO
//======================================
let topRatio = 0;
let bottomRatio = 0;

let topH = 0;
let bottomH = 0;
//=================================================================================
// UTILITIES
//=================================================================================
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const vw = window.visualViewport?.width || window.innerWidth;
  const vh = window.visualViewport?.height || window.innerHeight;

  canvas.width = vw * dpr;
  canvas.height = vh * dpr;

  canvas.style.width = vw + "px";
  canvas.style.height = vh + "px";

  // ctx.setTransform(1, 0, 0, 1, 0, 0);
  // ctx.scale(dpr, dpr);

  //=========================================
  //  MOBILE BREAKPOINT
  //=========================================
  const isMobile = canvas.width <= 980;

  const spacing = 10;
  const buttonGap = spacing / 2;

  containerAvailableWidth = canvas.width - layoutPadding * 2;
  containerMaxWidth = 980;
  containerWidth = isMobile ? containerAvailableWidth   // full width on phone
    : Math.min(containerAvailableWidth, containerMaxWidth);

  videoW = containerWidth;
  videoH = videoW * 9 / 16;

  hudY = videoH + layoutGap * 2;
  hudH = canvas.height - hudY - layoutPadding;

  topRatio = 0.7;   // 40%
  bottomRatio = 0.3; // 60%

  topH = hudH * topRatio - layoutGap / 1;
  bottomH = hudH * bottomRatio - layoutGap / 2;

}

function getFontSize(width, height) {
  const base = Math.min(width, height);

  // safe scaling factor (tune this)
  return Math.max(15, Math.floor(base * 0.20));
}
function buildStatusBar() {
  let statusBarContainer= {
    x: (canvas.width - containerWidth) / 2 ,
    y: hudY,
    w: containerWidth,
    h: topH * 0.1,
  };

  statusBar = new StatusBar(
    'PLACE YOUR BET',
    statusBarContainer.x,
    statusBarContainer.y,
    statusBarContainer.w,
    statusBarContainer.h
  );
}

function buildButtons(components) {
  buttons.length = 0;
  for (const [key, obj] of Object.entries(components)) {
    if (obj.isButton) {
      buttons.push({
        id: key,
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
        bg: obj.bg,
        hoverBg: obj.hoverBg,
        activeBg: obj.activeBg,
      });
    }
  }
}
function buildChipController() {
  const chipsContainer =
  {
    id: "chips",
    x: (canvas.width - containerWidth) / 2,
    y: hudY + topH + layoutGap,
    w: containerWidth,
    h: bottomH / 2,
  }
  const items = [
    { type: "chip", value: 100, bg: "rgb(110, 124, 136)" },
    { type: "chip", value: 200, bg: "rgb(53, 119, 189)" },
    { type: "chip", value: 500, bg: "rgb(28, 167, 60)" },
    { type: "chip", value: 1000, bg: "rgb(206, 160, 22)" },
    { type: "chip", value: 2000, bg: "rgb(90, 151, 21)" },
    { type: "chip", value: 5000, bg: "rgb(204, 46, 62)" },

    { type: "tool", value: "undo", bg: "rgba(85, 85, 85, 1)" },
    { type: "tool", value: "rebet", bg: "rgba(85, 85, 85, 1)" },
    { type: "tool", value: "cancel", bg: "rgba(85, 85, 85, 1)" },
  ];

  const count = items.length;

  const chipG = -30;
  // 1. max size that fits WIDTH
  const radiusByWidth = (chipsContainer.w - (count - 1) * chipG) / (2 * count);

  // 2. max size that fits HEIGHT
  const radiusByHeight = chipsContainer.h / 1.5;

  // 3. final radius (must satisfy both)
  const chipR = Math.min(radiusByWidth, radiusByHeight);
  const chipD = chipR * 2;

  // total width of all chips
  const chipTotalW = count * chipD + (count - 1) * chipG;

  // ✅ correct starting X (left edge of centered group)
  let startX =
    chipsContainer.x + (chipsContainer.w - chipTotalW) / 2;

  // ✅ vertical center inside container
  const centerY = chipsContainer.y + chipsContainer.h / 2;

  chips.length = 0;
  quicktools.length = 0;
  items.forEach((item, index) => {
    const centerX = startX + chipR;

    if (item.type === "chip") {
      const chip = new Chip(item.value, centerX, centerY, chipR, item.bg);
      chips.push(chip);
    }

    if (item.type === "tool") {
      
      const symbol =
        item.value === "undo" ? "↺" :
          item.value === "rebet" ? "↻" :
            "×";

      const btn = new QuickButton(
        item.value,
        symbol,
        centerX - chipR /2,   // ✅ center → top-left ONLY
        centerY - chipR /2,   // ✅ same vertical alignment
        chipR,              // ✅ use diameter, not radius
        item.bg
      );

      quicktools.push(btn);
    }

    startX += chipD + chipG + (index === 5? 8 : 0);
  });
}



//======================================================
// VIDEO
//======================================================
const video = document.createElement("video");
function initVideo() {

  video.src = "https://www.w3schools.com/tags/movie.mp4";
  video.autoplay = true;
  video.loop = true;
  video.muted = true; // REQUIRED for autoplay on mobile
  video.playsInline = true; // IMPORTANT for iOS Safari

  video.play();
}


function drawVideo(ctx, video, x, y, w, h) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  const scale = Math.min(w / vw, h / vh);

  const dw = vw * scale;
  const dh = vh * scale;

  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;

  ctx.drawImage(video, dx, dy, dw, dh);
}

function drawUI() {

  //=================================================================================
  //  CARDS - VARIABLES
  //=================================================================================
  const gap = 2;
  const aspect = 9/ 14;
  // max allowed space
  const maxCardHeight = topH * 0.25 - 21;
  const maxCardWidth = containerWidth / 8; // adjust depending on how tight you want components

  // derive safe height from width constraint
  const widthBasedHeight = maxCardWidth / aspect;

  // pick the smaller so it always fits screen
  const cardHeight = Math.min(maxCardHeight, widthBasedHeight);
  const cardWidth = cardHeight * aspect;

  // 3 cards per group
  const groupWidth = (cardWidth * 2) + cardHeight + (gap * 4);
  const resultBarY = hudY + topH * 0.1;
  const resultBarH = topH * 0.25;
  const betRow1Y = hudY + topH * 0.35;
  const betRow1H = topH * 0.35;
  const cardStartY = resultBarY + (resultBarH - cardHeight) / 2;

  // center reference
  const midX = canvas.width / 2;

  // start positions (left group ends at center gap)

  const centerGap = 10;
  const leftStartX = midX - centerGap / 2 - groupWidth;


  const p1x = leftStartX + (cardWidth) + (gap * 2);
  const p2x = leftStartX + (cardWidth * 2) + (gap * 4);
  const p3x = leftStartX

  const mirror = (x) => midX + (midX - (x + cardWidth));

  const b1x = mirror(p1x);
  const b2x = mirror(p2x);
  const b3x = mirror(p3x);


  const components = {
    video: {
      x: (canvas.width - containerWidth) / 2,
      y: layoutPadding,
      w: videoW,
      h: videoH,
      bg: "rgba(0, 0, 0, 1)",
      isVideo: true
    },

    // topBar: {
    //   x: (canvas.width - containerWidth) / 2 ,
    //   y: hudY,
    //   w: containerWidth,
    //   h: topH
    // },

    // statusBar: {
    //   x: (canvas.width - containerWidth) / 2 ,
    //   y: hudY,
    //   w: containerWidth,
    //   h: topH * 0.1,
    //   bg: "rgba(212, 191, 191, 0.97)"
    // },

    // "resultBar": { //resultBar
    //   id: "result bar",
    //   x: (canvas.width - containerWidth) / 2 ,
    //   y: hudY + topH * 0.1,
    //   w: containerWidth,
    //   h: resultBarH,
    //   bg: "rgb(63, 52, 52)"
    // },

    //=============================================
    // CARDS
    //=============================================
    "p": {
      x: midX - 22,
      y: cardStartY + cardHeight / 2.5,
      // x: p1x,
      // y: cardStartY - 20,
      w: 12,
      h: 12,
      bg: colors.TRANSPARENT,
      c: colors.NEONBLUE,
      fontWeight: '900',
      fontSize: getFontSize(containerWidth, resultBarH-40),
    },
    "b": {
      x: midX + 12,
      y: cardStartY + cardHeight / 2.5,
      // x: p1x,
      // y: cardStartY - 20,
      w: 12,
      h: 12,
      bg: colors.TRANSPARENT,
      c: colors.NEONRED,
      fontWeight: '900',
      fontSize: getFontSize(containerWidth, resultBarH - 40),
    },
    "p1": {
      x: p1x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      // bg: colors.WHITE,
      border: "rgb(255, 255, 255)",
    },
    "p2": {
      x: p2x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      // bg: colors.WHITE,
      border: "rgb(255, 255, 255)",
    },
    "p3": {
      x: p3x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      border: "rgb(255, 255, 255)",
      // rotate: true
    },
    "b1": {
      x: b1x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      // bg: colors.WHITE,
      border: "rgb(255, 255, 255)",
    },
    "b2": {
      x: b2x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      // bg: colors.WHITE,
      border: "rgb(255, 255, 255)",
    },
    "b3": {
      x: b3x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      border: "rgb(255, 255, 255)",
      // rotate: true,
      mirror: true
    },


    // placeBets: {
    //   x: (canvas.width - containerWidth) / 2 ,
    //   y: hudY + topH * 0.4,
    //   w: containerWidth,
    //   h: topH * 0.6,
    // },

    //=============================================
    // PLACE BET
    //=============================================
    "player": {
      id: "player",
      x: (canvas.width - containerWidth) / 2,
      y: betRow1Y,
      w: containerWidth * 0.3332,
      h: betRow1H,
      // bg: colors.BLUE,
      hoverBg: colors.HOVERBLUE,
      activeBg: colors.ACTIVEBLUE,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "tie": {
      id: "tie",
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332),
      y: betRow1Y,
      w: containerWidth * 0.3332,
      h: betRow1H,
      // bg: colors.GREEN,
      hoverBg: colors.HOVERGREEN,
      activeBg: colors.ACTIVEGREEN,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "banker": {
      id: "banker",
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332) * 2,
      y: betRow1Y,
      w: containerWidth * 0.3332,
      h: betRow1H,
      // bg: colors.RED,
      hoverBg: colors.HOVERRED,
      activeBg: colors.ACTIVERED,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "p pair": {
      id: "p pair",
      x: (canvas.width - containerWidth) / 2,
      y: hudY + topH * 0.7,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      // bg: colors.BLUE,
      hoverBg: colors.HOVERBLUE,
      activeBg: colors.ACTIVEBLUE,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "perfect pair": {
      id: "perfect pair",
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332),
      y: hudY + topH * 0.7,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      // bg: colors.GREEN,
      hoverBg: colors.HOVERGREEN,
      activeBg: colors.ACTIVEGREEN,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "b pair": {
      id: "b pair",
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332) * 2,
      y: hudY + topH * 0.7,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      // bg: colors.RED,
      hoverBg: colors.HOVERRED,
      activeBg: colors.ACTIVERED,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "p bonus": {
      id: "p bonus",
      x: (canvas.width - containerWidth) / 2,
      y: hudY + topH * 0.85,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      // bg: colors.BLUE,
      hoverBg: colors.HOVERBLUE,
      activeBg: colors.ACTIVEBLUE,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "either pair": {
      id: "either pair",
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332),
      y: hudY + topH * 0.85,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      // bg: colors.GREEN,
      hoverBg: colors.HOVERGREEN,
      activeBg: colors.ACTIVEGREEN,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "b bonus": {
      id: "b bonus",
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332) * 2,
      y: hudY + topH * 0.85,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      // bg: colors.RED,
      hoverBg: colors.HOVERRED,
      activeBg: colors.ACTIVERED,
      border: "rgb(255, 255, 255)",
      isButton: true
    },

    // "bottom bar": {
    //   id: "bottom bar",
    //   x: (canvas.width - containerWidth) / 2,
    //   y: hudY + topH + layoutGap,
    //   w: containerWidth ,
    //   h: bottomH,
    //   bg: "rgba(255,255,255,0.3)",
    // },
    //=============================================
    // CHIPS CONTAINER
    //=============================================
    "": {
      id: "chips_container",
      x: (canvas.width - containerWidth) / 2,
      y: hudY + topH + layoutGap,
      w: containerWidth ,
      h: bottomH / 2,
      border: "rgb(255, 255, 255)",
      bg: "rgba(255,255,255,0.3)",
    },
    //=============================================
    // chiptools CONTAINER
    //=============================================
    // "chiptools_container": {
    //   id: "chiptools_container",
    //   x: (canvas.width - containerWidth) / 2,
    //   y: hudY + topH + layoutGap + bottomH / 2,
    //   w: containerWidth ,
    //   h: bottomH / 2,
    //   border: "rgb(255, 255, 255)",
    //   bg: "rgba(255,255,255,0.3)",
    // },

  };



  buildButtons(components);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //=================================================================================
  //  CHIPS CONTROLLER
  //=================================================================================
  statusBar.draw(ctx)
  //=================================================================================
  //  CHIPS CONTROLLER
  //=================================================================================
  chips.forEach(chip => chip.draw(ctx));
  quicktools.forEach(chip => chip.draw(ctx));

  //=================================================================================
  //  VIDEO
  //=================================================================================

  const v = components.video;

  if (video.readyState >= 2) {
    ctx.fillStyle = "rgba(15, 15, 15, 0.39)";
    ctx.fillRect(v.x, v.y, v.w, v.h);
    drawVideo(ctx, video, v.x, v.y, v.w, v.h);
  }

  for (const [index, obj] of Object.entries(components)) {
    //=====================================================
    // BORDER
    //=====================================================
    if(obj.border) {
      ctx.lineWidth = 0.1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.33)"
      ctx.strokeStyle =  obj.border;
      ctx.setLineDash([5, 5]); // 5px line, 5px gap
      ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
    }
    else {
      ctx.setLineDash([]); // reset
    }

    //===================================
    // FONT WEIGHT
    //===================================
    let fontWeight = obj.fontWeight ?? '100'


    //===================================
    // BUTTON STATE
    //===================================
    let bg = obj.bg ?? "rgb(19, 17, 17)";
    const isClicked = index === clicked;
    const isHovered = index === hovered;

    if (isClicked) {
      bg = colors.ACTIVEBG;
      ctx.fillStyle = bg ;
      ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
    } else if (isHovered) {

    }

    if(obj.bg) {
      // ctx.fillStyle = bg;
      // ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
    }

    ctx.fillStyle = obj.c ?? (isHovered ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.45)");
    ctx.font = `${fontWeight} ${obj.fontSize ?? getFontSize(obj.w, obj.h) }px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      index.toUpperCase(),
      obj.x + obj.w / 2,
      obj.y + obj.h / 2
    );

  }

}




//===========================================================================/
// EVENT LISTENERS
//===========================================================================/
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();

  const mX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const mY = (e.clientY - rect.top) * (canvas.height / rect.height);

  let isHovering = false;

  // =========================
  // CHIPS
  // =========================
  chips.forEach(c => c.isHovered = false);

  const chipHovered = chips.find(chip => chip.isInside(mX, mY));
  if(chipHovered) {
    chipHovered.isHovered = true;
    isHovering = true;
  }
  // =========================
  // QUICK TOOLS
  // =========================
  quicktools.forEach(b => b.isHovered = false);
  const toolHovered = quicktools.find(tool => tool.isInside(mX, mY));
  if (toolHovered) {
    toolHovered.isHovered = true;
    isHovering = true;
  }

  // =========================
  // BUTTONS
  // =========================


  // const placeBetFound = buttons.find(btn =>
  //   mX >= btn.x &&
  //   mX <= btn.x + btn.w &&
  //   mY >= btn.y &&
  //   mY <= btn.y + btn.h
  // );

  // hovered = null;

  // if (placeBetFound) {
  //   hovered = placeBetFound.id;
  //   isHovering = true;
  // }

  canvas.style.cursor = isHovering ? "pointer" : "default";
});
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();

  const mX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const mY = (e.clientY - rect.top) * (canvas.height / rect.height);

  //=========================
  // CHIPS (circle hit test)
  //=========================
  const chipFound = chips.find(chip => chip.isInside(mX, mY));

  if (chipFound) {
    chipFound.isActive = !chipFound.isActive;
    console.log(
      "%c$ " + chipFound.value,
      "background-color: #222; color: #ac9b02; padding: 0.5rem 1rem;"
    );

    statusBar.setStatus(`You pressed $${chipFound.value}`)
    return;
  }
  const toolFound = quicktools.find(tool => tool.isInside(mX, mY));

  if (toolFound) {
    toolFound.isActive = !toolFound.isActive;
    console.log(
      "%c" + toolFound.value,
      "background-color: #222; color: #ffffff; padding: 0.5rem 1rem;"
    );
    statusBar.setStatus(`You pressed ${toolFound.value.toUpperCase()}`)
    return;
  }

  //=========================
  // BUTTONS (rect hit test)
  //=========================
  const found = buttons.find(btn =>
    mX >= btn.x &&
    mX <= btn.x + btn.w &&
    mY >= btn.y &&
    mY <= btn.y + btn.h
  );

  if (found) {
    clicked = found.id;
    console.log(
      "%c" + found.activeBg,
      `background-color: ${found.activeBg}; padding: 0.5rem 1rem`
    );
    statusBar.setStatus(`${found.id.toUpperCase()}`, found.activeBg)
  }
});
canvas.addEventListener("pointerup", (e) => {
  clicked = null;
  chips.forEach(chip =>  chip.isActive = false);
  quicktools.forEach(tool =>  tool.isActive = false);
});



//===========================================================================/
// STARTING POINT
//===========================================================================/
function loop() {
  drawUI();
  requestAnimationFrame(loop);
}

initVideo();

resize();
buildChipController();
buildStatusBar();


window.addEventListener("resize", () => {
  resize();
  buildChipController();
  buildStatusBar();
});

loop();