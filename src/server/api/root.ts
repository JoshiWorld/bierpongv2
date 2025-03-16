import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { otpRouter } from "./routers/otp";
import { userRouter } from "./routers/user";
import { tournamentRouter } from "./routers/tournament";
import { matchRouter } from "./routers/match";
import { finalsRouter } from "./routers/finals";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  otp: otpRouter,
  user: userRouter,
  tournament: tournamentRouter,
  match: matchRouter,
  finals: finalsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
