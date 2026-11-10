module.exports = async function newsletter(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: 'Use POST to subscribe.' });
  }

  const origin = request.headers.origin;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  try {
    if (!origin || !host || new URL(origin).host !== host) return response.status(403).json({ message: 'This request could not be verified.' });
  } catch {
    return response.status(403).json({ message: 'This request could not be verified.' });
  }

  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return response.status(400).json({ message: 'Enter a valid email address.' }); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return response.status(400).json({ message: 'Enter a valid email address.' });
  if (body.website) return response.status(200).json({ message: 'Thank you.' });

  const email = String(body.email || '').trim().toLowerCase();
  if (!body.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return response.status(400).json({ message: 'Enter a valid email address and confirm your subscription.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return response.status(503).json({ message: 'The newsletter service is not connected yet.' });

  try {
    const result = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false })
    });
    if (result.status === 409) return response.status(200).json({ message: 'This address is already subscribed.' });
    if (!result.ok) return response.status(502).json({ message: 'The newsletter service could not save your subscription.' });
    return response.status(200).json({ message: 'You are subscribed.' });
  } catch {
    return response.status(502).json({ message: 'The newsletter service is temporarily unavailable.' });
  }
};
