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
      },
    });
  }),

  get: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });
  }),

  getCurrentTeam: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(({ ctx, input }) => {
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
        },
      });
    }),

  getCurrentMatchGroup: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: input.tournamentId,
        },
        select: {
          gruppen: {
            where: {
              teams: {
                some: {
                  OR: [
                    { spieler1: { id: userId } },
                    { spieler2: { id: userId } },
                  ],
                },
              },
            },
            select: {
              name: true,
              spiele: {
                where: {
                  done: false,
                },
                take: 1,
                select: {
                  id: true,
                  team1: {
                    select: {
                      spieler1: {
                        select: {
                          id: true,
                        },
                      },
                      spieler2: {
                        select: {
                          id: true,
                        },
                      },
                      name: true,
                      id: true,
                    },
                  },
                  team2: {
                    select: {
                      spieler1: {
                        select: {
                          id: true,
                        },
                      },
                      spieler2: {
                        select: {
                          id: true,
                        },
                      },
                      name: true,
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Das angegebene Turnier konnte nicht gefunden werden",
        });
      }

      if (
        tournament.gruppen[0]?.spiele[0]?.team1.spieler1.id === userId ||
        tournament.gruppen[0]?.spiele[0]?.team1.spieler2.id === userId ||
        tournament.gruppen[0]?.spiele[0]?.team2.spieler1.id === userId ||
        tournament.gruppen[0]?.spiele[0]?.team2.spieler2.id === userId
      ) {
        return tournament.gruppen[0]?.spiele[0];
      }

      return null;
    }),

  getCurrentMatchFinal: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userTeam = await ctx.db.team.findFirst({
        where: {
          OR: [
            { spieler1: { id: userId } },
            { spieler2: { id: userId } },
          ]
        },
        select: {
          id: true,
        }
      });

      if(!userTeam) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dein Team konnte nicht gefunden werden",
        });
      }

      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: input.tournamentId,
        },
        select: {
          finals: {
            select: {
              spiele: {
                where: {
                  done: false,
                  OR: [
                    { team1: { id: userTeam.id } },
                    { team2: { id: userTeam.id } },
                  ],
                },
                select: {
                  id: true,
                  team1: {
                    select: {
                      name: true,
                      id: true,
                      spieler1: {
                        select: {
                          id: true,
                        },
                      },
                      spieler2: {
                        select: {
                          id: true,
                        },
                      },
                    },
                  },
                  team2: {
                    select: {
                      name: true,
                      id: true,
                      spieler1: {
                        select: {
                          id: true,
                        },
                      },
                      spieler2: {
                        select: {
                          id: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Das angegebene Turnier konnte nicht gefunden werden",
        });
      }

      for(const final of tournament.finals) {
        if(final.spiele[0]?.team1.id === userTeam.id || final.spiele[0]?.team2.id === userTeam.id) {
          return final.spiele[0];
        }
      }

      return null;
    }),

  getAvailablePlayers: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(({ ctx, input }) => {
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
          name: true,
        },
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
          },
        },
      },
    });
  }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.user.delete({
        where: {
          id: input.id,
        },
      });
    }),
});
