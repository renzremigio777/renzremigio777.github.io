class HudTopBar {
  constructor(x, y, w, h, bg) {
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

    ctx.fillStyle = "#25332b";
    // ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.strokeStyle = "rgb(199, 196, 196)";
    ctx.lineWidth = 0.1;
    ctx.setLineDash([]);
    // ctx.strokeRect(this.x, this.y, this.w, this.h);


    ctx.textAlign = "start";
    ctx.textBaseline = "middle";

    //========================================================================
    // STATS
    //========================================================================
    const scale = this.h / 100;

    const statItems = [
      { type: "text", text: "#47", bg: colors.NEONBLUE },
      { type: "badge", text: "P", bg: colors.NEONBLUE },
      { type: "text", text: "24" , bg: colors.NEONBLUE },
      { type: "badge", text: "B" , bg: colors.NEONRED },
      { type: "text", text: "17" , bg: colors.NEONBLUE },
      { type: "badge", text: "T" , bg: colors.NEONGREEN },
      { type: "text", text: "6" , bg: colors.NEONBLUE },
      { type: "badge", isTie:true, text: "", bg: colors.NEONBLUE },
      { type: "text", text: "4" , bg: colors.NEONBLUE },
      { type: "badge", isTie: true, text: "", bg: colors.NEONRED },
      { type: "text", text: "1" , bg: colors.NEONRED },
    ];

    const radius = 16 * scale;
    const gap = 25 * scale;
    const fontSize = Math.max(12 , 14 * scale);

    let startX = this.x + gap;
    const centerY = this.y + this.h / 2;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    statItems.forEach(item => {

      if (item.type === "badge") {
        ctx.beginPath();
        ctx.arc(startX + radius, centerY - 0.5, radius, 0, Math.PI * 2);
        ctx.strokeStyle = item.bg;
        ctx.lineWidth = 2
        ctx.stroke();
        if (item.isTie) {
          ctx.beginPath();
          // ctx.moveTo(startX, centerY)
          // ctx.lineTo(startX + radius * 2 , centerY)
          // ctx.stroke();
          const cx = startX + radius;
          const cy = centerY - 0.5;

          ctx.save();

          ctx.translate(cx, cy);
          ctx.rotate(-Math.PI / 4); // slant "/"

          // line through center
          ctx.beginPath();
          ctx.moveTo(-radius, 0);
          ctx.lineTo(radius, 0);
          ctx.stroke();

          ctx.restore();
        } else {
          ctx.fillStyle = item.bg;
          ctx.fill();
        }

        ctx.fillStyle = "#fff";
        ctx.font = `900 ${fontSize-2}px Trebuchet MS`;
        ctx.textAlign = "center";
        ctx.fillText(item.text, startX + radius, centerY);



        startX += radius  + gap;

      } else {
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${fontSize}px Trebuchet MS`;
        ctx.textAlign = "left";
        ctx.fillText(item.text, startX, centerY);

        // measure text width for proper spacing
        const textWidth = ctx.measureText(item.text).width;
        startX += textWidth + gap;
      }
    });

    //========================================================================
    // PREDICTION
    //========================================================================
    const gapBetweenPills = 20 * scale;

    const pills = [
      {
        label: "B",
        fill: colors.RED,
        stroke: colors.NEONRED
      },
      {
        label: "P",
        fill: colors.BLUE,
        stroke: colors.NEONBLUE
      }
    ];
    const pillHeight = this.h * 0.5;   // height relative to bar
    const pillWidth = Math.min(this.w * 0.18, 80);// width relative to bar
    const pRadius = pillHeight * 0.25;
    const endGap = 10;
    const pillX = this.w - pillWidth - endGap

    pills.forEach((item, i) => {
      const x = this.x + this.w - (pillWidth * (i + 1)) - (gapBetweenPills * i) - endGap;

      //========================
      // PILL BACKGROUND
      //========================
      ctx.beginPath();
      ctx.roundRect(
        x,
        centerY - pillHeight / 2,
        pillWidth,
        pillHeight,
        pillHeight / 2
      );
      ctx.fillStyle = item.fill;
      ctx.strokeStyle = item.stroke;
      ctx.fill();
      ctx.lineWidth = 0.5;
      ctx.stroke();

      //========================
      // LABEL (B / P)
      //========================
      ctx.fillStyle = colors.WHITE;
      ctx.font = `900 ${fontSize - 1}px Trebuchet MS`;
      ctx.textAlign = "center";
      ctx.fillText(item.label, x + pillWidth * 0.15, centerY + 1);

      //========================
      // OUTLINED CIRCLE
      //========================
      ctx.beginPath();
      ctx.arc(x + pillWidth * 0.35, centerY, pRadius, 0, Math.PI * 2);
      ctx.strokeStyle = item.stroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      //========================
      // FILLED CIRCLE
      //========================
      ctx.beginPath();
      ctx.arc(x + pillWidth * 0.57, centerY, pRadius, 0, Math.PI * 2);
      ctx.fillStyle = item.stroke;
      ctx.fill();
      ctx.stroke();

      //========================
      // SLASH
      //========================
      const cx = x + pillWidth * 0.8;
      const cy = centerY;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-Math.PI / 4);

      ctx.beginPath();
      ctx.moveTo(-pRadius, 0);
      ctx.lineTo(pRadius, 0);

      ctx.strokeStyle = item.stroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });

  }
}
class StatusBar {
  constructor(value, x, y, w, h, bg) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // this.bg = bg ?? "#414be2"
    this.bg = bg
    this.show =  false
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
    this.show = true;

    // cancel previous timer
    if (this._timer) {
      clearTimeout(this._timer);
    }

    // start new timer
    this._timer = setTimeout(() => {
      this.show = false;
    }, 1500);
  }
  draw(ctx) {
    if(this.show) {
      ctx.fillStyle = this.bg ?? "#106650";
      ctx.fillRect(this.x, this.y, this.w, this.h);

      ctx.strokeStyle = "rgb(199, 196, 196)";
      ctx.lineWidth = 0.1;
      ctx.setLineDash([]);
      // ctx.strokeRect(this.x, this.y, this.w, this.h);


      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${Math.max(18, getFontSize(this.w * 1.1, this.h * 1.1))}px Trebuchet MS`;

      ctx.fillStyle = colors.WHITE;
      ctx.fillText(this.value, this.x + this.w / 2, this.y + this.h / 2);
    }
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
    // ctx.strokeRect(this.x, this.y, this.size, this.size);


    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `100 ${Math.max(14, this.size / 2)}px Trebuchet MS`;

    ctx.fillStyle = this.isHovered
      ? "rgba(255, 255, 255, 0.75)"
      : "rgba(255, 255, 255, 0.29)";

    ctx.fillText(this.symbol, this.x + this.size / 2, this.y + this.size / 2 - 5);
    ctx.font = `100 ${Math.min(10, this.size / 2)}px Trebuchet MS`;
    ctx.fillText(this.value.toUpperCase(), this.x + this.size / 2, this.y + this.size - 9);
  }
}

class BetOptions {
  constructor(value, x,  y, w, h) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  isInside(mx, my) {

  }
  draw(ctx) {
    const gap = 10;
    const bRadius = 10
   
    const colW = this.w * 0.333 ;
    
    // ============================================
    //  PLAYER
    // ============================================
    (()=> {
      const x = this.x + gap;
      const y = this.y;
      const w = this.w + gap;
      const h = this.h + gap;
      const r = (h / 2);

      const cx = x + colW + r;
      const cy = y + h / 2;


      ctx.beginPath();
      ctx.moveTo(x + bRadius, y);
      ctx.lineTo(x + colW + r, y);
      // concave arc (inward cut)
      ctx.arc(
        cx,
        cy,
        r,
        Math.PI + (Math.PI / 2),
        Math.PI,
        true 
      );


      // bottom-right corner
      ctx.arc(
        x + colW - bRadius,
        y + h - bRadius + 8,
        bRadius,
        0,
        Math.PI - (Math.PI / 2),
        false 
      );


      // bottom-left corner
      ctx.arc(
        x + bRadius,
        y + h - bRadius + 8,
        bRadius,
        // Math.PI /2,
        Math.PI / 2,
        Math.PI,
        false 
      );

      // top-left corner
      ctx.arc(
        x + bRadius,
        y + bRadius,
        bRadius,
        Math.PI,
        -Math.PI / 2,
        false 
      );
      ctx.closePath();
      ctx.strokeStyle = colors.NEONBLUE;
      ctx.fillStyle = colors.BLUE;
      ctx.lineWidth = 2;
      ctx.stroke();
      // // ctx.fill();

    })();
    // ============================================
    //  BANKER
    // ============================================
    (()=> {
      const w = this.w + gap;
      const h = this.h + gap;
      
      const x = this.x + containerWidth -gap;
      const y = this.y ;
      
      const r = (h / 2);

      const cx = x - colW - r;
      const cy = y + h / 2;

      ctx.beginPath();
      ctx.moveTo(x - bRadius,  y);
      ctx.lineTo(x - colW - r, y);
      // concave arc (inward cut)
      ctx.arc(
        cx,
        cy,
        r,
        Math.PI + (Math.PI / 2),
        0,
        false 
      );

      // bottom-left corner
      ctx.arc(
        x - colW + bRadius,
        y + h - bRadius + 8,
        bRadius,
        Math.PI,
        Math.PI / 2,
        true 
      );


      // bottom-right corner
      ctx.arc(
        x  - bRadius,
        y + h - bRadius + 8,
        bRadius,
        Math.PI - (Math.PI / 2),
        0,
        true   
      );

      // top-right corner
      ctx.arc(
        x - bRadius,
        y + bRadius,
        bRadius,
        0,
        -Math.PI / 2,
        true 
      );

     
      ctx.strokeStyle = colors.NEONRED;
      ctx.fillStyle = colors.RED;
      ctx.lineWidth = 4;
      ctx.stroke();
      // ctx.fill();
    })();
    // ============================================
    //  TIE
    // ============================================
    (()=> {
      const x = this.x + containerWidth/2  + gap;
      const y = this.y;
      const w = x + (colW / 4);
      const h = this.h + gap;
      const r = (h / 2);
  

      const cx = this.x + containerWidth - (colW + r + gap);  
      const cy = y + 3 + h / 2  ;

      const offsetY = 8;
      ctx.beginPath();
      ctx.moveTo(this.x + (colW + r + gap), y + gap + 2)
      // top-right
      ctx.arc(
        cx - 2,
        cy,
        r + - 8,
        -Math.PI/2,
        0,
        false
      );
      // bottom-right
      ctx.arc(

        cx + r - gap - 10,
        y + h  - 3,
        bRadius,
        0,
        Math.PI - (Math.PI / 2),
        false
      );
     
      // bottom-left
      ctx.arc(
        x - colW / 2 + gap + 4 + 8,
        y + h  - 3,
        bRadius,
        // Math.PI /2,
        Math.PI / 2,
        Math.PI,
        false
      );

      // top-left
      ctx.arc(
       this.x + colW + r + gap + 4,
        cy,
        r + - 8,
        Math.PI,
        -Math.PI / 2,
        false
      );
    

     
      ctx.strokeStyle = colors.NEONGREEN;
      ctx.fillStyle = colors.GREEN;
      ctx.lineWidth = 4;
      ctx.stroke();
      // ctx.fill();
    })();


  }
}


const values = ["P", "B", "T"];
const resultData = []

for (let i = 0; i < 15; i++) {
  const randomValue = values[Math.floor(Math.random() * values.length)];
  resultData.push({ value: randomValue });
}
class ScoreBoard {
  constructor(type, x,y,w,h, rows) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.rows = rows;

    this.cellH = this.h / this.rows;
    this.cellW = this.cellH;

    // this.cols = Math.floor(this.w / this.cellW);
    this.cols = Math.floor(this.w / this.cellW);

    // this.w = this.cols * this.cellW;
    // 👇 shrink width to fit perfectly
    this.gridWidth = this.cols * this.cellW +1;
    this.offsetX = (this.w - this.gridWidth) / 2;

    this.smallRoadState = { col: 0, row: 0 };
    this.smallRoadData = []; // 👈 ADD THIS
  }
  buildSmallRoad() {
    const state = { col: 0, row: 0 };
    const colHeight = 6;

    this.smallRoadData = [];

    for (let i = 0; i < resultData.length; i++) {
      const result = resultData[i];
      const prev = resultData[i - 1]?.value;
      const changed = prev && prev !== result.value;

      this.smallRoadData.push({
        value: result.value,
        col: state.col,
        row: state.row
      });

      if (changed || state.row >= colHeight - 1) {
        state.col++;
        state.row = 0;
      } else {
        state.row++;
      }
    }
  }
  draw(ctx) {
    const startX = this.x + this.offsetX;

    ctx.fillStyle = "#4a6d5f21";
    ctx.fillRect(startX, this.y, this.gridWidth, this.h);
    ctx.strokeStyle = "rgba(255, 250, 250, 0.86)";

    ctx.beginPath();
    // horizontal
    for (let i = 1; i < this.rows; i++) {
      const y = Math.round(this.y + i * this.cellH) + 0.5;
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + this.gridWidth, y);
    }

    // vertical
    for (let i = 1; i < this.cols; i++) {
      const x = Math.round(startX + i * this.cellW) + 0.5;
      ctx.moveTo(x, this.y);
      ctx.lineTo(x, this.y + this.h);
    }
    ctx.lineWidth = 0.1;
    ctx.stroke();

   
    if (this.type === "bigroad") {
      const y = Math.round(this.y + 6 * this.cellH) + 0.5;


      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + this.gridWidth, y);

      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 0.3;
      ctx.stroke();


      const endY = this.y + this.h;
      const thirds = 3; // number of sections

      for (let i = 1; i < thirds; i++) {
        const colIndex = Math.floor(this.cols * i / thirds);
        const x = Math.round(startX + colIndex * this.cellW) + 0.5;


        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, endY);

        ctx.stroke();
      }

    }

    //================================================
    // DATA
    //================================================
    const row = 0;
    const col = 0;

    const cx = startX + col * this.cellW + this.cellW / 2;
    const cy = this.y + row * this.cellH + this.cellH / 2;

    const radius = this.cellW * 0.4;
    
    let currentY = cy;
    let currentX = cx;
    let smallRoadX = 0;
    resultData.forEach((result,index) => {
      const color = result.value === "P" ? colors.NEONBLUE :
        result.value === "B" ? colors.NEONRED :
          result.value === "T" ? colors.NEONGREEN : "#0000";
      switch (this.type) {
        case "beadroad":
          // circle
          ctx.beginPath();
          ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.fill();      
          ctx.lineWidth = 1.5;    
          ctx.stroke();
          // text
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.fillStyle = colors.WHITE;
          const fontSize = radius * 1.4; // scale with circle
          ctx.font = `900 ${fontSize}px Trebuchet MS`;
          ctx.fillText(result.value, currentX, currentY); // ✅ centered

          // SHIFT ROW
          currentY += this.cellH + 0.25

          // SHIFT COLUMN
          if(index % 6 === 5 ) {
            currentY = cy;
            currentX += this.cellW + 0.25
          }
          break;
        case "bigroad":
        
          (() => {
            // SHIFT COLUMN
            const previousValue = resultData[index - 1]?.value ?? null
            if (index % 6 === 5 || (previousValue && previousValue !== result.value)) {
              currentY = cy;
              currentX += this.cellW
            }
            ctx.beginPath();
            ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = result.value === "P" ? colors.NEONBLUE :
              result.value === "B" ? colors.NEONRED :
                result.value === "T" ? colors.NEONGREEN : "#0000";
            ctx.lineWidth = 1.5

            ctx.stroke();

            // SHIFT ROW
            currentY += this.cellH + 0.25;
          })();

          const y = Math.round(this.y + 6 * this.cellH) + 0.7;
          const sRad = Math.min(this.cellW, this.cellH) * 0.125;
          // SMALL ROAD
          
          (() => {
            const state = this.smallRoadData[index];
            if (!state) return;

            const baseX = startX;
            const baseY = y;

            // 🔥 each 2 rows = 1 cell
            const cellRow = Math.floor(state.row / 2);
            const halfOffset = state.row % 2; // 0 = top, 1 = bottom

            const cx =
              baseX +
              state.col * this.cellW * 0.504 +
              this.cellW * 0.25;

            const cy =
              baseY +
              cellRow * this.cellH +
              (halfOffset * (this.cellH * 0.4)) +
              (this.cellH * 0.25);

            ctx.beginPath();
            ctx.arc(cx, cy, sRad, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          })();
          // IG EYE
          // (() => {
          //   const colIndex = Math.floor(this.cols * 1 / 3);
          //   const x = Math.round(startX + colIndex * this.cellW) + 0.5;

          //   ctx.beginPath();
          //   ctx.arc(x, y, sRad, 0, Math.PI * 2);
          //   ctx.fillStyle = color;
          //   ctx.fill();
          // })();
          
          // // COCKROACH
          // (() => {
          //   const colIndex = Math.floor(this.cols * 2 / 3);
          //   const x = Math.round(startX + colIndex * this.cellW) + 0.5;

          //   ctx.beginPath();
          //   ctx.arc(x, y, sRad, 0, Math.PI * 2);
          //   ctx.fillStyle = colors.NEONBLUE;
          //   ctx.fill();
          // })();

        
          break;
      }
    });
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
  NEONBLUE: "rgb(68, 133, 255)",
  NEONRED: "rgb(243, 68, 68)",
  NEONGREEN: " rgb(28, 161, 34)",
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
const quickTools = [];
let hudTopBar = null;
let statusBar = null;
let beadRoad = null;
let bigRoad = null;
let betOptions = null;
let bankerCell = null;

//======================================
//  DRAW CONTAINER
//======================================
const layoutPadding = 0;
const layoutGap = 0;
let containerAvailableWidth = 0;
let containerMaxWidth = 980;
let containerWidth = containerMaxWidth;
let leftGutter = 0;


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

// let topH = 0;
// let bottomH = 0;
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
  leftGutter = (canvas.width - containerWidth) / 2;
  videoW = containerWidth;
  videoH = videoW * 9 / 18;

  hudY = videoH + layoutGap * 2;
  hudH = canvas.height - hudY - layoutPadding;

  topRatio = 0.7;   // 70%
  bottomRatio = 0.3; // 30%

  topH = hudH * topRatio - layoutGap / 1;
  bottomH = hudH * bottomRatio - layoutGap / 2;

}

