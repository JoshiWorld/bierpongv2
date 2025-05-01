// src/components/subscribe-button.tsx
"use client";

import { useEffect, useState } from "react";
import { subscribeToPushNotifications } from "@/utils/push-subscription";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function SubscribeButton() {
  const utils = api.useUtils();
  const { data: subscription, isLoading } =
    api.notifications.hasSubscribed.useQuery();

  const [isSubscribed, setIsSubscribed] = useState(false);

  const subscribeMutation = api.notifications.subscribe.useMutation({
    onSuccess: async () => {
      await utils.notifications.invalidate();
      setIsSubscribed(true);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Fehler beim Aktivieren der Benachrichtigungen", {
        description:
          err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler",
      });
    },
  });

  useEffect(() => {
    if (subscription) {
      setIsSubscribed(true);
    }
  }, [subscription]);

  const handleClick = async () => {
    try {
      const subscription = await subscribeToPushNotifications();

      // Sende das Abonnement an deinen Server
      await sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Ein unbekannter Fehler ist aufgetreten.");
      }
    }
  };

  async function sendSubscriptionToServer(subscription: PushSubscription) {
    subscribeMutation.mutate({
      endpoint: subscription.endpoint,
      keys: {
        auth: arrayBufferToBase64(subscription.getKey("auth")),
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
      },
      expirationTime: subscription.expirationTime,
    });
  }

  function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    let binary = "";
    const bytes = new Uint8Array(buffer!);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      // @ts-expect-error || @ts-ignore
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  if (isLoading) {
    return (
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={subscribeMutation.isPending || isSubscribed}
    >
      {isSubscribed
        ? "Push-Benachrichtigungen deaktivieren"
        : "Push-Benachrichtigungen aktivieren"}
    </Button>
  );
}
