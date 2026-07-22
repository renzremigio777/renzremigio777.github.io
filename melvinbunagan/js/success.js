(() => {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  const email = params.get('email');
  const plans = params.get('plans');

  const heading = document.getElementById('success-heading');
  const message = document.getElementById('success-message');
  const plansWrap = document.getElementById('success-plans');
  const plansList = document.getElementById('success-plans-list');

  if (name && heading) {
    heading.textContent = `Thank You, ${name.split(' ')[0]}!`;
  }

  if (email && message) {
    message.textContent = `Your inquiry has been sent — I'll reply to ${email} within 24 hours.`;
  }

  if (plans && plansWrap && plansList) {
    plansList.textContent = plans;
    plansWrap.hidden = false;
  }
})();
