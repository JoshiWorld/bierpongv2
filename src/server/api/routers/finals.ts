import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TurnierSize, TurnierStatus } from "@prisma/client";

export const finalsRouter = createTRPCRouter({
  setGroupWinners: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        groupWinners: z.record(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tournamentId, groupWinners } = input;
      console.log("Empfangene Daten:", tournamentId, groupWinners);

      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: tournamentId,
        },
        select: {
          id: true,
          size: true,
          status: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Turnier konnte nicht gefunden werden`,
        });
      }

      if (tournament.status !== TurnierStatus.GRUPPENPHASE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Das Turnier befindet sich nicht in der Gruppenphase`,
        });
      }

      const groups = await ctx.db.gruppe.findMany({
        where: {
          turnier: {
            id: tournamentId,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      let finalName;
      switch (tournament.size) {
        case TurnierSize.SMALL:
          finalName = "Finale";
          break;
        case TurnierSize.MEDIUM:
          await ctx.db.final.create({
            data: {
              name: "Finale",
              turnier: {
                connect: {
                  id: tournament.id,
                },
              },
            },
          });
          finalName = "Halbfinale";
          break;
        case TurnierSize.BIG:
          await ctx.db.final.create({
            data: {
              name: "Finale",
              turnier: {
                connect: {
                  id: tournament.id,
                },
              },
            },
          });
          await ctx.db.final.create({
            data: {
              name: "Halbfinale",
              turnier: {
                connect: {
                  id: tournament.id,
                },
              },
            },
          });
          finalName = "Viertelfinale";
          break;
        case TurnierSize.EXTREME:
        default:
          await ctx.db.final.create({
            data: {
              name: "Finale",
              turnier: {
                connect: {
                  id: tournament.id,
                },
              },
            },
          });
          await ctx.db.final.create({
            data: {
              name: "Halbfinale",
              turnier: {
                connect: {
                  id: tournament.id,
                },
              },
            },
          });
          await ctx.db.final.create({
            data: {
              name: "Viertelfinale",
              turnier: {
                connect: {
                  id: tournament.id,
                },
              },
            },
          });
          finalName = "Achtelfinale";
          break;
      }

      const final = await ctx.db.final.create({
        data: {
          name: finalName,
          turnier: {
            connect: {
              id: tournament.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      for (let i = 0; i < groups.length; i += 2) {
        const group1 = groups[i];
        const group2 = groups[i + 1];

        if (!group1 || !group2) {
          console.warn(`Fehler bei Gruppensuche.`);
          continue;
        }

        const firstGroupLetter = String.fromCharCode(65 + i);
        const secondGroupLetter = String.fromCharCode(65 + i + 1);

        const firstGroupWinnerId =
          groupWinners[`firstGroup${firstGroupLetter}`];
        const firstGroupSecondId =
          groupWinners[`secondGroup${firstGroupLetter}`];
        const secondGroupWinnerId =
          groupWinners[`firstGroup${secondGroupLetter}`];
        const secondGroupSecondId =
          groupWinners[`secondGroup${secondGroupLetter}`];

        if (firstGroupWinnerId && secondGroupSecondId) {
          const match = await ctx.db.spiel.create({
            data: {
              final: {
                connect: {
                  id: final.id,
                },
              },
              team1: {
                connect: {
                  id: firstGroupWinnerId,
                },
              },
              team2: {
                connect: {
                  id: secondGroupSecondId,
                },
              },
            },
            select: {
              team1: {
                select: {
                  name: true,
                },
              },
              team2: {
                select: {
                  name: true,
                },
              },
            },
          });

          console.log(
            `${final.name}-Spiel wurde erstellt: ${match.team1.name} vs ${match.team2.name}`,
          );
        }

        if (firstGroupSecondId && secondGroupWinnerId) {
          const match = await ctx.db.spiel.create({
            data: {
              final: {
                connect: {
                  id: final.id,
                },
              },
              team1: {
                connect: {
                  id: firstGroupSecondId,
                },
              },
              team2: {
                connect: {
                  id: secondGroupWinnerId,
                },
              },
            },
            select: {
              team1: {
                select: {
                  name: true,
                },
              },
              team2: {
                select: {
                  name: true,
                },
              },
            },
          });

          console.log(
            `${final.name}-Spiel wurde erstellt: ${match.team1.name} vs ${match.team2.name}`,
          );
        }
      }

      const updatedTournament = await ctx.db.turnier.update({
        where: {
          id: tournament.id,
        },
        data: {
          status: TurnierStatus.KO_PHASE,
        },
        select: {
          status: true,
        },
      });

      return updatedTournament;
    }),
});
