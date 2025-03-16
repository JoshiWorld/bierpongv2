import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const matchRouter = createTRPCRouter({
  enterResultGroup: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        team1Cups: z.number(),
        team2Cups: z.number(),
        winnerId: z.string(),
        loserId: z.string(),
        team1Id: z.string(),
        creatorId: z.string(),
        tournamentId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { matchId, team1Cups, team2Cups, winnerId, loserId, team1Id, creatorId } =
        input;

      const result = await ctx.db.spielergebnis.findFirst({
        where: {
          spiel: {
            id: matchId,
          },
        },
        select: {
          id: true,
          team1Cups: true,
          team2Cups: true,
          winner: {
            select: {
              id: true,
            },
          },
          creator: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!result) {
        const createdResult = ctx.db.spielergebnis.create({
          data: {
            spiel: {
              connect: {
                id: matchId,
              },
            },
            creator: {
              connect: {
                id: creatorId,
              },
            },
            team1Cups,
            team2Cups,
            winner: {
              connect: {
                id: winnerId,
              },
            },
          },
          select: {
            id: true,
          },
        });

        return {
          result: createdResult,
          created: true,
        };
      }

      if (result.creator.id === creatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Du hast bereits dein Ergebnis eingetragen. Bitte warte auf das Gegnerteam",
        });
      }

      if (
        result.team1Cups !== team1Cups ||
        result.team2Cups !== team2Cups ||
        result.winner.id !== winnerId
      ) {
        await ctx.db.spielergebnis.delete({
          where: {
            id: result.id,
          },
        });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Das eingetragene Ergebnis ist falsch. Beide Teams müssen das Ergebnis erneut eintragen.",
        });
      }

      const updatedResult = await ctx.db.spiel.update({
        where: {
          id: matchId,
        },
        data: {
          cupsTeam1: team1Cups,
          cupsTeam2: team2Cups,
          done: true,
        },
        select: {
          cupsTeam1: true,
          cupsTeam2: true,
        },
      });

      try {
        const cups = winnerId === team1Id ? team1Cups : team2Cups;

        const teamUpdate = await ctx.db.team.update({
          where: {
            id: winnerId,
          },
          data: {
            cups: {
              increment: cups,
            },
            punkte: {
              increment: 3,
            },
          },
        });

        await ctx.db.team.update({
          where: {
            id: loserId
          },
          data: {
            enemyCups: {
              increment: cups
            }
          }
        });

        console.log("TeamUpdate:", teamUpdate);
      } catch (err) {
        console.error(err);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fehler beim Abgleich des Ergebnis",
        });
      }

      return {
        result: updatedResult,
        created: false,
      };
    }),

  enterResultFinals: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        winnerId: z.string(),
        team1Id: z.string(),
        creatorId: z.string(),
        tournamentId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { matchId, winnerId, team1Id, creatorId } =
        input;

      const result = await ctx.db.spielergebnis.findFirst({
        where: {
          spiel: {
            id: matchId,
          },
        },
        select: {
          id: true,
          team1Cups: true,
          team2Cups: true,
          winner: {
            select: {
              id: true,
            },
          },
          creator: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!result) {
        const createdResult = ctx.db.spielergebnis.create({
          data: {
            spiel: {
              connect: {
                id: matchId,
              },
            },
            creator: {
              connect: {
                id: creatorId,
              },
            },
            team1Cups: winnerId === team1Id ? 3 : 0,
            team2Cups: winnerId === team1Id ? 0 : 3,
            winner: {
              connect: {
                id: winnerId,
              },
            },
          },
          select: {
            id: true,
          },
        });

        return {
          result: createdResult,
          created: true,
        };
      }

      if (result.creator.id === creatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Du hast bereits dein Ergebnis eingetragen. Bitte warte auf das Gegnerteam",
        });
      }

      if (
        result.winner.id !== winnerId
      ) {
        await ctx.db.spielergebnis.delete({
          where: {
            id: result.id,
          },
        });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Das eingetragene Ergebnis ist falsch. Beide Teams müssen das Ergebnis erneut eintragen.",
        });
      }

      const updatedResult = await ctx.db.spiel.update({
        where: {
          id: matchId,
        },
        data: {
          cupsTeam1: winnerId === team1Id ? 3 : 0,
          cupsTeam2: winnerId === team1Id ? 0 : 3,
          done: true,
        },
        select: {
          cupsTeam1: true,
          cupsTeam2: true,
        },
      });

      try {
        const teamUpdate = await ctx.db.team.update({
          where: {
            id: winnerId,
          },
          data: {
            cups: {
              increment: 3,
            },
            punkte: {
              increment: 3,
            },
          },
        });

        console.log("TeamUpdate:", teamUpdate);
      } catch (err) {
        console.error(err);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fehler beim Abgleich des Ergebnis",
        });
      }

      return {
        result: updatedResult,
        created: false,
      };
    }),

  getMatchesFromTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.spiel.findMany({
        where: {
          OR: [
            { team1: { id: input.teamId } },
            { team2: { id: input.teamId } },
          ],
        },
        select: {
          id: true,
          cupsTeam1: true,
          cupsTeam2: true,
          done: true,
          team1: {
            select: {
              id: true,
              name: true,
            },
          },
          team2: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }),

  groupRunningMatches: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.spiel.count({
        where: {
          gruppe: {
            turnier: {
              id: input.tournamentId,
            },
          },
          done: false,
        },
      });
    }),
});
