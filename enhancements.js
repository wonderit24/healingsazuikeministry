(() => {
  const paymentUrl = 'https://monnify-payment-page.monnify.com/share/sRFyli';
  const formUrl = 'https://docs.google.com/forms/d/1joi1pEdWFEMMnFjy4jm4RPYQiVu8iJmjVrpIs7nw8tM/viewform';
  const ffcCard = '<article class="event-card" data-event-status="upcoming" data-enhanced-ffc><span class="event-badge">Coming soon</span><h3>FFC</h3><p>FFC is coming soon. Event details and registration information will be announced here.</p><a class="text-link" href="?page=event&amp;slug=ffc">Event details →</a></article>';
  const currentPage = new URLSearchParams(location.search).get('page') || 'home';

  if (currentPage === 'event') {
    document.body.className = 'page-event';
    document.querySelector('#main').innerHTML = '<div class="page-shell"><section class="page-hero"><div class="eyebrow">Event information</div><h1 class="page-heading">Event details</h1></section><article class="event-detail" id="event-content"><p>Loading event information…</p></article></div>';
    const slug = new URLSearchParams(location.search).get('slug');
    fetch('/content/events.json', { cache: 'no-cache' }).then((response) => response.ok ? response.json() : null).then((data) => {
      const item = data?.events?.find((event) => event.slug === slug && event.published);
      const target = document.querySelector('#event-content');
      if (!target || !item) return;
      target.replaceChildren();
      const badge = document.createElement('span');
      badge.className = 'event-badge';
      badge.textContent = item.badge || (item.date ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(item.date)) : 'Coming soon');
      const title = document.createElement('h2');
      title.textContent = item.title;
      const description = document.createElement('p');
      description.textContent = item.description || '';
      target.append(badge, title, description);
      const details = document.createElement('dl');
      const eventDate = item.date && !Number.isNaN(new Date(item.date).valueOf())
        ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(item.date))
        : 'To be announced';
      [['Date', eventDate], ['Venue', item.venue || 'To be announced'], ['Registration', item.registrationUrl || 'Details to be announced']].forEach(([label, value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        term.textContent = label;
        const detail = document.createElement('dd');
        if (label === 'Registration' && /^https:\/\//i.test(value)) {
          const registration = document.createElement('a');
          registration.href = value;
          registration.target = '_blank';
          registration.rel = 'noopener noreferrer';
          registration.textContent = 'Register ↗';
          detail.append(registration);
        } else detail.textContent = value;
        row.append(term, detail);
        details.append(row);
      });
      target.append(details);
      const contact = document.createElement('a');
      contact.className = 'button-primary';
      contact.href = '?page=contact';
      contact.textContent = 'Ask about this programme ↗';
      target.append(contact);
    }).catch(() => {});
  }

  const heroImage = document.querySelector('.hero-media-image img');
  if (heroImage) {
    heroImage.src = 'public/images/healings-conversation-portrait-cutout.png';
    heroImage.alt = 'Healings Erhuvwuigho Azuike seated in a navy suit portrait';
  }

  document.querySelectorAll('a[href="/admin/"], a[href="/admin"]').forEach((link) => link.remove());
  document.querySelectorAll('.footer-col a[href="?page=mentorship"]').forEach((link) => { link.textContent = 'Mentorship'; });

  const homeEvents = [...document.querySelectorAll('.page-home .section-wrap')].find((section) => section.textContent.includes('Upcoming events'));
  if (homeEvents && !homeEvents.querySelector('[data-enhanced-ffc]')) {
    const grid = document.createElement('div');
    grid.className = 'compact-grid';
    grid.dataset.homeUpcomingFallback = '';
    grid.innerHTML = ffcCard;
    const placeholder = homeEvents.querySelector('.empty-state');
    if (placeholder) placeholder.replaceWith(grid);
    else homeEvents.insertBefore(grid, homeEvents.querySelector('.button-primary'));
  }

  const eventGrid = document.querySelector('#events-list');
  if (eventGrid && !eventGrid.querySelector('[data-enhanced-ffc]')) eventGrid.insertAdjacentHTML('beforeend', ffcCard);

  if (document.body.classList.contains('page-partnerships')) {
    const hero = document.querySelector('.page-partnerships .page-hero');
    if (hero && !document.querySelector('.partnership-support')) {
      const section = document.createElement('section');
      section.className = 'partnership-support';
      section.innerHTML = `<div><span class="feature-kicker">Partnership platform</span><h2>Partner with the ministry</h2><p>Your partnership supports the ministry’s work of building people and preserving generations. Contribute securely through Monnify.</p><a class="button-primary" data-partnership-payment-link href="${paymentUrl}" target="_blank" rel="noopener noreferrer">Partner through Monnify <span aria-hidden="true">↗</span></a></div><a class="partnership-qr-link" data-partnership-payment-link href="${paymentUrl}" target="_blank" rel="noopener noreferrer"><img src="public/images/healings-partnership-monnify-qr.jpeg" alt="Scan the Monnify QR code to partner with Healings Erhuvwuigho Azuike Ministry" loading="lazy"><span>Scan to partner securely with Monnify</span></a>`;
      hero.insertAdjacentElement('afterend', section);
    }
  }

  const mentorship = document.querySelector('.mentorship-intro');
  if (mentorship) {
    const link = mentorship.querySelector('a.button-primary');
    if (link) {
      link.href = formUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.dataset.mentorshipFormLink = '';
    }
    if (!mentorship.querySelector('.mentorship-form-frame')) {
      const frame = document.createElement('div');
      frame.className = 'mentorship-form-frame';
      frame.innerHTML = `<iframe data-mentorship-form-frame src="${formUrl}?embedded=true" title="MENTORSHIP membership application form" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      const warning = mentorship.querySelector('.notice');
      if (warning) warning.replaceWith(frame);
      else if (link) link.insertAdjacentElement('beforebegin', frame);
      const fallback = document.createElement('p');
      fallback.textContent = 'If the form does not load here, open the application directly. Public applications require responder access to be enabled in the form settings.';
      frame.insertAdjacentElement('afterend', fallback);
    }
  }

  const updateBadgeLabels = () => {
    document.querySelectorAll('.event-card[data-event-status="upcoming"] .event-badge').forEach((badge) => {
      if (/date to be announced/i.test(badge.textContent)) badge.textContent = 'Coming soon';
    });
  };
  updateBadgeLabels();
  new MutationObserver(updateBadgeLabels).observe(document.body, { childList: true, subtree: true });

  fetch('/content/site.json', { cache: 'no-cache' }).then((response) => response.ok ? response.json() : null).then((settings) => {
    if (settings?.fullName) document.querySelectorAll('.brand-logo').forEach((image) => { image.alt = settings.fullName; });
    if (settings?.roles) {
      const roles = settings.roles.replace(/\s*\|\s*/g, ' · ').toUpperCase();
      document.querySelectorAll('.brand-roles').forEach((label) => { label.textContent = roles; });
    }
    const configuredPayment = settings?.partnershipPaymentUrl;
    if (typeof configuredPayment === 'string' && configuredPayment.startsWith('https://')) {
      document.querySelectorAll('[data-partnership-payment-link]').forEach((link) => { link.href = configuredPayment; });
    }
    const configuredForm = settings?.mentorshipFormUrl;
    if (typeof configuredForm === 'string' && configuredForm.startsWith('https://')) {
      document.querySelectorAll('[data-mentorship-form-link]').forEach((link) => { link.href = configuredForm; });
      const frame = document.querySelector('[data-mentorship-form-frame]');
      if (frame) frame.src = `${configuredForm}${configuredForm.includes('?') ? '&' : '?'}embedded=true`;
    }
  }).catch(() => {});
})();
