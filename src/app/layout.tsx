import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { HydrateClient } from "@/trpc/server";

import { Toaster } from "@/components/ui/sonner";
import { FCMToken } from "@/components/fcm-token";
// import { PushNotifications } from "@/components/push-notification";

export const metadata: Metadata = {
  title: "Bierpong Turniersystem",
  description: "Entwickelt von Joshua Stieber",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* <PushNotifications /> */}
        {/* <FCMToken /> */}
        <TRPCReactProvider>
          <HydrateClient>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {/* <FCMToken /> */}
              <main>{children}</main>
              <Toaster richColors />
            </ThemeProvider>
          </HydrateClient>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
