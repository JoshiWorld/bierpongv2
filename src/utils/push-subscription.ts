export async function subscribeToPushNotifications() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser");
  }

  // Warte, bis der Service Worker bereit ist
  const registration = await navigator.serviceWorker.ready;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    throw new Error(
      "VAPID Public Key not found. Make sure to set the NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.",
    );
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("Push subscription created:", subscription);

    // Konvertiere ArrayBuffer zu Strings
    const authKey = subscription.getKey("auth");
    const p256dhKey = subscription.getKey("p256dh");

    if (!authKey || !p256dhKey) {
      throw new Error(
        "Failed to retrieve auth or p256dh key from subscription",
      );
    }

    const auth = arrayBufferToBase64(authKey);
    const p256dh = arrayBufferToBase64(p256dhKey);

    return {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        auth: auth,
        p256dh: p256dh,
      },
    };
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    if(error instanceof Error) {
      throw new Error(
        "Failed to subscribe to push notifications: " + error.message,
      );
    }
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: BufferSource): string {
  let binary = "";
  // @ts-expect-error || @ts-ignore
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    // @ts-expect-error || @ts-ignore
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}