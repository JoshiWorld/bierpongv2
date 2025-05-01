// "use client";

// import { useEffect } from "react";

// export function PushNotifications() {
//   useEffect(() => {
//     async function register() {
//       if ("serviceWorker" in navigator) {
//         try {
//           const registration = await navigator.serviceWorker.register(
//             "/service-worker.js",
//             { scope: "/" }, // Explizit den Scope setzen
//           );
//           console.log("Service Worker registered:", registration);
//         } catch (error) {
//           console.error("Service Worker registration failed:", error);
//         }
//       }
//     }

//     register()
//       .then(() => console.log("Service Worker registered"))
//       .catch((error) =>
//         console.error("Service Worker registration failed:", error),
//       );
//   }, []);

//   return null;
// }
