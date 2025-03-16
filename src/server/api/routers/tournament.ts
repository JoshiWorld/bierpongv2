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
  enemyCups: number;
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
                  enemyCups: true,
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

      for(const group of tournament.gruppen) {
        const teams: TeamViewOverview[] = [];
        for(const team of group.teams) {
          teams.push({
            name: team.name,
            punkte: team.punkte,
            cups: team.cups,
            enemyCups: team.enemyCups,
            id: team.id,
          });
        }

        teams.sort((a, b) => {
          if (b.punkte !== a.punkte) {
            return b.punkte - a.punkte; // Absteigend nach Punkten
          }
          return (b.cups - b.enemyCups) - (a.cups - a.enemyCups); // Absteigend nach Cups
        });

        groups.push({
          name: group.name,
          teams,
        });
      }

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
        final.spiele.forEach((match) => {
          matches.push({
            group: final.name,
            team1: match.team1,
            team2: match.team2,
          });
        })
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

      try {
        const groups = createRandomGroups(teams);

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

      try {
        const groups = await ctx.db.gruppe.findMany({
          where: {
            turnier: {
              id: tournament.id
            }
          },
          select: {
            id: true,
            teams: {
              select: {
                id: true,
              }
            }
          }
        });

        const matchOrder = [
          [0, 1], // Team1 vs Team2
          [2, 3], // Team3 vs Team4
          [0, 2], // Team1 vs Team3
          [1, 3], // Team2 vs Team4
          [0, 3], // Team1 vs Team4
          [1, 2], // Team2 vs Team3
        ];

        for (const group of groups) {
          const teams = group.teams;

          // Stelle sicher, dass es genau 4 Teams gibt, bevor wir versuchen, Spiele zu erstellen.
          if (teams.length !== 4) {
            console.warn(
              `Gruppe ${group.id} hat nicht die erwartete Anzahl von Teams (4). Überspringe Match-Erstellung.`,
            );
            continue; // Gehe zur nächsten Gruppe über
          }

          // Matches erstellen in der definierten Reihenfolge
          for (const [team1Index, team2Index] of matchOrder) {
            // @ts-expect-error || @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const team1Id = teams[team1Index].id;
            // @ts-expect-error || @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const team2Id = teams[team2Index].id;

            await ctx.db.spiel.create({
              data: {
                team1: {
                  connect: {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    id: team1Id,
                  },
                },
                team2: {
                  connect: {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    id: team2Id,
                  },
                },
                gruppe: {
                  connect: {
                    id: group.id,
                  },
                },
              },
            });
          }
        }
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Fehler beim erstellen der Spiele`,
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
          cups: 0,
          punkte: 0,
          enemyCups: 0
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
