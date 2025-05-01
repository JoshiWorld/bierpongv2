// app/api/push/subscribe/route.ts
import { type NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Konfiguration von Web-Push mit VAPID-Keys
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

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const subscription = await req.json();
    console.log("Received subscription:", subscription);

    // TODO: Speichere das Abonnement in deiner Datenbank
    // Beispiel:
    // await db.pushSubscription.create({ data: subscription });

    return NextResponse.json({ message: "Subscription added" });
  } catch (error) {
    console.error("Error adding subscription:", error);
    return NextResponse.json(
      { error: "Failed to add subscription" },
      { status: 500 },
    );
  }
}
