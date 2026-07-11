(() => {
  const wheel = document.getElementById('wheel');
  if (!wheel) return;

  const items = Array.from(wheel.querySelectorAll('.wheel-item'));
  const dots = Array.from(document.querySelectorAll('.wheel-dot'));
  const N = items.length;
  const ANGLE_STEP = 360 / N;
  const ANCHOR = 90; // degrees: 0=top, 90=right (facing the text panel)
  const ACTIVE_SCALE = 2.6;

  const heroEyebrow = document.getElementById('hero-eyebrow');
  const heroTitle1 = document.getElementById('hero-title');
  const heroTitle2 = document.getElementById('hero-title-strong');
  const heroMeta = document.getElementById('hero-meta');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeIndex = items.findIndex((item) => item.classList.contains('active'));
  if (activeIndex < 0) activeIndex = 0;

  // Rotation offset applied to every item's base angle. Kept in sync with
  // the invariant: baseAngle[activeIndex] + rotation === ANCHOR (mod 360).
  let rotation = ANCHOR - activeIndex * ANGLE_STEP;

  const layout = () => {
    items.forEach((item, i) => {
      const angle = i * ANGLE_STEP + rotation;
      const scale = i === activeIndex ? ACTIVE_SCALE : 1;
      item.style.transform =
        `rotate(${angle}deg) translate(0, calc(-1 * var(--wheel-radius))) rotate(${-angle}deg) scale(${scale})`;
    });
    dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
  };

  const applyHeroContent = (item) => {
    heroEyebrow.textContent = item.dataset.eyebrow || '';
    heroTitle1.firstChild.textContent = item.dataset.title1 || '';
    heroTitle2.textContent = item.dataset.title2 || '';
    heroMeta.innerHTML = item.dataset.meta || '';
  };

  const commit = (index) => {
    items[activeIndex].classList.remove('active');
    items[activeIndex].removeAttribute('aria-current');
    items[index].classList.add('active');
    items[index].setAttribute('aria-current', 'true');
    activeIndex = index;
    layout();
    applyHeroContent(items[index]);
  };

  // Spin to an adjacent stop — always turns the same direction the arrow
  // points, so repeated clicks keep the wheel spinning the same way
  // instead of snapping back and forth.
  const advance = (dir) => {
    const nextIndex = (activeIndex + dir + N) % N;
    rotation -= dir * ANGLE_STEP;
    commit(nextIndex);
  };

  // Jump straight to a clicked stop via the shortest rotation.
  const jumpTo = (index) => {
    if (index === activeIndex) return;
    const raw = ANCHOR - (index * ANGLE_STEP + rotation);
    const delta = ((raw + 180) % 360 + 360) % 360 - 180;
    rotation += delta;
    commit(index);
  };

  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      jumpTo(index);
      pauseAutoplay();
    });
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      jumpTo(index);
      pauseAutoplay();
    });
  });

  document.querySelectorAll('.wheel-arrow').forEach((btn) => {
    btn.addEventListener('click', () => {
      advance(Number(btn.dataset.dir));
      pauseAutoplay();
    });
  });

  let autoplayTimer = null;
  let resumeTimer = null;

  const startAutoplay = () => {
    if (prefersReducedMotion) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(() => advance(1), 4500);
  };

  const stopAutoplay = () => {
    if (autoplayTimer) window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  const pauseAutoplay = () => {
    stopAutoplay();
    if (resumeTimer) window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(startAutoplay, 8000);
  };

  wheel.addEventListener('mouseenter', stopAutoplay);
  wheel.addEventListener('mouseleave', startAutoplay);

  layout();
  applyHeroContent(items[activeIndex]);
  startAutoplay();
})();
