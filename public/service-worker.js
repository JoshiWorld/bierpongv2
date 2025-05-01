console.log("Service Worker loaded");

self.addEventListener('push', (event) => {
  // @ts-expect-error || @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const data = event.data.json();
  console.log('Push Recieved...');
  // @ts-expect-error || @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  self.registration.showNotification(data.title, {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    body: data.message,
    icon: '/icon.png', // Optional: Pfad zu einem Icon
  });
});