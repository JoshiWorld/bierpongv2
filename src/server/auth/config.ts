import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { env } from "@/env";
import { verifyOtp } from "./otp";

export const authConfig = {
  debug: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Spielername",
          type: "text",
          placeholder: "Spielername",
        },
        otp: { label: "Login-Code", type: "text" },
      },
      async authorize(credentials) {
        console.log("Credentials:", credentials);
        if (!credentials) return null;
        const { username, otp } = credentials;

        try {
          const user = await db.user.findUnique({
            where: {
              name: String(username),
            },
            select: {
              id: true,
              name: true,
            },
          });

          if (!user) {
            console.log("User not found");
            return null;
          }

          const isOtpValid = await verifyOtp(String(username), String(otp));
          if (!isOtpValid) {
            console.log("OTP is invalid");
            return null;
          }

          console.log("User authenticated successfully:", user);
          return user;
        } catch (error) {
          console.error("Error during authorization:", error);
          return null;
        }
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  secret: env.AUTH_SECRET,
  pages: {
    signOut: "/logout",
    signIn: "/login",
    error: "/login",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
