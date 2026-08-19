/* Print a VAPID keypair for web push. Run once: `npm run vapid:keys`.
   Keep the private key secret; the public key is safe to ship to browsers. */
import { generateVapidKeys } from './push.mjs';

const { publicKey, privateKey } = generateVapidKeys();
console.log(`VUKA_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VUKA_VAPID_PRIVATE_KEY=${privateKey}`);
console.log('VUKA_VAPID_SUBJECT=mailto:you@example.com   # a real contact, per RFC 8292');
