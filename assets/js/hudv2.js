
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')


function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;

  // set actual pixel size
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;

  // set display size (CSS)
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';

  // 🔥 reset + scale context
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset (important on resize)
  ctx.scale(dpr, dpr);
}

function drawLayout(x = 0, y = canvas.height / 2, w = canvas.width / 3, h = 400) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w , y);
  ctx.lineTo(x + w , y + 10);
  ctx.arc(w / 2 , y + 400, 250, Math.PI * 1.2, 0, true);
  // ctx.lineTo(x - 10, y + 200);
 
  // ctx.closePath();

  ctx.strokeStyle = "white";
  ctx.lineWidth = 0.2;
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  // ctx.fill();
}


setupCanvas();
drawLayout();