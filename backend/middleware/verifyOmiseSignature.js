const crypto = require('crypto');

module.exports = (req, res, next) => {
  // TODO 1: ดึง signature จาก header
  //   Omise ส่งใน 'x-omise-signature' (lowercase ใน Node)
  const sigHeader = /* ... */;

  // TODO 2: ถ้าไม่มี header → return 401 'Missing signature'

  // TODO 3: ดึง secret จาก process.env.OMISE_WEBHOOK_SECRET
  //   ถ้าไม่มี env → return 500 'Webhook secret not configured'
  //     (เพื่อเตือน dev ตอน setup)

  // TODO 4: คำนวณ HMAC ของ raw body
  //   const computed = crypto
  //     .createHmac('sha256', secret)
  //     .update(req.rawBody)     // ← raw Buffer จาก server.js
  //     .digest('hex');

  // TODO 5: timing-safe compare
  //   const a = Buffer.from(sigHeader, 'hex');
  //   const b = Buffer.from(computed, 'hex');
  //   if (a.length !== b.length) return res.status(401).json({...});
  //   if (!crypto.timingSafeEqual(a, b)) return res.status(401).json({...});

  // TODO 6: ผ่าน → next()
};