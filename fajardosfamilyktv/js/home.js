(() => {
  const branchViews = Array.from(document.querySelectorAll('.branch-view'));
  const branchMain = document.getElementById('branch-main');
  const branchLaspinas = document.getElementById('branch-laspinas');
  const viewCarousel = document.getElementById('view-carousel');
  const viewGrid = document.getElementById('view-grid');

  const controllers = branchViews.map(setupBranchView);

  function setupBranchView(branchView) {
    const cards = Array.from(branchView.querySelectorAll('.carousel-card'));
    const prevBtn = branchView.querySelector('.carousel-arrow.prev');
    const nextBtn = branchView.querySelector('.carousel-arrow.next');
    let activeIndex = cards.findIndex((c) => c.dataset.pos === 'active');
    if (activeIndex < 0) activeIndex = 0;

    const render = () => {
      cards.forEach((card, i) => {
        const offset = (i - activeIndex + cards.length) % cards.length;
        const pos = offset === 0 ? 'active' : offset === 1 ? 'next' : 'prev';
        card.dataset.pos = pos;
        card.setAttribute('aria-current', pos === 'active' ? 'true' : 'false');
      });
    };

    // .carousel-stage has `perspective` set for the 3D effect, which per
    // spec makes it the containing block for any position:fixed
    // descendant — so a "fullscreen" card would position itself relative
    // to the stage, not the real viewport. Reparenting to <body> while
    // expanded sidesteps that entirely, regardless of what transform/
    // filter/perspective any ancestor has.
    const homes = new WeakMap();

    const expand = (card, index) => {
      activeIndex = index;
      render();
      homes.set(card, { parent: card.parentNode, next: card.nextSibling });
      document.body.appendChild(card);
      card.classList.add('is-fullscreen');
      branchView.classList.add('has-fullscreen');
    };

    const collapseCard = (card) => {
      card.classList.remove('is-fullscreen');
      const home = homes.get(card);
      if (home) {
        home.parent.insertBefore(card, home.next);
        homes.delete(card);
      }
    };

    const collapseFullscreen = () => {
      cards.forEach(collapseCard);
      branchView.classList.remove('has-fullscreen');
    };

    const goTo = (index) => {
      activeIndex = (index + cards.length) % cards.length;
      collapseFullscreen();
      render();
    };

    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (card.classList.contains('is-fullscreen')) {
          collapseFullscreen();
          return;
        }

        const gridMode = viewGrid.checked;
        if (gridMode || i === activeIndex) {
          expand(card, i);
          return;
        }

        goTo(i);
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', () => goTo(activeIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(activeIndex + 1));

    render();
    return { collapseFullscreen };
  }

  const collapseAll = () => controllers.forEach((c) => c.collapseFullscreen());

  const syncBranchVisibility = () => {
    const showLaspinas = branchLaspinas.checked;
    branchViews.forEach((view) => {
      view.hidden = showLaspinas ? view.dataset.branch === 'main' : view.dataset.branch === 'laspinas';
    });
    collapseAll();
  };

  branchMain.addEventListener('change', syncBranchVisibility);
  branchLaspinas.addEventListener('change', syncBranchVisibility);
  viewCarousel.addEventListener('change', collapseAll);
  viewGrid.addEventListener('change', collapseAll);

  // Escape closes whichever card is currently expanded full-screen.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') collapseAll();
  });
})();
