
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

  const handleResize = () => {

};

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


function getFontSize(width, height) {
  // pick a safe ratio
  const sizeByWidth =  width * 0.07;   // 10% of width
  const sizeByHeight = height * 0.90; // 30% of height

  return Math.floor(Math.min(sizeByWidth, sizeByHeight));
}
const init = () => {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;

  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';


  // 🔥 ADD THIS
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  const w = innerWidth;
  const h = innerHeight;

  midX = w / 2;
  midY = h / 2;
  maxX = w;
  maxY = h;
  hudPanel.posX = 20
  hudPanel.posY = midY
  hudPanel.width = maxX - 40
  hudPanel.height = midY - 20

 
  const gutter = 10;
  const divs = 3;

  // horizontal layout
  // const totalXGutter = gutter * (divs + 1);
  // const divWidth = (w - totalXGutter) / divs;
  // const divHeight = 200;//rowHeight / 4'
  // const divPosY = rowHeight - divHeight + gutter

  const totalXGutter = gutter * 2;
  const divWidth = w - (gutter * 2);

  // vertical layout
  const top = gutter;

  // ONLY bottom spacing is added here
  const bottomSpace = gutter * 1;
  const rowHeight = h - top - bottomSpace;
  // const divPosY = gutter
  // const divPosY = rowHeight - layout[currentLayout].divHeight + top;
  const layout = {
    mobile: {
      divWidth: w - totalXGutter, // column
      divHeight: 180,
      divPosX: gutter,
      divPosY: rowHeight - (divs * 180)- gutter
    },
    desktop: {
      divWidth: (w - totalXGutter * 2) / divs, // divided into 3
      divHeight: 200,
      divPosY: rowHeight - 200 + gutter ,
      divPosX: gutter,
    }
  }

  let isMobile = w < 700;
  let currentLayout = isMobile ? 'mobile' : 'desktop'


  let layoutIndicator = `${isMobile ? 'Mobile' :'Desktop'} W:${w}px H:${h}px`;
   console.log(
    `%c${layoutIndicator}`,
    `color: ${isMobile ? '#4e92ff' : '#ff4e4e'}; font-weight: 900;`
  );
  ctx.font = `200 ${getFontSize(w / 2, h / 3)}px Arial`;

  ctx.fillStyle = "#ffffff60"
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(layoutIndicator,w/2,  h/3);
  ctx.translate(0.5, 0.5);

  let x = gutter;
 
  let y = layout[currentLayout].divPosY;
  for (let i = 0; i < divs; i++) {


    // BOX
    // =========================
    ctx.fillStyle = "rgb(52, 43, 43)";
    ctx.strokeStyle = "#ffffffe3";
    ctx.lineWidth = 0.1;
    // ctx.fillRect(x, y, layout[currentLayout].divWidth, layout[currentLayout].divHeight);
    ctx.strokeRect(x, y, layout[currentLayout].divWidth, layout[currentLayout].divHeight); // BOX BORDER

    
    let boxLabel = '';
    let temp = 2;
    switch(i) {
      case 0: // 1st Box
        break;
      case 1: // 2nd Box


        // PLACE BUTTON
        ctx.fillStyle = "rgba(83, 82, 82, 0.42)";
        ctx.strokeStyle = "#ffffff3d";
        var spacing = 10
        // ctx.fillRect(x, layout[currentLayout].divPosY, layout[currentLayout].divWidth, layout[currentLayout].divHeight);

        const buttonWidth = ((layout[currentLayout].divWidth - (gutter * 4)) / 3)
        const buttonHeight = ((layout[currentLayout].divHeight - (gutter * 4)) / 3)
        let basePosX = x + gutter;
        // let basePosY = y + 0 * (layout[currentLayout].divHeight + gutter * 2);
        // let basePosY = h - layout[currentLayout].divHeight;
        let basePosY = y + gutter;


        let fsBig = getFontSize(buttonWidth + 100, buttonHeight + 100)
        let fsSmall = getFontSize(buttonWidth + 60, buttonHeight + 60)

        
        const bgBlue = "#0b0b8080";
        const bgGreen = "rgba(57, 91, 57, 0.5)";
        const bgRed = "rgba(168, 38, 38, 0.5)";

        const borderBlue = "rgba(128, 128, 254, 0.5)";
        const borderGreen = "rgb(90, 215, 90, 0.5)";
        const borderRed = "rgb(250, 148, 148, 0.5)";
        
        // const gradient = ctx.createLinearGradient(basePosX, basePosY, basePosX + buttonWidth, y);
        const blueGradient = ctx.createLinearGradient(basePosX, basePosY, basePosX, 1000);
        blueGradient.addColorStop(0, "#0d0d47");   // start color
        blueGradient.addColorStop(1, "#0d39b3");   // end color

        const redGradient = ctx.createLinearGradient(basePosX, basePosY, basePosX, 1000);
        redGradient.addColorStop(0, "#470d0d");   // start color
        redGradient.addColorStop(1, "#b30d0d");   // end color

        const greenGradient = ctx.createLinearGradient(basePosX, basePosY, basePosX, 1000);
        greenGradient.addColorStop(0, "#0d4724");   // start color
        greenGradient.addColorStop(1, "#0db379");   // end color
        const buttons = [
          { bgColor: blueGradient, borderColor: borderBlue, fontSize: fsBig, text: "PLAYER"},
          { bgColor: greenGradient, borderColor: borderGreen, fontSize: fsBig, text: "TIE"},
          { bgColor: redGradient, borderColor: borderRed, fontSize: fsBig, text: "BANKER"},

          { bgColor: blueGradient, borderColor: borderBlue, fontSize: fsSmall, text: "P PAIR"},
          { bgColor: greenGradient, borderColor: borderGreen, fontSize: fsSmall, text: "PERFECT PAIR"},
          { bgColor: redGradient, borderColor: borderRed, fontSize: fsSmall, text: "B BANKER"},

          { bgColor: blueGradient, borderColor: borderBlue, fontSize: fsSmall, text: "P PAIR"},
          { bgColor: greenGradient, borderColor: borderGreen, fontSize: fsSmall, text: "EITHER PAIR"},
          { bgColor: redGradient, borderColor: borderRed, fontSize: fsSmall, text: "B PAIR"},
        ]

        buttons.forEach((button, index) => {
          const rowIndex = Math.floor(index / 3);
          const colIndex = index % 3;

          const buttonPosX = basePosX + colIndex * (buttonWidth + gutter);
          const buttonPosY = basePosY + rowIndex * (buttonHeight + gutter);

          ctx.lineWidth = 3;
          ctx.strokeStyle = button.borderColor;
          ctx.strokeRect(buttonPosX, buttonPosY, buttonWidth, buttonHeight);

          
          ctx.fillStyle = button.bgColor;
          ctx.fillRect(buttonPosX, buttonPosY, buttonWidth, buttonHeight);

          // TEXT
          ctx.font = `200 ${button.fontSize}px Arial`;
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.fillText(
            button.text,
            buttonPosX + buttonWidth / 2,
            buttonPosY + buttonHeight / 2
          );
        });
        break;
      case 2: // 3rd Box
        break;
    }

    if(!isMobile) {
      x += layout[currentLayout].divWidth + gutter;
    } else {
      y += layout[currentLayout].divHeight + gutter;
    }
  }

}


init();

window.addEventListener('resize', init);