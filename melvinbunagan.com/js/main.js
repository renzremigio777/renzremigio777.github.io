// Mobile nav: close the drawer whenever a link inside it is clicked.
(() => {
  const toggle = document.getElementById('menu-toggle');
  if (!toggle) return;

  document.querySelectorAll('.nav-drawer a').forEach((link) => {
    link.addEventListener('click', () => {
      toggle.checked = false;
    });
  });
})();

// Plan cart: lets a visitor "add" one or more plans, then carries the
// selection into the contact form so the inquiry says exactly what
// they're interested in.
const PlanCart = (() => {
  const items = new Map();
  const listeners = [];

  const notify = () => listeners.forEach((fn) => fn(items));

  return {
    onChange(fn) {
      listeners.push(fn);
    },
    toggle(id, name, price) {
      if (items.has(id)) {
        items.delete(id);
      } else {
        items.set(id, { name, price });
      }
      notify();
    },
    remove(id) {
      items.delete(id);
      notify();
    },
    has(id) {
      return items.has(id);
    },
    clear() {
      items.clear();
      notify();
    },
    get size() {
      return items.size;
    },
    entries() {
      return Array.from(items.entries());
    },
  };
})();

(() => {
  const planButtons = document.querySelectorAll('.btn-add-plan');
  const cartFab = document.getElementById('cart-fab');
  const cartFabCount = document.getElementById('cart-fab-count');
  const cartList = document.getElementById('cart-list');
  const selectedPlansField = document.getElementById('selected-plans');

  if (!planButtons.length) return;

  planButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const { planId, planName, planPrice } = btn.dataset;
      PlanCart.toggle(planId, planName, planPrice);
    });
  });

  const renderButtons = () => {
    planButtons.forEach((btn) => {
      const isAdded = PlanCart.has(btn.dataset.planId);
      btn.classList.toggle('is-added', isAdded);
      btn.textContent = isAdded ? 'Added ✓' : 'Add to Package';
      btn.closest('.plan-card')?.classList.toggle('is-selected', isAdded);
    });
  };

  const renderCartFab = () => {
    if (!cartFab || !cartFabCount) return;
    cartFabCount.textContent = PlanCart.size;
    cartFab.classList.toggle('has-items', PlanCart.size > 0);
  };

  const renderCartList = () => {
    if (!cartList) return;
    const entries = PlanCart.entries();

    if (!entries.length) {
      cartList.innerHTML = '<p class="cart-list-empty">No plans selected yet &mdash; browse the plans above and tap &ldquo;Add to Package&rdquo;.</p>';
    } else {
      cartList.innerHTML = entries
        .map(
          ([id, plan]) => `
        <div class="cart-item" data-cart-item="${id}">
          <div>
            <span class="cart-item-name">${plan.name}</span>
            <span class="cart-item-price">${plan.price}</span>
          </div>
          <button type="button" class="cart-item-remove" data-remove-id="${id}" aria-label="Remove ${plan.name}">&times;</button>
        </div>`
        )
        .join('');

      cartList.querySelectorAll('[data-remove-id]').forEach((removeBtn) => {
        removeBtn.addEventListener('click', () => {
          PlanCart.remove(removeBtn.dataset.removeId);
        });
      });
    }

    if (selectedPlansField) {
      selectedPlansField.value = entries.map(([, plan]) => `${plan.name} (${plan.price})`).join(', ');
    }
  };

  PlanCart.onChange(() => {
    renderButtons();
    renderCartFab();
    renderCartList();
  });

  renderButtons();
  renderCartFab();
  renderCartList();

  cartFab?.addEventListener('click', () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  });
})();

// Share widget: renders a QR code for the current full URL (path + hash),
// so scanning it opens the exact page/section the visitor is on.
(() => {
  const fab = document.getElementById('share-fab');
  const panel = document.getElementById('share-panel');
  const closeBtn = document.getElementById('share-panel-close');
  const qrContainer = document.getElementById('share-qr');
  const urlText = document.getElementById('share-url');
  const copyBtn = document.getElementById('share-copy');
  if (!fab || !panel || !qrContainer || typeof qrcode === 'undefined') return;

  const pageUrl = window.location.href;
  urlText.textContent = pageUrl;

  const qr = qrcode(0, 'M');
  qr.addData(pageUrl);
  qr.make();
  qrContainer.innerHTML = qr.createSvgTag({ scalable: true });

  const closePanel = () => {
    panel.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
  };

  fab.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('is-open');
    fab.setAttribute('aria-expanded', String(isOpen));
  });

  closeBtn?.addEventListener('click', closePanel);

  document.addEventListener('click', (event) => {
    if (panel.classList.contains('is-open') && !panel.contains(event.target) && !fab.contains(event.target)) {
      closePanel();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePanel();
  });

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      copyBtn.textContent = 'Copied!';
    } catch (err) {
      copyBtn.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy Link'; }, 1800);
  });
})();

// Hero QR card: same idea as the share widget, but a small always-visible
// "scan me" card pinned to the hero visual, with its own pop animation.
(() => {
  const heroQr = document.getElementById('hero-qr');
  if (!heroQr || typeof qrcode === 'undefined') return;

  const qr = qrcode(0, 'M');
  qr.addData(window.location.href);
  qr.make();
  heroQr.innerHTML = qr.createSvgTag({ scalable: true });
})();

// Hero quick-start form: carries the phone number straight into the
// contact form instead of collecting it twice.
(() => {
  const heroForm = document.getElementById('hero-quickstart');
  if (!heroForm) return;

  heroForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const phone = heroForm.querySelector('input[name="hero-phone"]').value;
    const contactPhone = document.getElementById('inquiry-phone');
    if (contactPhone && phone) contactPhone.value = phone;

    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('inquiry-name')?.focus({ preventScroll: true });
  });
})();

// Contact / checkout form submission.
(() => {
  const form = document.getElementById('inquiry-form');
  const status = document.getElementById('inquiry-status');
  if (!form || !status) return;

  let snackbarTimer;
  const showSnackbar = (message, variant) => {
    clearTimeout(snackbarTimer);
    status.textContent = message;
    status.className = 'form-status is-visible' + (variant ? ` is-${variant}` : '');
    snackbarTimer = setTimeout(() => {
      status.classList.remove('is-visible');
    }, 6000);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    showSnackbar('Sending your inquiry...');

    try {
      // TODO: swap this simulated delay for the real inquiry endpoint, e.g.:
      // const res = await fetch('/api/inquiries', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // if (!res.ok) throw new Error('Request failed');
      await new Promise((resolve) => setTimeout(resolve, 900));

      const planNote = data['selected-plans']
        ? ` We'll follow up about: ${data['selected-plans']}.`
        : '';
      showSnackbar(`Thanks, ${data.name.split(' ')[0]}! Your inquiry has been sent — we'll reply to ${data.email} shortly.${planNote}`, 'success');
      form.reset();
      PlanCart.clear();
    } catch (err) {
      showSnackbar('Something went wrong. Please try again in a moment.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
