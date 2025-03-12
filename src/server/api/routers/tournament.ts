import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TurnierSize } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type PlayerViewOverview = {
  name: string;
  team: string;
}

type GroupViewOverview = {
  name: string;
  teams: TeamViewOverview[];
}

type TeamViewOverview = {
  name: string;
  punkte: number;
  cups: number;
};

type MatchViewOverview = {
  group: string;
  team1: {
    name: string;
  };
  team2: {
    name: string;
  };
};

export const tournamentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        code: z.string(),
        size: z.nativeEnum(TurnierSize),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.turnier.create({
        data: {
          name: input.name,
          code: input.code,
          admin: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          size: input.size,
        },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.turnier.findUnique({
        where: {
          id: input.id,
        },
        select: {
          code: true,
          status: true,
          id: true,
          name: true,
          _count: {
            select: {
              teams: true,
            },
          },
          admin: {
            select: {
              name: true,
            },
          },
          size: true,
        },
      });
    }),

  getPlayers: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: input.id,
        },
        select: {
          teams: {
            select: {
              spieler1: {
                select: {
                  name: true,
                },
              },
              spieler2: {
                select: {
                  name: true,
                },
              },
              name: true,
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

      const players: PlayerViewOverview[] = [];

      tournament.teams.forEach((team) => {
        players.push({
          name: team.spieler1.name,
          team: team.name,
        });
        players.push({
          name: team.spieler2.name,
          team: team.name,
        });
      });

      return players;
    }),

  getGroups: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: input.id,
        },
        select: {
          gruppen: {
            select: {
              name: true,
              teams: {
                select: {
                  name: true,
                  punkte: true,
                  cups: true,
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

      const groups: GroupViewOverview[] = [];

      tournament.gruppen.forEach((group) => {
        const teams: TeamViewOverview[] = [];
        teams.forEach((team) => {
          teams.push({
            name: team.name,
            punkte: team.punkte,
            cups: team.cups,
          });
        });

        groups.push({
          name: group.name,
          teams,
        });
      });

      return groups;
    }),

  getRunningMatchesGroupphase: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: input.id,
        },
        select: {
          gruppen: {
            select: {
              name: true,
              spiele: {
                where: {
                  done: false,
                },
                take: 1,
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

      const matches: MatchViewOverview[] = [];

      tournament.gruppen.forEach((group) => {
        if (group.spiele[0]) {
          matches.push({
            group: group.name,
            team1: group.spiele[0].team1,
            team2: group.spiele[0].team2,
          });
        }
      });

      return matches;
    }),

  getRunningMatchesFinalphase: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: input.id,
        },
        select: {
          finals: {
            select: {
              name: true,
              spiele: {
                where: {
                  done: false,
                },
                take: 1,
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

      const matches: MatchViewOverview[] = [];

      tournament.finals.forEach((final) => {
        if (final.spiele[0]) {
          matches.push({
            group: final.name,
            team1: final.spiele[0].team1,
            team2: final.spiele[0].team2,
          });
        }
      });

      return matches;
    }),

  join: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        player1: z.string(),
        player2: z.string(),
        teamname: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.turnier.findUnique({
        where: {
          code: input.code,
        },
        select: {
          id: true,
          teams: {
            select: {
              name: true,
            },
          },
          size: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Das angegebene Turnier konnte nicht gefunden werden",
        });
      }

      if (tournament.teams.find((team) => team.name === input.teamname)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Das Team befindet sich bereits in diesem Turnier. Bitte wähle einen anderen Teamnamen",
        });
      }

      switch (tournament.size) {
        case TurnierSize.SMALL:
          if (tournament.teams.length >= 4) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Das Turnier ist schon voll. Teams: ${tournament.teams.length}`,
            });
          }
          break;
        case TurnierSize.MEDIUM:
          if (tournament.teams.length >= 8) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Das Turnier ist schon voll. Teams: ${tournament.teams.length}`,
            });
          }
          break;
        case TurnierSize.BIG:
          if (tournament.teams.length >= 16) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Das Turnier ist schon voll. Teams: ${tournament.teams.length}`,
            });
          }
          break;
        case TurnierSize.EXTREME:
          if (tournament.teams.length >= 32) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Das Turnier ist schon voll. Teams: ${tournament.teams.length}`,
            });
          }
          break;
        default:
          if (tournament.teams.length >= 32) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Das Turnier ist schon voll. Teams: ${tournament.teams.length}`,
            });
          }
          break;
      }

      return ctx.db.team.create({
        data: {
          name: input.teamname,
          turnier: {
            connect: {
              id: tournament.id,
            },
          },
          spieler1: {
            connect: {
              id: input.player1,
            },
          },
          spieler2: {
            connect: {
              id: input.player2,
            },
          },
        },
      });
    }),
});
