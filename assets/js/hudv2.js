//===========================
//  SETUP CANVAS
//===========================
let hovered = null;
let clicked = null;

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const scale = 1;


const colors = {
  NEONRED: "rgb(252, 70, 70)",
  NEONBLUE: "rgb(88, 70, 252)",
  BLUE: "rgba(46, 34, 156, 0.5)",
  RED: " rgba(105, 14, 14, 0.5)",
  GREEN: " rgba(30, 97, 33, 0.5)",
  HOVERBLUE: "rgb(46, 34, 156)",
  HOVERRED: " rgb(105, 14, 14)",
  HOVERGREEN: " rgb(30, 97, 33)",
  ACTIVEBLUE: "rgb(50, 34, 192)",
  ACTIVERED: " rgb(150, 3, 3)",
  ACTIVEGREEN: " rgb(35, 116, 39)",
  WHITE: " rgba(255, 255, 255, 1)",
  TRANSPARENT: " rgba(255, 255, 255, 0)",
}


let buttons = [];

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
}

function getFontSize(width, height) {
  const base = Math.min(width, height);

  // safe scaling factor (tune this)
  return Math.max(15, Math.floor(base * 0.20));
}

function buildButtons(layout) {
  buttons = [];
  for (const [key, obj] of Object.entries(layout)) {
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


//======================================================
// VIDEO
//======================================================
const video = document.createElement("video");

video.src = "https://www.w3schools.com/tags/movie.mp4";
video.autoplay = true;
video.loop = true;
video.muted = true; // REQUIRED for autoplay on mobile
video.playsInline = true; // IMPORTANT for iOS Safari

video.play();

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

//======================================================
// UI
//======================================================
function drawUI() {
  //=================================================================================
  //  LAYOUT VARIABLES
  //=================================================================================
  buttons = [];
  ctx.fillStyle = `rgb(32, 32, 32)`
  const spacing = 10 ;
  const buttonGap = spacing / 2;

  const layoutPadding =0;
  const layoutGap =0;

  const vw = window.visualViewport?.width || window.innerWidth;
  const vh = window.visualViewport?.height || window.innerHeight;

  // const containerAvailableWidth = canvas.width - layoutPadding * 2;
  const containerAvailableWidth = canvas.width - layoutPadding * 2;
  const containerMaxWidth = 980;

  const isMobile = canvas.width <= 980; // adjust breakpoint if needed

  const containerWidth = isMobile
  ? containerAvailableWidth   // full width on phone
  : Math.min(containerAvailableWidth, containerMaxWidth);
  // const containerWidth = Math.min(containerAvailableWidth, containerMaxWidth);
  
  const videoWidth = containerWidth;
  const videoHeight = videoWidth * 9 / 16;

  const hudY = videoHeight + layoutGap * 2;
  const hudHeight = canvas.height - hudY - layoutPadding;

  const topRatio = 0.7;   // 40%
  const bottomRatio = 0.3; // 60%

  const topH = hudHeight * topRatio - layoutGap / 1;
  const bottomH = hudHeight * bottomRatio - layoutGap / 2;


  //=================================================================================
  //  CARDS - VARIABLES
  //=================================================================================
  const gap = 2;
  const aspect = 9/ 14;
  // max allowed space
  const maxCardHeight = topH * 0.25 - 21;
  const maxCardWidth = containerWidth / 8; // adjust depending on how tight you want layout

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

 
  
  const layout = {
    video: {
      x: (canvas.width - containerWidth) / 2,
      y: layoutPadding,
      w: videoWidth,
      h: videoHeight,
      bg: "rgba(0, 0, 0, 1)",
      isVideo: true
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
    "p": {
      x: midX - 20,
      y: cardStartY + cardHeight / 2.5,
      // x: p1x,
      // y: cardStartY - 20,
      w: 12,
      h: 12,
      bg: colors.TRANSPARENT,
      c: colors.NEONBLUE,
      fontWeight: '900',
      fontSize: '900',
    },
    "b": {
      x: midX + 5.5,
      y: cardStartY + cardHeight / 2.5,
      // x: p1x,
      // y: cardStartY - 20,
      w: 12,
      h: 12,
      bg: colors.TRANSPARENT,
      c: colors.NEONRED,
      fontWeight: '900',
    },
    "p3": {
      x: p3x,
      y: cardStartY,
      w: cardWidth,
      h: cardHeight,
      border: "rgb(255, 255, 255)",
      // rotate: true
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
      id: "player",
      x: (canvas.width - containerWidth) / 2,
      y: betRow1Y,
      w: containerWidth * 0.3332,
      h: betRow1H,
      bg: colors.BLUE,
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
      bg: colors.GREEN,
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
      bg: colors.RED,
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
      bg: colors.BLUE,
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
      bg: colors.GREEN,
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
      bg: colors.RED,
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
      bg: colors.BLUE,
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
      bg: colors.GREEN,
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
      bg: colors.RED,
      hoverBg: colors.HOVERRED,
      activeBg: colors.ACTIVERED,
      border: "rgb(255, 255, 255)",
      isButton: true
    },

    "bottom bar": {
      id: "bottom bar",
      x: (canvas.width - containerWidth) / 2,
      y: hudY + topH + layoutGap,
      w: containerWidth ,
      h: bottomH,
      bg: "rgba(255,255,255,0.3)",
    }
  };

  buildButtons(layout); 


  ctx.clearRect(0, 0, canvas.width, canvas.height)
  //=================================================================================
  //  VIDEO
  //=================================================================================

  const v = layout.video;

  if (video.readyState >= 2) {
    // ctx.drawImage(video, v.x, v.y, v.w, v.h);
    ctx.fillStyle = "black";
    ctx.fillRect(v.x, v.y, v.w, v.h);
    drawVideo(ctx, video, v.x, v.y, v.w, v.h);
  } 
 
  for (const [index, obj] of Object.entries(layout)) {

    //===================================
    // BORDER
    //===================================
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
    
    let fontWeight = obj.fontWeight ?? 'normal'
    
    
    let bg = obj.bg ?? "rgb(19, 17, 17)";

    const isClicked = index === clicked;
    const isHovered = index === hovered;

    if (isClicked) {
      bg = obj.activeBg ?? "rgb(19, 17, 17)";
    } else if (isHovered) {
      bg = obj.hoverBg ?? "rgb(80, 120, 255)";
    }

    ctx.fillStyle = bg ?? "rgb(19, 17, 17)";

    if(obj.bg) {
      // ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
    }


 
    ctx.fillStyle = obj.c ?? "rgba(248, 244, 244, 0.51)";
    ctx.font = `${fontWeight} ${getFontSize(obj.w, obj.h)}px Courier`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      index.toUpperCase(),
      obj.x + obj.w / 2,
      obj.y + obj.h / 2
    );

    
  }

}




canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();

  const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  const found = buttons.find(btn =>
    mouseX >= btn.x &&
    mouseX <= btn.x + btn.w &&
    mouseY >= btn.y &&
    mouseY <= btn.y + btn.h
  );
  hovered = null
  canvas.style.cursor = null; 
  if(found) {
    canvas.style.cursor = 'pointer'
    hovered = found.id
  }

});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();

  const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

  const found = buttons.find(btn =>
    mouseX >= btn.x &&
    mouseX <= btn.x + btn.w &&
    mouseY >= btn.y &&
    mouseY <= btn.y + btn.h
  );

  clicked = null
  if (found) {
    hovered = null
    clicked = found.id
    console.log("%c" + found.id, `background-color: ${found.activeBg};padding: 0.5rem 1rem`);
  }
  

});


function loop() {
  resize();
  drawUI();
  requestAnimationFrame(loop);
}

loop();
window.addEventListener('resize', () => {
});


