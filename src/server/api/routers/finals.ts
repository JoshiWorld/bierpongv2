import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TurnierSize, TurnierStatus } from "@prisma/client";
import { type Context } from "@/types/db";

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

  createNewFinalMatch: protectedProcedure.input(z.object({ tournamentId: z.string() })).mutation(async ({ ctx, input }) => {
    const { tournamentId } = input;

    const tournament = await ctx.db.turnier.findUnique({
      where: {
        id: tournamentId
      },
      select: {
        status: true,
        size: true,
        finals: {
          select: {
            id: true,
            spiele: {
              select: {
                id: true,
                team1: {
                  select: {
                    id: true,
                  }
                },
                team2: {
                  select: {
                    id: true,
                  }
                },
                cupsTeam1: true,
                cupsTeam2: true,
                done: true,
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Turnier konnte nicht gefunden werden`,
      });
    }

    if (tournament.status !== TurnierStatus.KO_PHASE) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Das Turnier befindet sich nicht in der Finalsstage`,
      });
    }

    let finals;
    let nextFinalsId;
    switch(tournament.finals.length) {
      case 0:
      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Das Turnier hat keine Finals`,
        });
      case 1:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Das Turnier hat bereits ein Finale`,
        });
      case 2:
        if(tournament.finals[0]?.spiele.length !== 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Das Turnier hat bereits ein Finale`,
          });
        } else {
          finals = tournament.finals[1];
          nextFinalsId = tournament.finals[0].id;
        }
        break;
      case 3:
        if(tournament.finals[0]?.spiele.length !== 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Das Turnier hat bereits ein Finale`,
          });
        } else if(tournament.finals[1]?.spiele.length !== 0) {
          finals = tournament.finals[1];
          nextFinalsId = tournament.finals[0].id;
        } else {
          finals = tournament.finals[2];
          nextFinalsId = tournament.finals[1].id;
        }
      case 4:
        if(tournament.finals[0]?.spiele.length !== 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Das Turnier hat bereits ein Finale`,
          });
        } else if(tournament.finals[1]?.spiele.length !== 0) {
          finals = tournament.finals[1];
          nextFinalsId = tournament.finals[0].id;
        } else if(tournament.finals[2]?.spiele.length !== 0) {
          finals = tournament.finals[2];
          nextFinalsId = tournament.finals[1].id;
        } else {
          finals = tournament.finals[3];
          nextFinalsId = tournament.finals[2].id;
        }
    }

    if(!finals) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Fehler bei der Finals-Berechnung & Spielerstellung`,
      });
    }

    return generateQuarterFinalMatches(ctx, finals, nextFinalsId);
  }),

  finalMatchesRunning: protectedProcedure.input(z.object({ tournamentId: z.string() })).query(({ ctx, input }) => {
    return ctx.db.spiel.count({
      where: {
        final: {
          turnier: {
            id: input.tournamentId,
          },
        },
        done: false,
      },
    });
  })
});

type FinalSpiel = {
  id: string;
  cupsTeam1: number | null;
  cupsTeam2: number | null;
  done: boolean;
  team1: {
    id: string;
  };
  team2: {
    id: string;
  };
}

const generateQuarterFinalMatches = async (
  ctx: Context,
  finals: {
    spiele: FinalSpiel[];
  },
  nextFinalsId: string,
) => {
  const quarterFinalMatches = [];

  if(finals.spiele.some((spiel) => !spiel.done)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Es haben noch nicht alle Finalisten zuende gespielt.`,
    });
  }

  for (let i = 0; i < finals.spiele.length; i += 2) {
    const spiel1 = finals.spiele[i];
    const spiel2 = finals.spiele[i + 1];

    if (!spiel2 || !spiel1?.cupsTeam1 || !spiel1?.cupsTeam2 || !spiel2?.cupsTeam1 || !spiel2?.cupsTeam2) {
      console.warn(
        `Viertelfinale Matcherstellung wird übersprungen`,
      );
      continue;
    }

    // Gewinner der Spiele ermitteln
    const winner1 =
      spiel1.cupsTeam1 > spiel1.cupsTeam2 ? spiel1.team1.id : spiel1.team2.id;
    const winner2 =
      spiel2.cupsTeam1 > spiel2.cupsTeam2 ? spiel2.team1.id : spiel2.team2.id;

    // Viertelfinal-Match erstellen
    quarterFinalMatches.push({ team1Id: winner1, team2Id: winner2 });

    // Viertelfinal-Match in der Datenbank speichern
    await ctx.db.spiel.create({
      data: {
        team1: {
          connect: {
            id: winner1
          }
        },
        team2: {
          connect: {
            id: winner2
          }
        },
        final: {
          connect: {
            id: nextFinalsId
          }
        },
      },
    });
  }

  return quarterFinalMatches;
};