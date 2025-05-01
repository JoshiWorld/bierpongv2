// src/utils/send-push-notification.ts
import webpush from "web-push";

// Konfiguration von Web-Push mit VAPID-Keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn(
    "VAPID keys are missing. Push notifications will not work correctly.",
  );
} else {
  webpush.setVapidDetails(
    "mailto:joshua@smartsavvy.eu",
    vapidPublicKey,
    vapidPrivateKey,
  );
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; message: string },
) {
  try {
    // @ts-expect-error || eslint-disable-next-line @typescript
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log("Push notification sent successfully.");
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}
