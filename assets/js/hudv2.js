//===========================
//  SETUP CANVAS
//===========================

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const dpr = window.devicePixelRatio || 1;
const scale = 1;

function resize() {
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;

  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';

  
}

function getFontSize(width, height) {
  const base = Math.min(width, height);

  // safe scaling factor (tune this)
  return Math.max(15, Math.floor(base * 0.20));
}

function drawLayout() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = `rgb(32, 32, 32)`

  const spacing = 10 ;
  const buttonGap = spacing / 2;
  //===========================
  //  HUD HEADER
  //===========================
  const layoutPadding =0;
  const layoutGap =0;

  const containerAvailableWidth = canvas.width - layoutPadding * 2;
  const containerMaxWidth = 1000;

  const containerWidth = Math.min(containerAvailableWidth, containerMaxWidth);

  const videoWidth = containerWidth;
  const videoHeight = videoWidth * 9 / 16;

  const hudY = videoHeight + layoutGap * 2;
  const hudHeight = canvas.height - hudY - layoutPadding;

  const topRatio = 0.7;   // 40%
  const bottomRatio = 0.3; // 60%

  const topH = hudHeight * topRatio - layoutGap / 2;
  const bottomH = hudHeight * bottomRatio - layoutGap / 2;


  const gap = 5;
  const aspect = 9 / 16;

  // max allowed space
  const maxCardHeight = topH * 0.28 - 20;
  const maxCardWidth = containerWidth / 12; // adjust depending on how tight you want layout

  // derive safe height from width constraint
  const widthBasedHeight = maxCardWidth / aspect;

  // pick the smaller so it always fits screen
  const cardHeight = Math.min(maxCardHeight, widthBasedHeight);
  const cardWidth = cardHeight * aspect;

  // 3 cards per group
  const groupWidth = (cardWidth * 2) + cardHeight + (gap * 4);

  const totalWidth = cardWidth * 2 + gap;

  const cardStartX = (canvas.width - containerWidth) / 2;

  const resultBarY = hudY + topH * 0.1;
  const resultBarH = topH * 0.3;

  const cardStartY = resultBarY + (resultBarH - cardHeight) / 2;

  // center reference
  const midX = canvas.width / 2;


  // start positions (left group ends at center gap)
  const centerGap = 100;


  const leftStartX = midX - centerGap / 2 - groupWidth;


  const leftGroupEnd = midX - centerGap / 2;


  const p1x = leftStartX + (cardWidth * 2) - gap ;
  const p2x = leftStartX + (cardWidth * 3) + gap * 3.3;
  const p3x = leftStartX + 24;

  const mirror = (x) => midX + (midX - (x + cardWidth));

  const b1x = mirror(p1x);
  const b2x = mirror(p2x);
  const b3x = mirror(p3x);

  const colors = {
    BLUE: "rgba(46, 34, 156, 0.5)",
    RED: " rgba(105, 14, 14, 0.5)",
    GREEN: " rgba(30, 97, 33, 0.5)",
    WHITE: " rgba(255, 255, 255, 1)",
  }


  const layout = {
    video: {
      x: (canvas.width - containerWidth) / 2,
      y: layoutPadding,
      w: videoWidth,
      h: videoHeight,
      bg: "rgba(0, 0, 0, 1)"
    },

    // topBar: {
    //   x: (canvas.width - containerWidth) / 2 ,
    //   y: hudY,
    //   w: containerWidth,
    //   h: topH
    // },

    statusBar: {
      x: (canvas.width - containerWidth) / 2 ,
      y: hudY,
      w: containerWidth,
      h: topH * 0.1,
      // bg: "rgb(46, 43, 43)"
    },
    
    // "resultBar": { //resultBar
    //   x: (canvas.width - containerWidth) / 2 ,
    //   y: hudY + topH * 0.1,
    //   w: containerWidth,
    //   h: topH * 0.3,
    //   bg: "rgb(51, 41, 41)"
    // },

    // "p result": {
    //   x: (canvas.width - containerWidth) / 2 ,
    //   y: hudY + topH * 0.1,
    //   w: containerWidth * 0.5,
    //   h: topH * 0.3,
    // },

    // "b result": {
    //   x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.5),
    //   y: hudY + topH * 0.1,
    //   w: containerWidth * 0.5,
    //   h: topH * 0.3,
    // },

    "p1": {
      x: p1x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      // bg: colors.WHITE,
      border: "rgb(255, 255, 255)",
    },
    "p3": {
      y: cardStartY,
      w: cardWidth,
      x: p3x,
      h: cardHeight,
      border: "rgb(255, 255, 255)",
      rotate: true
    },
    "b3": {
      x: b3x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      border: "rgb(15, 13, 13)",
      rotate: true,
      mirror: true
    },
    "p2": {
      x: p2x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      // bg: colors.WHITE,
      border: "rgb(255, 255, 255)",
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





    // placeBets: {
    //   x: (canvas.width - containerWidth) / 2 ,
    //   y: hudY + topH * 0.4,
    //   w: containerWidth,
    //   h: topH * 0.6,
    // },

    "player": {
      x: (canvas.width - containerWidth) / 2,
      y: hudY + topH * 0.4,
      w: containerWidth * 0.3332,
      h: topH * 0.3,
      bg: colors.BLUE
    },

    "tie": {
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332),
      y: hudY + topH * 0.4,
      w: containerWidth * 0.3332,
      h: topH * 0.3,
      bg: colors.GREEN
    },

    "banker": {
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332) * 2,
      y: hudY + topH * 0.4,
      w: containerWidth * 0.3332,
      h: topH * 0.3,
      bg: colors.RED
    },

    "p pair": {
      x: (canvas.width - containerWidth) / 2,
      y: hudY + topH * 0.7,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      bg: colors.BLUE
    },
    "perfect pair": {
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332),
      y: hudY + topH * 0.7,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      bg: colors.GREEN
    },
    "b pair": {
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332) * 2,
      y: hudY + topH * 0.7,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      bg: colors.RED
    },
    "p bonus": {
      x: (canvas.width - containerWidth) / 2,
      y: hudY + topH * 0.85,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      bg: colors.BLUE
    },
    "either pair": {
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332),
      y: hudY + topH * 0.85,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      bg: colors.GREEN
    },
    "b bonus": {
      x: (canvas.width - containerWidth) / 2 + (containerWidth * 0.3332) * 2,
      y: hudY + topH * 0.85,
      w: containerWidth * 0.3332,
      h: topH * 0.15,
      bg: colors.RED
    },

    "bottom bar": {
      x: (canvas.width - containerWidth) / 2,
      y: hudY + topH + layoutGap,
      w: containerWidth ,
      h: bottomH,
      bg: "rgba(255,255,255,0.3)",
    }
  };
  for (const [index, obj] of Object.entries(layout)) {
    ctx.fillStyle = obj.bg ?? "rgb(19, 17, 17)";
    ctx.lineWidth = 0.2;
    if(obj.border) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.33)"
      ctx.strokeStyle = "white";
      ctx.setLineDash([5, 5]); // 5px line, 5px gap
    }
    if (obj.rotate) {
      ctx.save();

      ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
      const rotation = obj.mirror ? -(Math.PI / 2): (Math.PI / 2)
      ctx.rotate(Math.PI / 2);

      ctx.fillRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
      ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);

      ctx.restore();
    } else {
      ctx.fillRect(obj.x, obj.y, obj.w, obj.h);

      ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);

    }
    // ctx.font = `${13 * scale}px Courier`;
    ctx.font = `${getFontSize(obj.w, obj.h)}px Courier`;
    ctx.fillStyle = obj.c ?? "rgba(248, 244, 244, 0.51)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      index.toUpperCase(),
      obj.x + obj.w / 2,
      obj.y + obj.h / 2
    );

  }
  //===========================
  //  BUTTONS
  //===========================
  // ctx.fillStyle = `rgb(231, 223, 223)`


  //===========================
  //  HUD PLACEBET
  //===========================



}

function init() {
  resize();

  drawLayout();
}

init();
window.addEventListener('resize', () => {
  init();
});