function getFontSize(width, height) {
  const base = Math.min(width, height);

  // safe scaling factor (tune this)
  return Math.max(15, Math.floor(base * 0.20));
}
function buildStatusBar() {
  let topBarContainer= {
    x: leftGutter ,
    y: hudY,
    w: containerWidth,
    h: topH * 0.1,
  };

  statusBar = new StatusBar(
    'PLACE YOUR BET',
    topBarContainer.x,
    topBarContainer.y,
    topBarContainer.w,
    topBarContainer.h
  );
}
function buildHudTopBar() {
  let topBarContainer = {
    x: leftGutter ,
    y: hudY,
    w: containerWidth,
    h: topH * 0.1,
  };

  hudTopBar = new HudTopBar(
    topBarContainer.x,
    topBarContainer.y,
    topBarContainer.w,
    topBarContainer.h
  );
}

function buildScoreBoard() {
  // roadMapGrid = new ScoreBoard(
  //   leftGutter ,
  //   hudY + topH * 1.04 ,
  //   containerWidth ,
  //   bottomH - 15,
  //   rows,
  //   colums
  // );
  const startX = (canvas.width - containerWidth) * 0.5;

  beadRoad = new ScoreBoard(
    'beadroad',
    startX,
    hudY + topH * 0.1,
    containerWidth * 0.5,
    topH * 0.3,
    6
  );

  bigRoad = new ScoreBoard(
    'bigroad',
    startX + (containerWidth * 0.5),
    hudY + topH * 0.1 ,
    containerWidth * 0.5,
    topH * 0.3,
    9
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
    x: leftGutter,
    y: hudY + topH * 1.25,
    w: containerWidth,
    h: bottomH / 3,
  };

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

  const chipG = -20;
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
  quickTools.length = 0;
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

      quickTools.push(btn);
    }

    startX += chipD + chipG + (index === 5? 8 : 0);
  });
}
function buildBetOptions() {
  const items = [
    { type: "chip", value: "player", bg: colors.BLUE },
    { type: "chip", value: "tie", bg: colors.GREEN },
    { type: "chip", value: "banker", bg: colors.RED },
  ];

  // items.forEach(item => {
  //   //  "player": {
  //   //   id: "player",
  //   //   x: leftGutter,
  //   //   y: betRow1Y,
  //   //   w: containerWidth * 0.3332,
  //   //   h: betRow1H,
  //   //   // bg: colors.BLUE,
  //   //   hoverBg: colors.HOVERBLUE,
  //   //   activeBg: colors.ACTIVEBLUE,
  //   //   border: "rgb(255, 255, 255)",
  //   //   isButton: true
  //   // },
  // }); 
  // hudY + topH * 0.1
  // const resultBarY = hudY + topH * 0.4;
  // const resultBarH = topH * 0.22;
  betOptions = new BetOptions (
    "player",  
    leftGutter,
    hudY + topH * 0.4 + topH * 0.22,
    containerWidth,
    topH * 0.25,
  )

 
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
  const resultBarY = hudY + topH * 0.4;
  const resultBarH = topH * 0.22;
  const cardStartY = resultBarY + (resultBarH - cardHeight) ;

  const betRow1Y = cardStartY + resultBarH;
  const betRow1H = topH * 0.25;
  const betRow2Y = betRow1Y + betRow1H;
  const betRow2H = topH * 0.15;
  const betRow3Y = betRow2Y + betRow2H;
  const betRow3H = betRow2H

  const chipRowY = hudY + topH * 0.90;

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
      x: leftGutter,
      y: layoutPadding,
      w: videoW,
      h: videoH,
      bg: "rgba(0, 0, 0, 1)",
      isVideo: true
    },

    // topBar: {
    //   x: leftGutter ,
    //   y: hudY,
    //   w: containerWidth,
    //   h: topH
    // },

    // statusBar: {
    //   bg: "rgba(212, 191, 191, 0.97)"
    //   x: leftGutter ,
    //   y: hudY,
    //   w: containerWidth,
    //   h: topH * 0.1,
    //   bg: "rgba(212, 191, 191, 0.97)"
    // },

    // "resultBar": { //resultBar
    //   id: "result bar",
    //   x: leftGutter ,
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
    //   x: leftGutter ,
    //   y: hudY + topH * 0.4,
    //   w: containerWidth,
    //   h: topH * 0.6,
    // },


    //=============================================
    // PLACE BET
    //=============================================
    "player": {
      id: "player",
      x: leftGutter,
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
      x: leftGutter + (containerWidth * 0.3332),
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
      x: leftGutter + (containerWidth * 0.3332) * 2,
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
      x: leftGutter,
      y: betRow2Y,
      w: containerWidth * 0.3332,
      h: betRow2H,
      // bg: colors.BLUE,
      hoverBg: colors.HOVERBLUE,
      activeBg: colors.ACTIVEBLUE,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "perfect pair": {
      id: "perfect pair",
      x: leftGutter + (containerWidth * 0.3332),
      y: betRow2Y,
      w: containerWidth * 0.3332,
      h: betRow2H,
      // bg: colors.GREEN,
      hoverBg: colors.HOVERGREEN,
      activeBg: colors.ACTIVEGREEN,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "b pair": {
      id: "b pair",
      x: leftGutter + (containerWidth * 0.3332) * 2,
      y: betRow2Y,
      w: containerWidth * 0.3332,
      h: betRow2H,
      // bg: colors.RED,
      hoverBg: colors.HOVERRED,
      activeBg: colors.ACTIVERED,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "p bonus": {
      id: "p bonus",
      x: leftGutter,
      y: betRow3Y,
      w: containerWidth * 0.3332,
      h: betRow2H,
      // bg: colors.BLUE,
      hoverBg: colors.HOVERBLUE,
      activeBg: colors.ACTIVEBLUE,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "either pair": {
      id: "either pair",
      x: leftGutter + (containerWidth * 0.3332),
      y: betRow3Y,
      w: containerWidth * 0.3332,
      h: betRow2H,
      // bg: colors.GREEN,
      hoverBg: colors.HOVERGREEN,
      activeBg: colors.ACTIVEGREEN,
      border: "rgb(255, 255, 255)",
      isButton: true
    },
    "b bonus": {
      id: "b bonus",
      x: leftGutter + (containerWidth * 0.3332) * 2,
      y: betRow3Y,
      w: containerWidth * 0.3332,
      h: betRow2H,
      // bg: colors.RED,
      hoverBg: colors.HOVERRED,
      activeBg: colors.ACTIVERED,
      border: "rgb(255, 255, 255)",
      isButton: true
    },



    //=============================================
    // CHIPS CONTAINER
    //=============================================
    // "": {
    //   id: "chips_container",
    //   x: leftGutter,
    //   y: chipRowY,
    //   w: containerWidth ,
    //   h: bottomH / 3,
    //   border: "rgb(255, 255, 255)",
    //   bg: "rgba(255,255,255,0.3)",
    // },
    //=============================================
    // chiptools CONTAINER
    //=============================================
    // "chiptools_container": {
    //   id: "chiptools_container",
    //   x: leftGutter,
    //   y: hudY + topH + layoutGap + bottomH / 2,
    //   w: containerWidth ,
    //   h: bottomH / 2,
    //   border: "rgb(255, 255, 255)",
    //   bg: "rgba(255,255,255,0.3)",
    // },
    // "bottom bar": {
    //   id: "bottom bar",
    //   x: leftGutter,
    //   y: chipRowY + bottomH / 3,
    //   w: containerWidth ,
    //   h: bottomH,
    //   border: "rgb(255, 255, 255)",
    //   bg: "rgba(255,255,255,0.3)",
    // },
  };



  buildButtons(components);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //=================================================================================
  //  DRAW HUD TOP BAR
  //=================================================================================
  hudTopBar.draw(ctx)
  //=================================================================================
  //  DRAW SCOREBOARD
  //=================================================================================
  beadRoad.draw(ctx)
  bigRoad.draw(ctx)
  //=================================================================================
  //  DRAW BET OPTIONS
  //=================================================================================
  betOptions.draw(ctx)
  //=================================================================================
  //  CHIPS CONTROLLER
  //=================================================================================
  chips.forEach(chip => chip.draw(ctx));
  quickTools.forEach(chip => chip.draw(ctx));

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
  //=================================================================================
  //  DRAW STATUS BAR
  //=================================================================================
  statusBar.draw(ctx)

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
  quickTools.forEach(b => b.isHovered = false);
  const toolHovered = quickTools.find(tool => tool.isInside(mX, mY));
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
  const toolFound = quickTools.find(tool => tool.isInside(mX, mY));

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
  quickTools.forEach(tool =>  tool.isActive = false);
});



//===========================================================================/
// STARTING POINT
//===========================================================================/
function loop() {
  drawUI();
  requestAnimationFrame(loop);
}

initVideo();

function main() {
  resize();
  buildBetOptions();
  buildChipController();
  buildStatusBar();
  buildScoreBoard();
  buildHudTopBar();
  bigRoad.buildSmallRoad();
}
main();
window.addEventListener("resize", main);

loop();