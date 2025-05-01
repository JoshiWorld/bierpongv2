// src/components/subscribe-button.tsx
"use client";

import { useEffect, useState } from "react";
// import { subscribeToPushNotifications } from "@/utils/push-subscription";
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
      // const subscription = await subscribeToPushNotifications();

      if(!subscription) {
        toast.error("Fehler bei PushAPI", {
          description: "Subscription is undefined"
        });
        throw new Error("PushAPI Error");
      }

      // Sende das Abonnement an deinen Server
      // await sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Ein unbekannter Fehler ist aufgetreten.");
      }
    }
  };

  type Sub = {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    },
    expirationTime: number | null | undefined,
  }

  async function sendSubscriptionToServer(subscription: Sub) {
    subscribeMutation.mutate({
      endpoint: subscription.endpoint,
      keys: {
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
      },
      expirationTime: subscription.expirationTime,
    });
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
