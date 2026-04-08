document.addEventListener('DOMContentLoaded', async () => {


  const wrapperWidth = 520, wrapperHeight = 120;
  function renderBeadRoad() {
    const beadRoad = document.querySelector('svg#beadroad');
    beadRoad.setAttribute('viewBox', `0 0 ${wrapperWidth} ${wrapperHeight}`);

    const whiteBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    whiteBg.setAttribute('width', wrapperWidth);
    whiteBg.setAttribute('height', wrapperHeight);
    whiteBg.setAttribute('x', '0');
    whiteBg.setAttribute('y', '0');
    whiteBg.setAttribute('rx', '4');
    whiteBg.setAttribute('ry', '4');
    whiteBg.setAttribute('fill', '#ffffff');
    beadRoad.appendChild(whiteBg)

    const columnCount = 26, rowCount = 6, cellSize = 20;
    for (let x = 0; x <= columnCount; x++) {
      const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vLine.setAttribute('x1', x * cellSize);
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', x * cellSize);
      vLine.setAttribute('y2', wrapperHeight);
      // vLine.setAttribute('style', 'stroke:#000; stroke-width: 0.1px;');
      vLine.classList.add('grid-line');
      beadRoad.appendChild(vLine);
    }
    for (let y = 0; y <= rowCount; y++) {
      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', y * cellSize);
      hLine.setAttribute('x2', wrapperWidth);
      hLine.setAttribute('y2', y * cellSize);
      // hLine.setAttribute('style', 'stroke:#000; stroke-width: 0.1px;');
      hLine.classList.add('grid-line');
      beadRoad.appendChild(hLine);
    }


  }
  function renderBigRoad() {
    const fourRoad = document.querySelector('svg#fourroad');
    fourRoad.setAttribute('viewBox', `0 0 ${wrapperWidth} ${wrapperHeight}`);
    

    const bigRoad = document.querySelector('#big-road');
    // bigRoad.setAttribute('transform', 'scale(.9)');

    const whiteBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    whiteBg.setAttribute('width', wrapperWidth);
    whiteBg.setAttribute('height', wrapperHeight);
    whiteBg.setAttribute('x', '0');
    whiteBg.setAttribute('y', '0');
    whiteBg.setAttribute('rx', '4');
    whiteBg.setAttribute('ry', '4');
    whiteBg.setAttribute('fill', '#ffffff');
    // fourRoad.appendChild(whiteBg)
    // bigRoad.appendChild(whiteBg)

    const columnCount = 39, rowCount = 6, cellSize = 13.3;  
    for (let x = 0; x <= columnCount; x++) {
      const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vLine.setAttribute('x1', x * cellSize);
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', x * cellSize);
      vLine.setAttribute('y2', 79);
   
      vLine.classList.add('grid-line');
      bigRoad.appendChild(vLine);
      if (x === columnCount || x === 0) {
        vLine.setAttribute('style', 'stroke:#000; stroke-width: .4;');
      }
    }
    for (let y = 0; y <= rowCount; y++) {
      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', y * cellSize);
      hLine.setAttribute('x2', wrapperWidth -1);
      hLine.setAttribute('y2', y * cellSize);
      // hLine.setAttribute('style', 'stroke:#000; stroke-width: 0.1px;');
      hLine.classList.add('grid-line');
      bigRoad.appendChild(hLine);
      if (y === 6 || y === 0) {
        hLine.setAttribute('style', 'stroke:#000; stroke-width: .4;');
      }
    }


  }
  function renderBigEye() {

    const bigEye = document.querySelector('#big-eye');
    // bigEye.setAttribute('transform', 'scale(.9)');

    const columnCount = 13, rowCount = 3, cellSize = 13.32;  
    for (let x = 0; x <= columnCount; x++) {
      const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vLine.setAttribute('x1', x * cellSize);
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', x * cellSize);
      vLine.setAttribute('y2', 40);
   
      vLine.classList.add('grid-line');
      bigEye.appendChild(vLine);
      if (x === columnCount || x === 0) {
        vLine.setAttribute('style', 'stroke:#000; stroke-width: .4;');
      }
    }
    for (let y = 0; y <= rowCount; y++) {
      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', y * cellSize);
      hLine.setAttribute('x2', '33.3%');
      hLine.setAttribute('y2', y * cellSize);
      // hLine.setAttribute('style', 'stroke:#000; stroke-width: 0.1px;');
      hLine.classList.add('grid-line');
      bigEye.appendChild(hLine);
      if (y === 3) {
        hLine.setAttribute('style', 'stroke:#000; stroke-width: .4;');
      }
    }


  }
  function renderSmallRoad() {

    const smallRoad = document.querySelector('#small-road');

    const columnCount = 13, rowCount = 3, cellSize = 13.32;  
    for (let x = 0; x <= columnCount; x++) {
      const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vLine.setAttribute('x1', x * cellSize);
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', x * cellSize);
      vLine.setAttribute('y2', 40);
   
      vLine.classList.add('grid-line');
      smallRoad.appendChild(vLine);
      if (x === columnCount) {
        vLine.setAttribute('style', 'stroke:#000; stroke-width: .4;');
      }
    }
    for (let y = 0; y <= rowCount; y++) {
      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', y * cellSize);
      hLine.setAttribute('x2', '33.3%');
      hLine.setAttribute('y2', y * cellSize);
      // hLine.setAttribute('style', 'stroke:#000; stroke-width: 0.1px;');
      hLine.classList.add('grid-line');
      smallRoad.appendChild(hLine);
      if (y === 3) {
        hLine.setAttribute('style', 'stroke:#000; stroke-width: .4;');
      }
    }


  }
  function renderCockcroach() {

    const cockroach = document.querySelector('#cockroach');

    const columnCount = 13, rowCount = 3, cellSize = 13.32;  
    for (let x = 0; x <= columnCount; x++) {
      const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vLine.setAttribute('x1', x * cellSize);
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', x * cellSize);
      vLine.setAttribute('y2', 40);
   
      vLine.classList.add('grid-line');
      cockroach.appendChild(vLine);
      
      if (x === columnCount) {
        vLine.setAttribute('style', 'stroke:#000; stroke-width: .4;');
      }
    }
    for (let y = 0; y <= rowCount; y++) {
      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', y * cellSize);
      hLine.setAttribute('x2', '33.3%');
      hLine.setAttribute('y2', y * cellSize);
      // hLine.setAttribute('style', 'stroke:#000; stroke-width: 0.1px;');
      hLine.classList.add('grid-line');
      cockroach.appendChild(hLine);
      if (y === 3) {
        hLine.setAttribute('style', 'stroke:#000; stroke-width: .4;');
      }
    }


  }

  const placeBetButtons = document.querySelectorAll('svg.betting > .place-bet');
  for (let i = 0; i < placeBetButtons.length; i++) {
    const btn = placeBetButtons[i];

    btn.addEventListener('click', () => {
      alert(btn.id);
    });
  }

  const betChipButtons = document.querySelectorAll('svg.bet-chips > .chip');
  for (let i = 0; i < betChipButtons.length; i++) {
    const btn = betChipButtons[i];

    btn.addEventListener('click', () => {
      alert(btn.id.replace('chip-',''));
    });
  }
 
 
  renderBeadRoad();
  renderBigRoad();
  renderBigEye();
  renderSmallRoad();
  renderCockcroach();
});
