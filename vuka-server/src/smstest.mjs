/* ============================================================
   Send one SMS through whatever provider is configured, and say plainly
   what happened. Run: npm run sms:test -- 0821234567

   Exists because the alternative way to test a gateway is to register a real
   account and wait for a code that may never arrive, with nothing to read but
   a 503. This prints the provider, the number as the gateway will see it, and
   the provider's own error text when it refuses.
   ============================================================ */
import { sendSms, smsProvider, smsConfigured, toE164 } from './notify.mjs';

const raw = process.argv[2];
if (!raw) {
  console.error('Usage: npm run sms:test -- 0821234567');
  process.exit(2);
}

console.log(`provider : ${smsProvider}${smsConfigured ? '' : '  (nothing will actually be sent)'}`);
console.log(`endpoint : ${process.env.VUKA_SMS_URL || '(n/a)'}`);
console.log(`to       : ${toE164(raw)}`);

const result = await sendSms(raw, 'Vuka test message. If this reached you, the SMS gateway is working.');

if (result.delivered) {
  console.log('\nDELIVERED — the gateway accepted it. Check the handset.');
  process.exit(0);
}
console.error(`\nNOT DELIVERED — ${result.error ?? `provider is "${result.provider}"`}`);
if (!smsConfigured) console.error('Set VUKA_SMS_PROVIDER=http and VUKA_SMS_URL to send for real.');
process.exit(1);
