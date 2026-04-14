document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('hud');
  const ctx = canvas.getContext('2d');

  
  let midX = canvas.width / 2;
  let midY = canvas.height / 2;
  let maxX = canvas.width;
  let maxY = canvas.height;

  const hudPanel = {
    posX: 20,
    posY: midY,
    width: maxX - 40,
    height: midY - 20,
  }
  
  
  let buttons = [];

  const initVariables = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    midX = canvas.width / 2;
    midY = canvas.height / 2;
    maxX = canvas.width;
    maxY = canvas.height; 
    hudPanel.posX = 20
    hudPanel.posY = midY
    hudPanel.width = maxX - 40
    hudPanel.height = midY - 20
  }
  const drawButtons = () => {
    console.log('drawButtons')
    // Buttons
    let startX = hudPanel.posX + 16;

    if(!buttons.length) {
      console.log('!nono')
      for (var i = 0; i < 3; i++) {
        const pbButton = {
          posX: startX,
          posY: hudPanel.posY + 16,
          width: (hudPanel.width / 3) - 21,
          height: midY - 32 - 20,
          hovered: false,
          index: i
        }
        buttons.push(pbButton);
        ctx.beginPath();
        ctx.fillStyle = '# ';
        ctx.lineWidth = 2;

        ctx.rect(pbButton.posX, pbButton.posY, pbButton.width, pbButton.height);
        ctx.fill();
        startX += pbButton.width + 16;
      }
    }

    buttons.forEach(btn => {
      ctx.beginPath();

      btn.posX = startX;
      btn.posY = hudPanel.posY + 16;
      btn.width = (hudPanel.width / 3) - 21;
      btn.height = midY - 32 - 20;

      // ✅ choose color BEFORE drawing
      ctx.fillStyle = btn.hovered ? '#f35f09' : '#381b86';

      ctx.rect(btn.posX, btn.posY, btn.width, btn.height);
      ctx.fill();

      startX += btn.width + 16;
    });

  }

  const drawControls = () => {
    initVariables();
    ctx.clearRect(0, 0, innerWidth,innerHeight);
    drawButtons();
  };

  drawControls();
  
  // canvas.addEventListener("mousemove", (e) => {
  //   const rect = canvas.getBoundingClientRect();

  //   const scaleX = canvas.width / rect.width;
  //   const scaleY = canvas.height / rect.height;

  //   const mouseX = (e.clientX - rect.left) * scaleX;
  //   const mouseY = (e.clientY - rect.top) * scaleY;

  //   let needsRedraw = false;
  //   canvas.style.cursor = buttons.some(b => b.hovered)
  //     ? "pointer"
  //     : "default";
  //   buttons.forEach(btn => {
      
  //     const isInside =
  //       mouseX >= btn.posX &&
  //       mouseX <= btn.posX + btn.width &&
  //       mouseY >= btn.posY &&
  //       mouseY <= btn.posY + btn.height;

  //     if (btn.hovered !== isInside) {
  //       btn.hovered = isInside;
        
  //     }  
  //   });
  //     drawControls();

  //   // if (needsRedraw) draw(); // only redraw if state changed
  // });
  // canvas.addEventListener("click", (e) => {
  //   const rect = canvas.getBoundingClientRect();

  //   const scaleX = canvas.width / rect.width;
  //   const scaleY = canvas.height / rect.height;

  //   const mouseX = (e.clientX - rect.left) * scaleX;
  //   const mouseY = (e.clientY - rect.top) * scaleY;

  //   buttons.forEach(btn => {
  //     const isInside =
  //       mouseX >= btn.posX &&
  //       mouseX <= btn.posX + btn.width &&
  //       mouseY >= btn.posY &&
  //       mouseY <= btn.posY + btn.height;

  //     if (isInside) {
  //       console.log("Clicked button:", btn.index);
  //     }
  //   });
  //   drawControls();
  // });

    window.addEventListener("resize", drawControls);
});


