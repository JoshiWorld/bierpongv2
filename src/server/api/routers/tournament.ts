import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TurnierSize, TurnierStatus, UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type PlayerViewOverview = {
  name: string;
  team: string;
};

type GroupViewOverview = {
  name: string;
  teams: TeamViewOverview[];
};

type TeamViewOverview = {
  id: string;
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
              id: true,
              name: true,
            },
          },
          size: true,
        },
      });
    }),

  getAdminTournaments: protectedProcedure.query(({ ctx }) => {
    return ctx.db.turnier.findMany({
      where: {
        admin: {
          id: ctx.session.user.id,
        },
      },
      select: {
        id: true,
        name: true,
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

  getTeams: protectedProcedure
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
              id: true,
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

      return tournament.teams;
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
                  id: true,
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
        group.teams.forEach((team) => {
          teams.push({
            name: team.name,
            punkte: team.punkte,
            cups: team.cups,
            id: team.id
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

  startTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: input.tournamentId,
        },
        select: {
          id: true,
          status: true,
          _count: {
            select: {
              teams: true,
            },
          },
          admin: {
            select: {
              id: true,
            },
          },
          size: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Das Turnier konnte nicht gefunden werden`,
        });
      }

      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (
        !user ||
        user.role !== UserRole.ADMIN ||
        tournament.admin.id !== user.id
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Du hast keinen Zugriff darauf.`,
        });
      }

      switch (tournament.size) {
        case TurnierSize.SMALL:
          if (tournament._count.teams < 4) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Nicht genügend Teams vorhanden. ${tournament._count.teams}/4`,
            });
          }
          break;
        case TurnierSize.MEDIUM:
          if (tournament._count.teams < 8) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Nicht genügend Teams vorhanden. ${tournament._count.teams}/8`,
            });
          }
          break;
        case TurnierSize.BIG:
          if (tournament._count.teams < 16) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Nicht genügend Teams vorhanden. ${tournament._count.teams}/16`,
            });
          }
          break;
        case TurnierSize.EXTREME:
        default:
          if (tournament._count.teams < 32) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Nicht genügend Teams vorhanden. ${tournament._count.teams}/32`,
            });
          }
          break;
      }

      const teams = await ctx.db.team.findMany({
        where: {
          turnier: {
            id: tournament.id,
          },
        },
        select: {
          id: true,
        },
      });

      const groups = createRandomGroups(teams);

      try {
        for (let i = 0; i < groups.length; i++) {
          const groupName = `Gruppe ${String.fromCharCode(65 + i)}`;
          const teamIds = groups[i];

          if(!teamIds) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Es konnten keine Teams für ${groupName} gefunden werden`,
            });
          }

          const newGroup = await ctx.db.gruppe.create({
            data: {
              name: groupName,
              turnier: {
                connect: {
                  id: tournament.id,
                },
              },
            },
            select: {
              id: true,
            },
          });

          // for (const teamId of teamIds) {
          //   await ctx.db.team.update({
          //     where: {
          //       id: teamId,
          //     },
          //     data: {
          //       gruppe: {
          //         connect: {
          //           id: newGroup.id,
          //         },
          //       },
          //     },
          //   });
          // }

          await ctx.db.team.updateMany({
            where: {
              id: {
                in: teamIds,
              },
            },
            data: {
              gruppeId: newGroup.id,
            },
          });
        }
      } catch (err) {
        console.error(err);
        await ctx.db.team.updateMany({
          where: {
            turnier: {
              id: tournament.id,
            },
          },
          data: {
            gruppeId: null,
          },
        });
        await ctx.db.gruppe.deleteMany({
          where: {
            turnier: {
              id: tournament.id,
            },
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Fehler beim erstellen der Gruppen`,
          cause: err,
        });
      }

      const updatedTournament = await ctx.db.turnier.update({
        where: {
          id: tournament.id,
        },
        data: {
          status: TurnierStatus.GRUPPENPHASE,
        },
        select: {
          status: true,
          _count: {
            select: {
              gruppen: true,
            },
          },
        },
      });

      return updatedTournament;
    }),

  resetTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.turnier.findUnique({
        where: {
          id: input.tournamentId,
        },
        select: {
          id: true,
          admin: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Das Turnier konnte nicht gefunden werden`,
        });
      }

      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (
        !user ||
        user.role !== UserRole.ADMIN ||
        tournament.admin.id !== user.id
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Du hast keinen Zugriff darauf.`,
        });
      }

      await ctx.db.team.updateMany({
        where: {
          turnier: {
            id: tournament.id,
          },
        },
        data: {
          gruppeId: null,
        },
      });
      await ctx.db.gruppe.deleteMany({
        where: {
          turnier: {
            id: tournament.id,
          },
        },
      });

      const updatedTournament = await ctx.db.turnier.update({
        where: {
          id: tournament.id,
        },
        data: {
          status: TurnierStatus.LOBBY,
        },
      });

      return updatedTournament;
    }),

  removeTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: {
          id: input.teamId,
        },
        select: {
          id: true,
          name: true,
          turnier: {
            select: {
              id: true,
              admin: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Das Team konnte nicht gefunden werden.",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (team.turnier.admin.id !== user?.id && user?.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Du hast keine Berechtigung dafür.",
        });
      }

      return ctx.db.team.delete({
        where: {
          id: team.id,
        },
      });
    }),
});

const createRandomGroups = (teams: { id: string }[]): string[][] => {
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

  const groups: string[][] = [];
  for (let i = 0; i < shuffledTeams.length; i += 4) {
    const group = shuffledTeams.slice(i, i + 4).map((team) => team.id);
    groups.push(group);
  }

  return groups;
};
