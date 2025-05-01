console.log("Service Worker loaded");

self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Push Recieved...');
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon.png', // Optional: Pfad zu einem Icon
  });
});