// scripts/rotate-vapid.ts
// Generates a fresh VAPID key pair for web push and prints the env values to
// set in the Convex dashboard (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) and the
// frontend (.env.local: NEXT_PUBLIC_VAPID_PUBLIC_KEY). Free — no third-party.
import webpush from 'web-push';

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log('# Convex env (dashboard → Environment Variables):');
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log('');
console.log('# Frontend (.env.local):');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log('');
console.log('# After setting, bump CACHE_VERSION in public/sw.js if you changed keys post-launch.');
