const CODE_TTL_MS = 5 * 60 * 1000;
const smsStore = new Map();

function sendCode(phone) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  smsStore.set(phone, {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  return code;
}

function verifyCode(phone, input) {
  const record = smsStore.get(phone);
  if (!record) {
    return false;
  }
  if (Date.now() > record.expiresAt) {
    smsStore.delete(phone);
    return false;
  }
  const ok = record.code === input;
  if (ok) {
    smsStore.delete(phone);
  }
  return ok;
}

function sendNotificationSms(phone, content) {
  console.log(`[SMS] ${phone}: ${content}`);
  return { ok: true };
}

module.exports = {
  sendCode,
  verifyCode,
  sendNotificationSms,
};
