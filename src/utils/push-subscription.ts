// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// export async function subscribeToPushNotifications() {
//   if (!("serviceWorker" in navigator)) {
//     throw new Error("Service workers are not supported in this browser");
//   }

//   console.log("Service Worker is supported");

//   if (
//     // @ts-expect-error || @ts-ignore
//     typeof window.safari !== "undefined" &&
//     // @ts-expect-error || @ts-ignore
//     "pushNotification" in window.safari
//   ) {
//     console.log("Safari Push API detected");

//     // @ts-expect-error || @ts-ignore
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const permissionData = window.safari.pushNotification.requestPermission(
//       "web.de.bierpong.308er",
//       "https://bierpong.308er.de",
//       null, // Benutzerdaten (optional)
//       // @ts-expect-error || @ts-ignore
//       (permission) => {
//         if (permission.status === "granted") {
//           // Push-Benachrichtigungen sind aktiviert
//           const deviceToken = permission.deviceToken;
//           console.log("Safari Device Token:", deviceToken);

//           // TODO: Sende den deviceToken an deinen Server
//           return {
//             endpoint: deviceToken,
//             keys: {
//               auth: null,
//               p256dh: null,
//             },
//           };
//         } else if (permission.status === "denied") {
//           // Push-Benachrichtigungen sind deaktiviert
//           throw new Error("Push notifications are denied by the user.");
//         } else if (permission.status === "default") {
//           // Der Benutzer hat noch keine Entscheidung getroffen
//           throw new Error(
//             "The user has not yet granted permission for push notifications.",
//           );
//         }
//       },
//     );
//   } else if ("PushManager" in window) {
//     console.log("Standard Push API detected");

//     // Warte, bis der Service Worker bereit ist
//     try {
//       const registration = await navigator.serviceWorker.ready;
//       console.log("Service Worker registration:", registration);

//       // VAPID Public Key (muss sicher aus der Umgebungsvariable geladen werden)
//       const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

//       if (!vapidPublicKey) {
//         throw new Error(
//           "VAPID Public Key not found. Make sure to set the NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.",
//         );
//       }

//       const subscription = await registration.pushManager.subscribe({
//         userVisibleOnly: true,
//         applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
//       });

//       console.log("Push subscription created:", subscription);

//       // Konvertiere ArrayBuffer zu Strings
//       const authKey = subscription.getKey("auth");
//       const p256dhKey = subscription.getKey("p256dh");

//       if (!authKey || !p256dhKey) {
//         throw new Error(
//           "Failed to retrieve auth or p256dh key from subscription",
//         );
//       }

//       const auth = arrayBufferToBase64(authKey);
//       const p256dh = arrayBufferToBase64(p256dhKey);

//       return {
//         endpoint: subscription.endpoint,
//         expirationTime: subscription.expirationTime,
//         keys: {
//           auth: auth,
//           p256dh: p256dh,
//         },
//       };
//     } catch (error) {
//       console.error("Error subscribing to push notifications:", error);

//       if(error instanceof Error) {
//         if (error.name === "NotAllowedError") {
//         throw new Error(
//           "Push notifications are blocked by the user or the system.",
//         );
//       } else {
//         throw new Error(
//           "Failed to subscribe to push notifications: " + error.message,
//         );
//       }
//       }
//     }
//   } else {
//     throw new Error("Push API is not supported in this browser.");
//   }
// }

// function urlBase64ToUint8Array(base64String: string) {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding)
//     .replace(/\-/g, "+")
//     .replace(/_/g, "/");

//   const rawData = window.atob(base64);
//   const outputArray = new Uint8Array(rawData.length);

//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }
//   return outputArray;
// }

// function arrayBufferToBase64(buffer: BufferSource): string {
//   let binary = "";
//   // @ts-expect-error || @ts-ignore
//   const bytes = new Uint8Array(buffer);
//   const len = bytes.byteLength;
//   for (let i = 0; i < len; i++) {
//     // @ts-expect-error || @ts-ignore
//     binary += String.fromCharCode(bytes[i]);
//   }
//   return btoa(binary);
// }
