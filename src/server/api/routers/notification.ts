import { z } from "zod";

import { adminProcedure, createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn(
    "VAPID keys are missing. Push notifications will not work correctly.",
  );
} else {
  webpush.setVapidDetails(
    "mailto:your-email@example.com",
    vapidPublicKey,
    vapidPrivateKey,
  );
}

const pushSubscriptionSchema = z.object({
  endpoint: z.string(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  expirationTime: z.number().nullable().optional(),
});

const pushNotificationPayloadSchema = z.object({
  title: z.string(),
  message: z.string(),
});

export const notificationRouter = createTRPCRouter({
  subscribe: protectedProcedure
    .input(pushSubscriptionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("Received subscription:", input);

        await ctx.db.pushSubscription.create({
          data: {
            endpoint: input.endpoint,
            auth: input.keys.auth,
            p256dh: input.keys.p256dh,
            expirationTime: input.expirationTime,
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
          },
        });

        return { message: "Subscription added" };
      } catch (error) {
        console.error("Error adding subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add subscription",
        });
      }
    }),
  send: adminProcedure
    .input(pushNotificationPayloadSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("Sending push notification with payload:", input);

        const subscriptions = await ctx.db.pushSubscription.findMany();

        if (!subscriptions || subscriptions.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No subscriptions found",
          });
        }

        // Sende die Push-Benachrichtigung an alle Abonnenten
        await Promise.all(
          subscriptions.map((subscription) => {
            return webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              },
              JSON.stringify(input), // Payload (title, message)
            );
          }),
        );

        return { message: "Push notifications sent" };
      } catch (error) {
        console.error("Error sending push notifications:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send push notifications",
        });
      }
    }),

  hasSubscribed: protectedProcedure.query(async ({ ctx }) => {
    const now = Date.now(); // Aktueller Timestamp in Millisekunden

    const subscription = await ctx.db.pushSubscription.findFirst({
      where: {
        user: {
          id: ctx.session.user.id
        },
        // Überprüfe, ob expirationTime grösser als der aktuelle Timestamp ist oder null ist
        OR: [
          { expirationTime: null }, // Abonnement ohne Ablaufdatum
          { expirationTime: { gt: now } }, // Abonnement, das noch nicht abgelaufen ist
        ],
      },
      select: {
        expirationTime: true,
      },
    });

    return !!subscription;
  }),
});