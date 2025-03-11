import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { generateOtp } from "@/server/auth/otp";

export const otpRouter = createTRPCRouter({
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return generateOtp(input.name);
    }),
});
