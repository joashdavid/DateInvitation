const ALLOWED_EVENTS = {
  yes: 'It’s a date. Leann clicked “Yes, obviously”.',
  thinking: 'Leann clicked “Hmm… let me think”.'
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const event = req.body && req.body.event;
  if (typeof event !== 'string' || !Object.prototype.hasOwnProperty.call(ALLOWED_EVENTS, event)) {
    return res.status(400).json({ ok: false, error: 'Invalid notification event' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Telegram notification environment variables are not configured');
    return res.status(500).json({ ok: false, error: 'Telegram notifications are not configured' });
  }

  const message = `${ALLOWED_EVENTS[event]} — ${new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  })}`;

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    const result = await telegramResponse.json();

    if (!telegramResponse.ok || !result.ok) {
      console.error('Telegram rejected notification:', result.description || telegramResponse.status);
      return res.status(502).json({ ok: false, error: 'Telegram rejected the notification' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram notification request failed:', error);
    return res.status(502).json({ ok: false, error: 'Could not contact Telegram' });
  }
};
