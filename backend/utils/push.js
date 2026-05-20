const webpush = require('web-push');

let subscriptions = [];

module.exports.setupPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@tokyodrift.com';

  if (!publicKey || !privateKey) {
    console.error('❌ VAPID keys are missing! Push notifications will not work.');
    return {
      addSubscription: () => {},
      removeSubscription: () => {},
      sendToAllSubscribers: () => {}
    };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  console.log('✅ Push notifications configured');

  return {
    addSubscription(sub) {
      subscriptions.push(sub);
      console.log('Push subscription added, total:', subscriptions.length);
    },
    removeSubscription(endpoint) {
      subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
      console.log('Push subscription removed, total:', subscriptions.length);
    },
    sendToAllSubscribers(payload) {
      const data = JSON.stringify(payload);
      subscriptions.forEach(sub => {
        webpush.sendNotification(sub, data).catch(err => console.error('Push error:', err));
      });
    }
  };
};