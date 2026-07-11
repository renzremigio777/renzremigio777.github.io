(() => {
  const sections = {
    ryw: document.querySelector('#ramenyoungwasabi iframe'),
    ktv: document.querySelector('#fajardosfamilyktv iframe'),
  };

  if (!sections.ryw || !sections.ktv) return;

  const ratios = { ryw: 0, ktv: 0 };

  const applyBodyState = () => {
    if (ratios.ryw === 0 && ratios.ktv === 0) {
      document.body.classList.remove('ryw', 'ktv');
    } else if (ratios.ryw >= ratios.ktv) {
      document.body.classList.add('ryw');
      document.body.classList.remove('ktv');
    } else {
      document.body.classList.add('ktv');
      document.body.classList.remove('ryw');
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const key = entry.target === sections.ryw ? 'ryw' : 'ktv';
      ratios[key] = entry.isIntersecting ? entry.intersectionRatio : 0;
    });
    applyBodyState();
  }, {
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
  });

  observer.observe(sections.ryw);
  observer.observe(sections.ktv);

  // When a user scrolls inside an iframe and hits the top/bottom boundary,
  // forward the remaining finger movement to the parent page so the page
  // keeps scrolling naturally on mobile.
  function bridgeIframeScroll(iframe) {
    const attach = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        let lastY = 0;
        doc.addEventListener('touchstart', (e) => {
          lastY = e.touches[0].clientY;
        }, { passive: true });
        doc.addEventListener('touchmove', (e) => {
          const scroller = doc.scrollingElement || doc.documentElement;
          const currentY = e.touches[0].clientY;
          const dy = lastY - currentY; // positive = finger moved up = scroll down
          lastY = currentY;
          const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
          const atTop = scroller.scrollTop <= 0;
          if ((dy > 0 && atBottom) || (dy < 0 && atTop)) {
            window.scrollBy(0, dy);
          }
        }, { passive: true });
      } catch (_) {}
    };
    const loaded = iframe.contentDocument && iframe.contentDocument.readyState === 'complete';
    if (loaded) { attach(); } else { iframe.addEventListener('load', attach); }
  }
  [sections.ryw, sections.ktv].forEach(bridgeIframeScroll);

  // Minimize the header once the hero section is scrolled out of view
  // (i.e. as soon as the About section is reached), and restore it when
  // the hero comes back into view. A single stable boundary (instead of
  // competing intersection ratios) keeps the shrink/grow transition smooth.
  const hero = document.querySelector('#top');
  if (hero) {
    const heroObserver = new IntersectionObserver((entries) => {
      document.body.classList.toggle('compact', !entries[0].isIntersecting);
    }, {
      threshold: 0,
    });
    heroObserver.observe(hero);
  }
})();

(() => {
  const form = document.getElementById('inquiry-form');
  const status = document.getElementById('inquiry-status');
  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Sending...';

    try {
      // TODO: swap this simulated delay for the real inquiry endpoint once
      // the server-side API exists, e.g.:
      // const res = await fetch('/api/inquiries', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // if (!res.ok) throw new Error('Request failed');
      await new Promise((resolve) => setTimeout(resolve, 900));

      status.textContent = `Thanks, ${data.name.split(' ')[0]}! Your inquiry has been sent — we'll reply to ${data.email} shortly.`;
      status.classList.add('is-success');
      form.reset();
    } catch (err) {
      status.textContent = 'Something went wrong. Please try again in a moment.';
      status.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
