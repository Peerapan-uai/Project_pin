const crypto = require('crypto');

module.exports = (req, res, next) => {
  const sigHeader =  req.headers['x-omise-signature'];

  if (!sigHeader) {
    return res.status(401).json({ error: 'Missing singature' });
  }

  const secret = process.env.OMISE_WEBHOOK_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const computed = crypto
  .createHmac('sha256', secret)
  .update(req.rawBody)
  .digest('hex');

  const a = Buffer.from(sigHeader, 'hex');
  const b = Buffer.from(computed, 'hex');
  if (a.length !== b.length) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
};