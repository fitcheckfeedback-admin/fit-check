import { getOrCreateDeviceId } from "./deviceId";

const VAPID_PUBLIC_KEY = "BNxUckKwKUN9Sk8xfhwZwADNOrSdBRVSkOUkz2c31uZ0_VICVXlFRkHFfEgqu3ndWoJVkTxx15GyB3c0E1M5gAQ";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push', error);
    return null;
  }
}

export async function sendSubscriptionToServer(sub: PushSubscription): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  const subJSON = sub.toJSON();
  
  if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
    throw new Error('Invalid subscription data');
  }

  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint: subJSON.endpoint,
      p256dh: subJSON.keys.p256dh,
      auth: subJSON.keys.auth,
      deviceId
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send subscription to server');
  }
}

export async function unsubscribeFromPush(registration: ServiceWorkerRegistration): Promise<void> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint }),
      });
    }
  } catch (error) {
    console.error('Failed to unsubscribe', error);
  }
}