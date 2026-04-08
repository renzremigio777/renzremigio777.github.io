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
  function renderFourRoad() {
    const fourRode = document.querySelector('svg#fourroad');
    fourRode.setAttribute('viewBox', `0 0 ${wrapperWidth} ${wrapperHeight}`);

    const whiteBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    whiteBg.setAttribute('width', wrapperWidth);
    whiteBg.setAttribute('height', wrapperHeight);
    whiteBg.setAttribute('x', '0');
    whiteBg.setAttribute('y', '0');
    whiteBg.setAttribute('rx', '4');
    whiteBg.setAttribute('ry', '4');
    whiteBg.setAttribute('fill', '#ffffff');
    fourRode.appendChild(whiteBg)

    const columnCount = 26, rowCount = 6, cellSize = 20;
    for (let x = 0; x <= columnCount; x++) {
      const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vLine.setAttribute('x1', x * cellSize);
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', x * cellSize);
      vLine.setAttribute('y2', wrapperHeight);
      // vLine.setAttribute('style', 'stroke:#000; stroke-width: 0.1px;');
      vLine.classList.add('grid-line');
      fourRode.appendChild(vLine);
    }
    for (let y = 0; y <= rowCount; y++) {
      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', y * cellSize);
      hLine.setAttribute('x2', wrapperWidth);
      hLine.setAttribute('y2', y * cellSize);
      // hLine.setAttribute('style', 'stroke:#000; stroke-width: 0.1px;');
      hLine.classList.add('grid-line');
      fourRode.appendChild(hLine);
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
  renderFourRoad();
});
