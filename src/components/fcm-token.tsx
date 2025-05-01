"use client";

import { useEffect, useState } from "react";
import { messaging, getToken, onMessage } from "@/utils/firebase";
import { toast } from "sonner";
import { api } from "@/trpc/react";

export function FCMToken() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const saveToken = api.notifications.saveToken.useMutation();

  useEffect(() => {
    async function requestPermission() {
      console.log("Requesting permission...");
      const permission = await Notification.requestPermission();
      console.log("Permission status:", permission);

      if (permission === "granted") {
        console.log("Notification permission granted.");

        // FCM Token abrufen
        try {
          const token = await getToken(messaging!, {
            vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
          });

          if (token) {
            console.log("FCM Token:", token);
            setFcmToken(token);
            // TODO: Token an deinen Server senden
            void sendTokenToServer(token);
          } else {
            console.log("No FCM token received.");
          }
        } catch (error) {
          console.error("Error getting FCM token:", error);
        }
      } else {
        console.log("Permission denied.");
      }
    }

    void requestPermission();

    // Listener für eingehende Nachrichten (im Vordergrund)
    onMessage(messaging!, (payload) => {
      console.log("Message received. ", payload);
      toast(payload.notification?.title ?? "Neue Benachrichtigung", {
        description: payload.notification?.body,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendTokenToServer(token: string) {
    // TODO: Sende das FCM-Token an deinen Server, um es in der Datenbank zu speichern
    console.log("Sending FCM token to server:", token);
    saveToken.mutate({token});
  }

  return null; // Diese Komponente rendert nichts
}
