import { z } from "zod";

import { adminProcedure, createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { generateOtp } from "@/server/auth/otp";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.create({
          data: {
            name: input.name,
          },
          select: {
            name: true,
          },
        });

        return generateOtp(user.name);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          // @ts-expect-error || @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          error.meta?.target?.includes("name")
        ) {
          throw new TRPCError({
            code: "CONFLICT", // HTTP Status Code 409
            message:
              "Ein Nutzer mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR", // HTTP Status Code 500
          message: "Es ist ein Fehler bei der Benutzererstellung aufgetreten.",
        });
      }
    }),

  getAll: adminProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
      }
    });
  }),

  get: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id
      },
      select: {
        id: true,
        name: true,
        role: true,
      }
    });
  }),

  getCurrentTeam: protectedProcedure.input(z.object({ tournamentId: z.string() })).query(({ ctx, input }) => {
    return ctx.db.team.findFirst({
      where: {
        turnier: {
          id: input.tournamentId,
        },
        OR: [
          {
            spieler1Id: ctx.session.user.id,
          },
          {
            spieler2Id: ctx.session.user.id,
          },
        ],
      },
      select: {
        id: true,
        name: true,
      }
    });
  }),

  getAvailablePlayers: protectedProcedure.input(z.object({ code: z.string() })).query(({ ctx, input }) => {
    return ctx.db.user.findMany({
      where: {
        teamsSpieler1: {
          every: {
            turnier: {
              NOT: {
                code: input.code,
              },
            },
          },
        },
        teamsSpieler2: {
          every: {
            turnier: {
              NOT: {
                code: input.code,
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true
      }
    });
  }),

  joinedTournaments: protectedProcedure.query(({ ctx }) => {
    return ctx.db.turnier.findMany({
      where: {
        teams: {
          some: {
            OR: [
              {
                spieler1Id: ctx.session.user.id,
              },
              {
                spieler2Id: ctx.session.user.id,
              },
            ],
          },
        },
      },
      select: {
        name: true,
        id: true,
        admin: {
          select: {
            id: true,
          }
        }
      }
    });
  }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    return ctx.db.user.delete({
      where: {
        id: input.id
      }
    });
  })
});
