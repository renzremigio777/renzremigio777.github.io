(() => {
  const branchView = document.querySelector('.branch-view');
  const viewCarousel = document.getElementById('view-carousel');
  const viewGrid = document.getElementById('view-grid');

  const cards = Array.from(branchView.querySelectorAll('.carousel-card'));
  const track = branchView.querySelector('.carousel-track');
  const prevBtn = branchView.querySelector('.carousel-arrow.prev');
  const nextBtn = branchView.querySelector('.carousel-arrow.next');
  let activeIndex = cards.findIndex((c) => c.dataset.pos === 'active');
  if (activeIndex < 0) activeIndex = 0;
  let didDrag = false;

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
      if (didDrag) {
        didDrag = false;
        return;
      }

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

  // Touch/mouse drag-to-swipe. A single pointer type (Pointer Events)
  // covers mouse, touch and pen. Only active in carousel mode with
  // nothing expanded — grid layout and fullscreen cards don't have the
  // stacked active/next/prev positions this swipe logic reasons about.
  const DRAG_INTENT_PX = 10; // movement before we commit to horizontal vs. vertical
  const SWIPE_PX = 50; // movement required to actually change slides
  let drag = null;

  const canDrag = () => !viewGrid.checked && !branchView.classList.contains('has-fullscreen');

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!canDrag()) return;
    drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, horizontal: false };
  };

  const onPointerMove = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.dx = dx;

    if (!drag.horizontal) {
      if (Math.abs(dx) < DRAG_INTENT_PX && Math.abs(dy) < DRAG_INTENT_PX) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        drag = null; // vertical intent — leave it to page scroll
        return;
      }
      drag.horizontal = true;
      didDrag = true;
      track.classList.add('is-dragging');
      track.setPointerCapture(drag.pointerId);
    }

    event.preventDefault();
  };

  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { dx, horizontal } = drag;
    if (track.hasPointerCapture(drag.pointerId)) track.releasePointerCapture(drag.pointerId);
    track.classList.remove('is-dragging');
    drag = null;

    if (horizontal && Math.abs(dx) > SWIPE_PX) {
      goTo(activeIndex + (dx < 0 ? 1 : -1));
    }
  };

  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointermove', onPointerMove);
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  const collapseAll = () => collapseFullscreen();
  viewCarousel.addEventListener('change', collapseAll);
  viewGrid.addEventListener('change', collapseAll);

  // Escape closes whichever card is currently expanded full-screen.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') collapseFullscreen();
  });

  render();
})();
