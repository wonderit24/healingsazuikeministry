const SITE_CONTENT = '/content/';

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function safeURL(value, allowMail = false) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value, location.origin);
    if (url.origin === location.origin && url.pathname.startsWith('/') && !url.pathname.startsWith('//')) return `${url.pathname}${url.search}${url.hash}`;
    if (url.protocol === 'https:' || (allowMail && url.protocol === 'mailto:')) return url.href;
  } catch { return ''; }
  return '';
}

function safeImage(value) {
  const url = safeURL(value);
  return url.startsWith('/public/images/') ? url : '';
}

function richText(value = '') {
  return String(value).split(/\n\s*\n/).map((paragraph) => {
    const safe = escapeHTML(paragraph.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
    if (/^## /.test(paragraph.trim())) return `<h2>${escapeHTML(paragraph.trim().slice(3))}</h2>`;
    return safe ? `<p>${safe}</p>` : '';
  }).join('');
}

async function readContent(filename) {
  try {
    const response = await fetch(`${SITE_CONTENT}${filename}`, { cache: 'no-cache' });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function slugify(value) {
  return String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function articleCard(item) {
  const slug = slugify(item.slug || item.title);
  const date = formatDate(item.date);
  const category = escapeHTML(item.category || 'Life Lessons and Reflections');
  return `<article class="content-card article-category published-article" data-category="${category}" data-search="${escapeHTML(`${item.title} ${category} ${item.summary || ''}`.toLowerCase())}"><span class="card-topline">${category}${date ? ` · ${date}` : ''}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.summary || '')}</p><a class="text-link" href="?page=article&amp;slug=${encodeURIComponent(slug)}">Read article →</a></article>`;
}

function eventStatus(item) {
  if (item.status === 'upcoming' || item.status === 'past') return item.status;
  const date = item.date ? new Date(item.date) : null;
  if (!date || Number.isNaN(date.valueOf())) return 'unconfirmed';
  return date.getTime() >= Date.now() ? 'upcoming' : 'past';
}

function eventCard(item) {
  const slug = slugify(item.slug || item.title);
  const date = formatDate(item.date);
  const image = safeImage(item.image);
  const registration = safeURL(item.registrationUrl);
  const category = item.category || item.programme || '';

  return `<article class="event-card" data-event-status="${eventStatus(item)}" data-event-category="${escapeHTML(category)}">${image ? `<img class="event-cover" src="${image}" alt="${escapeHTML(item.title)} event" loading="lazy">` : ''}<span class="event-badge">${date || 'Date to be announced'}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description || '')}</p>${item.venue ? `<p class="event-detail-line">${escapeHTML(item.venue)}</p>` : ''}${registration ? `<a class="text-link" href="${registration}" target="_blank" rel="noopener noreferrer">Registration information ↗</a>` : ''}<a class="text-link" href="?page=event&amp;slug=${encodeURIComponent(slug)}">Event details →</a></article>`;
}

function bookCard(item, index) {
  const cover = safeImage(item.cover);
  const purchase = safeURL(item.purchaseUrl);
  const status = escapeHTML(item.status || 'Catalogue entry');
  return `<article class="book-card" data-title="${escapeHTML(String(item.title || '').toLowerCase())}">${cover ? `<img class="book-cover" src="${cover}" alt="Cover of ${escapeHTML(item.title)}" loading="lazy">` : `<span class="book-index">${String(index + 1).padStart(2, '0')}</span>`}<h3>${escapeHTML(item.title)}</h3>${item.description ? `<p>${escapeHTML(item.description)}</p>` : '<p>Description and publication details to be confirmed.</p>'}${item.audience ? `<p class="book-audience">For: ${escapeHTML(item.audience)}</p>` : ''}<span class="content-status">${status}</span>${purchase ? `<a class="text-link" href="${purchase}" target="_blank" rel="noopener noreferrer">Purchase this title ↗</a>` : ''}</article>`;
}

function mediaCard(item, index) {
  const type = escapeHTML(item.type || 'Media');
  const category = ({ 'Video teaching': 'Teaching and preaching', 'Sermon or message': 'Teaching and preaching', Interview: 'Interviews', 'Podcast episode': 'Podcast episodes', 'Television appearance': 'Television appearances', 'Event highlight': 'Event highlights', 'Featured conversation': 'Heart-to-Heart Conversations', 'Photo gallery': 'Photo gallery' })[item.type] || item.type || 'Interviews';
  const image = safeImage(item.image);
  const videoId = /^[\w-]{11}$/.test(item.youtubeId || '') ? item.youtubeId : '';
  const url = safeURL(item.url);
  return `<article class="media-card" data-media-category="${escapeHTML(category)}">${image ? `<img class="media-cover" src="${image}" alt="${escapeHTML(item.title)}" loading="lazy">` : `<span class="book-index">${String(index + 1).padStart(2, '0')}</span>`}<span class="card-topline">${type}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description || '')}</p>${videoId ? `<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="${escapeHTML(item.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : ''}${url ? `<a class="text-link" href="${url}" target="_blank" rel="noopener noreferrer">Open media ↗</a>` : ''}</article>`;
}

function applySiteContent(content) {
  if (!content) return;
  if (content.fullName) {
    document.querySelectorAll('.wordmark-name').forEach((item) => { item.firstChild.textContent = content.fullName.toUpperCase(); });
  }
  if (content.roles) document.querySelectorAll('.wordmark-name small, .hero-home .eyebrow, .hero-media-caption span').forEach((item) => { item.textContent = content.roles.replace(/\s*\|\s*/g, ' · ').toUpperCase(); });
  const homeParagraphs = document.querySelectorAll('.page-home .hero-description');
  if (content.homeIntroduction && homeParagraphs[0]) homeParagraphs[0].textContent = content.homeIntroduction;
  if (content.homeMission && homeParagraphs[1]) homeParagraphs[1].textContent = content.homeMission;
  const biography = document.querySelector('#about-biography');
  if (content.biography && biography) biography.innerHTML = richText(content.biography);
  const audioLink = document.querySelector('#audio-messages a[href*="t.me"]');
  if (audioLink && safeURL(content.audioMessagesUrl)) audioLink.href = safeURL(content.audioMessagesUrl);
  if (page === 'partnerships' && safeURL(content.partnershipPaymentUrl)) {
    const hero = document.querySelector('.page-partnerships .page-hero');
    if (hero && !document.querySelector('.partnership-support')) {
      const paymentUrl = safeURL(content.partnershipPaymentUrl);
      hero.insertAdjacentHTML('afterend', `<section class="partnership-support"><div><span class="feature-kicker">Partnership platform</span><h2>Partner with the ministry</h2><p>Your partnership supports the ministry’s work of building people and preserving generations. Pay securely through Monnify or scan the QR code.</p><a class="button-primary" href="${paymentUrl}" target="_blank" rel="noopener noreferrer">Partner through Monnify <span aria-hidden="true">↗</span></a></div><a class="partnership-qr-link" href="${paymentUrl}" target="_blank" rel="noopener noreferrer"><img src="public/images/healings-partnership-monnify-qr.jpeg" alt="Scan the Monnify QR code to partner with Healings Erhuvwuigho Azuike Ministry" loading="lazy"><span>Scan to partner securely with Monnify</span></a></section>`);
    }
  }
  document.querySelectorAll('.content-card').forEach((item) => {
    const label = item.querySelector('.card-topline')?.textContent.trim();
    if (label === 'VISION' && content.vision) item.querySelector('p').textContent = content.vision;
    if (label === 'MISSION' && content.mission) item.querySelector('p').textContent = content.mission;
  });
  const contactDetails = document.querySelector('.contact-details');
  if (contactDetails && (content.publicEmail || content.publicPhone)) {
    const note = contactDetails.querySelector('.notice');
    if (note) {
      note.innerHTML = [content.publicEmail ? `<a href="mailto:${encodeURIComponent(content.publicEmail)}">${escapeHTML(content.publicEmail)}</a>` : '', content.publicPhone ? `<a href="tel:${encodeURIComponent(content.publicPhone)}">${escapeHTML(content.publicPhone)}</a>` : ''].filter(Boolean).join('<br>');
    }
  }
  const extraPages = (window.cmsPages || []).filter((item) => item.published && item.title && item.menuLabel).map((item) => ({ label: item.menuLabel, url: `?page=custom&slug=${encodeURIComponent(slugify(item.slug || item.title))}` }));
  const navItems = [...(content.navigation || []), ...extraPages].filter((item) => item.label && safeURL(item.url));
  const menu = document.querySelector('.nav-dropdown-menu');
  if (menu && navItems.length) {
    menu.innerHTML = navItems.map((item) => {
      const url = safeURL(item.url);
      const external = new URL(url, location.origin).origin !== location.origin;
      return `<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHTML(item.label)}</a>`;
    }).join('');
    menu.querySelectorAll('a').forEach((link) => {
      const target = new URL(link.href, location.href).searchParams.get('page');
      if (target === page) link.classList.add('active');
    });
  }
}

function applyBooks(data) {
  if (!Array.isArray(data?.books) || data.books.length === 0) return;
  const books = data.books.filter((item) => item.title);
  const grid = document.querySelector('#book-grid');
  if (grid) grid.innerHTML = books.map(bookCard).join('');
  const featuredGrid = [...document.querySelectorAll('.page-home .section-wrap')].find((section) => section.textContent.includes('Books & publications'))?.querySelector('.compact-grid');
  if (featuredGrid) {
    const featured = books.filter((item) => item.featured);
    featuredGrid.innerHTML = (featured.length ? featured : books).slice(0, 3).map(bookCard).join('');
    const notice = featuredGrid.nextElementSibling;
    if (notice?.classList.contains('notice')) notice.hidden = true;
  }
  const growthHeading = [...document.querySelectorAll('#main h2.section-divider')].find((heading) => heading.textContent.trim() === 'Growth Diet');
  const resourceGrid = growthHeading?.nextElementSibling?.nextElementSibling;
  const resources = Array.isArray(data.growthDietResources) ? data.growthDietResources : [];
  if (resourceGrid?.matches('.compact-grid') && resources.length) {
    resourceGrid.innerHTML = resources.map((item) => {
      const url = safeURL(item.url);
      const file = safeImage(item.file);
      return `<article class="content-card"><span class="card-topline">GROWTH DIET RESOURCE</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description || 'A resource for spiritual and personal growth.')}</p>${url ? `<a class="text-link" href="${url}" target="_blank" rel="noopener noreferrer">Open resource ↗</a>` : ''}${file ? `<a class="text-link" href="${file}" download>Download resource ↓</a>` : ''}</article>`;
    }).join('');
  }
  const freeHeading = [...document.querySelectorAll('#main h2.section-divider')].find((heading) => heading.textContent.trim() === 'Free resources');
  const freeResources = Array.isArray(data.freeResources) ? data.freeResources : [];
  const freeNotice = freeHeading?.nextElementSibling;
  if (freeNotice?.classList.contains('empty-state') && freeResources.length) {
    freeNotice.outerHTML = `<div class="compact-grid">${freeResources.map((item) => {
      const file = safeImage(item.file);
      return `<article class="content-card"><span class="card-topline">FREE RESOURCE</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description || '')}</p>${item.audience ? `<p>For: ${escapeHTML(item.audience)}</p>` : ''}${file ? `<a class="text-link" href="${file}" download>Download resource ↓</a>` : ''}</article>`;
    }).join('')}</div>`;
  }
}

function applyArticles(data) {
  const articles = (data?.articles || []).filter((item) => item.published && item.title);
  const categories = document.querySelector('#article-categories');
  if (categories && articles.length) {
    categories.innerHTML = [...articles].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).map(articleCard).join('');
    const notice = categories.nextElementSibling;
    if (notice?.classList.contains('notice')) notice.hidden = true;
  }
  const empty = document.querySelector('#main .notice');
  if (empty && page === 'articles' && articles.length) empty.hidden = true;
  if (page === 'article') {
    const slug = new URLSearchParams(location.search).get('slug');
    const item = articles.find((entry) => slugify(entry.slug || entry.title) === slug);
    const target = document.querySelector('#article-content');
    if (!item) {
      document.title = 'Article not found | Healings E. Azuike';
      if (target) target.innerHTML = '<p>This article is unavailable or has not been published.</p><a class="text-link" href="?page=articles">← All articles</a>';
      return;
    }
    document.title = `${item.title} | Healings E. Azuike`;
    if (target) target.innerHTML = `<span class="card-topline">${escapeHTML(item.category || '')}${formatDate(item.date) ? ` · ${formatDate(item.date)}` : ''}</span><h2>${escapeHTML(item.title)}</h2>${item.summary ? `<p class="article-summary">${escapeHTML(item.summary)}</p>` : ''}<div class="article-body">${richText(item.body || '')}</div>${Array.isArray(item.relatedResources) && item.relatedResources.length ? `<h3>Related resources</h3><div class="outbound-list">${item.relatedResources.map((link) => { const url = safeURL(link); return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Related resource ↗</a>` : ''; }).join('')}</div>` : ''}<button class="button-secondary" type="button" data-share-page>Share this article ↗</button><p><a class="text-link" href="?page=articles">← All articles</a></p>`;
    target?.querySelector('[data-share-page]')?.addEventListener('click', async (event) => {
      try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); event.currentTarget.textContent = 'Link copied'; } } catch (error) { if (error.name !== 'AbortError') event.currentTarget.textContent = 'Copy the page URL to share'; }
    });
  }
  const homeSection = [...document.querySelectorAll('.page-home .section-wrap')].find((section) => section.textContent.includes('Latest articles & teachings'));
  if (homeSection) {
    const featured = [...articles].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).filter((item) => item.featured).slice(0, 3);
    const latest = featured.length ? featured : [...articles].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 3);
    const placeholder = homeSection.querySelector('.empty-state');
    if (placeholder && latest.length) placeholder.outerHTML = `<div class="compact-grid">${latest.map(articleCard).join('')}</div>`;
  }
}

function applyEvents(data) {
  const events = (data?.events || []).filter((item) => item.published && item.title);
  const grid = document.querySelector('#events-list');
  if (grid && events.length) {
    grid.innerHTML = [...events].sort((a, b) => new Date(a.date || '9999-12-31') - new Date(b.date || '9999-12-31')).map(eventCard).join('');
    const notice = grid.nextElementSibling?.nextElementSibling;
    if (notice?.classList.contains('notice')) notice.hidden = true;
  }
  const empty = document.querySelector('#event-empty');
  if (empty && events.length === 0) empty.hidden = true;
  if (page === 'event') {
    const slug = new URLSearchParams(location.search).get('slug');
    const item = events.find((entry) => slugify(entry.slug || entry.title) === slug);
    const target = document.querySelector('#event-content');
    if (!item) {
      document.title = 'Event information | Healings E. Azuike';
      if (target) target.innerHTML = '<p>Event information has not been published yet.</p><a class="text-link" href="?page=events">← All events</a>';
      return;
    }
    document.title = `${item.title} | Healings E. Azuike`;
    const image = safeImage(item.image);
    const registration = safeURL(item.registrationUrl);
  const category = item.category || item.programme || '';

    if (target) target.innerHTML = `<span class="event-badge">${formatDate(item.date) || 'Date to be announced'}</span><h2>${escapeHTML(item.title)}</h2>${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}<dl><div><dt>Date</dt><dd>${formatDate(item.date) || 'To be announced'}</dd></div><div><dt>Venue</dt><dd>${escapeHTML(item.venue || 'To be announced')}</dd></div><div><dt>Registration</dt><dd>${registration ? `<a href="${registration}" target="_blank" rel="noopener noreferrer">Register ↗</a>` : 'Details to be announced'}</dd></div></dl>${image ? `<img class="event-detail-image" src="${image}" alt="${escapeHTML(item.title)}" loading="lazy">` : ''}${item.highlights ? `<div class="article-body">${richText(item.highlights)}</div>` : ''}<a class="button-primary" href="?page=contact">Ask about this programme <span aria-hidden="true">↗</span></a><p><a class="text-link" href="?page=events">← All events</a></p>`;
  }
  const upcomingSection = [...document.querySelectorAll('.page-home .section-wrap')].find((item) => item.textContent.includes('Upcoming events'));
  const upcoming = events.filter((item) => eventStatus(item) === 'upcoming').slice(0, 3);
  if (upcomingSection && upcoming.length) {
    upcomingSection.querySelector('.empty-state')?.replaceWith(Object.assign(document.createElement('div'), { className: 'compact-grid', innerHTML: upcoming.map(eventCard).join('') }));
  }
}

function applyMedia(data) {
  const items = (data?.items || []).filter((item) => item.published && item.title);
  const grid = document.querySelector('#media-library');
  if (grid && items.length) {
    grid.innerHTML = items.map(mediaCard).join('');
    const notice = grid.nextElementSibling?.nextElementSibling;
    if (notice?.classList.contains('notice')) notice.hidden = true;
  }
}

function applyTestimonials(data) {
  const testimonials = (data?.testimonials || []).filter((item) => item.approved && item.quote);
  const pageCard = document.querySelector('.testimonial-empty');
  if (pageCard && testimonials.length) pageCard.outerHTML = `<div class="testimonial-grid">${testimonials.map((item) => `<blockquote class="testimonial-card"><p>“${escapeHTML(item.quote)}”</p><cite>${escapeHTML(item.name || '')}${item.source ? ` · ${escapeHTML(item.source)}` : ''}</cite></blockquote>`).join('')}</div>`;
  const featured = testimonials.filter((item) => item.featured).slice(0, 3);
  const homeRoot = document.querySelector('.page-home');
  if (homeRoot && featured.length) {
    const section = document.createElement('section');
    section.className = 'section-wrap home-testimonials';
    section.innerHTML = `<div class="section-top"><div><div class="eyebrow">Words from the community</div><h2 class="section-heading">Stories of <em>growth.</em></h2></div><a class="text-link" href="?page=testimonials">Read testimonials →</a></div><div class="testimonial-grid">${featured.map((item) => `<blockquote class="testimonial-card"><p>“${escapeHTML(item.quote)}”</p><cite>${escapeHTML(item.name || '')}${item.source ? ` · ${escapeHTML(item.source)}` : ''}</cite></blockquote>`).join('')}</div>`;
    homeRoot.append(section);
  }
}

function applyDirectories(data) {
  const entries = (data?.ministries || []).filter((item) => item.name);
  const ministriesGrid = document.querySelector('.page-ministries .content-grid');
  const ministries = entries.filter((item) => item.type === 'Ministry');
  if (ministriesGrid && ministries.length) ministriesGrid.innerHTML = ministries.map((item) => {
    const slug = /teens aflame/i.test(item.name) ? 'tanm' : /campus/i.test(item.name) ? 'campus' : 'heam';
    return `<a class="content-card content-card-link" href="?page=${slug}"><span class="card-topline">MINISTRY</span><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.summary || '')}</p><span class="pathway-arrow" aria-hidden="true">↗</span></a>`;
  }).join('');
  const platformsGrid = document.querySelector('.page-platforms .content-grid');
  const platforms = entries.filter((item) => item.type === 'Platform');
  const renderPlatform = (item, child = false) => {
    const url = safeURL(item.url);
    return `<article class="content-card"><span class="card-topline">${child ? `PART OF ${escapeHTML(item.parent)}` : 'PLATFORM'}</span><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.summary || '')}</p>${item.body ? `<p>${escapeHTML(item.body)}</p>` : ''}${url ? `<a class="text-link" href="${url}" target="_blank" rel="noopener noreferrer">${item.name === 'Partnership platform' ? 'Partner through Monnify ↗' : 'Visit platform ↗'}</a>` : ''}</article>`;
  };
  if (platformsGrid && platforms.length) {
    const roots = platforms.filter((item) => !item.parent);
    platformsGrid.outerHTML = roots.map((item) => {
      const children = platforms.filter((child) => child.parent === item.name);
      return `<section class="platform-group"><p class="platform-parent-label">${escapeHTML(item.name)}</p><div class="content-grid">${renderPlatform(item)}${children.map((child) => renderPlatform(child, true)).join('')}</div></section>`;
    }).join('');
  }
}

function applyCustomPage(data) {
  const pages = (data?.pages || []).filter((item) => item.published && item.title);
  window.cmsPages = pages;
  applySiteContent(window.siteSettings);
  if (page !== 'custom') return;
  const slug = new URLSearchParams(location.search).get('slug');
  const item = pages.find((entry) => slugify(entry.slug || entry.title) === slug);
  const target = document.querySelector('#custom-content');
  if (!item) {
    document.title = 'Page not found | Healings E. Azuike';
    if (target) target.innerHTML = '<p>This page is unavailable or has not been published.</p><a class="text-link" href="/">Return home</a>';
    return;
  }
  document.title = `${item.seoTitle || item.title} | Healings E. Azuike`;
  const image = safeImage(item.image);
  if (target) target.innerHTML = `${image ? `<img class="event-detail-image" src="${image}" alt="${escapeHTML(item.title)}" loading="lazy">` : ''}<p class="article-summary">${escapeHTML(item.summary || '')}</p><div class="article-body">${richText(item.body || '')}</div><button class="button-secondary" type="button" data-share-page>Share this page ↗</button>`;
  if (item.seoDescription) document.querySelector('meta[name="description"]')?.setAttribute('content', item.seoDescription);
  target?.querySelector('[data-share-page]')?.addEventListener('click', async (event) => {
    try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); event.currentTarget.textContent = 'Link copied'; } } catch (error) { if (error.name !== 'AbortError') event.currentTarget.textContent = 'Copy the page URL to share'; }
  });
}

Promise.all([
  readContent('site.json'),
  readContent('books.json'),
  readContent('articles.json'),
  readContent('events.json'),
  readContent('media.json'),
  readContent('testimonials.json'),
  readContent('ministries.json'),
  readContent('pages.json')
]).then(([site, books, articles, events, media, testimonials, ministries, pages]) => {
  window.siteSettings = site;
  applySiteContent(site);
  applyBooks(books);
  applyArticles(articles);
  applyEvents(events);
  applyMedia(media);
  applyTestimonials(testimonials);
  applyDirectories(ministries);
  applyCustomPage(pages);
});
