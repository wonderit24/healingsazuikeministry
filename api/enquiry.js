const allowedTypes = new Set(['contact', 'speaking', 'partnership']);

function reply(res, status, message) {
  return res.status(status).json({ message });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

module.exports = async function enquiry(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return reply(response, 405, 'Use POST to submit an enquiry.');
  }

  const origin = request.headers.origin;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  try {
    if (!origin || !host || new URL(origin).host !== host) return reply(response, 403, 'This request could not be verified.');
  } catch {
    return reply(response, 403, 'This request could not be verified.');
  }

  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return reply(response, 400, 'Check the enquiry details and try again.'); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(response, 400, 'Check the enquiry details and try again.');
  if (body.website) return reply(response, 200, 'Thank you.');

  const email = String(body.email || '').trim();
  const name = String(body.name || '').trim();
  const message = String(body.message || '').trim();
  const type = String(body.type || 'contact');
  if (!allowedTypes.has(type) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !message) return reply(response, 400, 'Please complete the required fields.');
  if (email.length > 254 || name.length > 160 || message.length > 6000) return reply(response, 400, 'One or more fields are too long.');

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.HEAM_CONTACT_EMAIL;
  const sender = process.env.HEAM_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) return reply(response, 503, 'The owner has not connected the enquiry email service yet.');

  const detailLines = Object.entries(body)
    .filter(([key, value]) => !['website', 'email', 'name', 'message', 'type'].includes(key) && typeof value === 'string' && value.trim())
    .map(([key, value]) => `${key}: ${value.trim().slice(0, 500)}`);
  const subjectLabel = type === 'speaking' ? 'Speaking invitation' : type === 'partnership' ? 'Partnership enquiry' : 'Website enquiry';
  const text = [`${subjectLabel}`, `From: ${name}`, `Reply email: ${email}`, ...detailLines, '', message].join('\n');
  const html = `<h2>${escapeHtml(subjectLabel)}</h2><p><strong>From:</strong> ${escapeHtml(name)}<br><strong>Reply email:</strong> ${escapeHtml(email)}</p>${detailLines.length ? `<p>${detailLines.map(escapeHtml).join('<br>')}</p>` : ''}<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;

  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: sender, to: [recipient], reply_to: email, subject: `HEAM ${subjectLabel}`, text, html })
    });
    if (!result.ok) return reply(response, 502, 'The email service could not send this enquiry. Please use the official connect page.');
    return reply(response, 200, 'Your enquiry has been sent.');
  } catch {
    return reply(response, 502, 'The email service is temporarily unavailable. Please use the official connect page.');
  }
};
