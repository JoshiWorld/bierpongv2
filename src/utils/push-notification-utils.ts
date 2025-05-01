import admin from "firebase-admin";

class PushNotificationUtils {
  constructor() {
    // Überprüfen, ob die Admin SDK bereits initialisiert wurde
    if (!admin.apps.length) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        : require("../server/serviceAccountKey.json");

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
      // const serviceAccount = require("../server/serviceAccountKey.json");
      // const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      admin.initializeApp({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    message: string,
  ): Promise<void> {
    try {
      const notificationMessage = {
        notification: {
          title: title,
          body: message,
        },
        token: fcmToken,
      };

      const response = await admin.messaging().send(notificationMessage);
      console.log("Successfully sent message:", response);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error; // Wirf den Fehler erneut, damit er in der TRPC-Route behandelt werden kann
    }
  }
}

export const pushNotificationUtils = new PushNotificationUtils();
