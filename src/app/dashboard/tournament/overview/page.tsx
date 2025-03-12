"use client";

import { api } from "@/trpc/react";
import { TurnierSize, TurnierStatus } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TournamentMatchesView } from "@/components/tournament-matches-view";

type Tournament = {
  code: string;
  status: TurnierStatus;
  name: string;
  id: string;
  _count: {
    teams: number;
  };
  size: TurnierSize;
  admin: {
    name: string;
  };
};

const maxTeamsList = [
  {
    teams: 4,
    size: TurnierSize.SMALL,
  },
  {
    teams: 8,
    size: TurnierSize.MEDIUM,
  },
  {
    teams: 16,
    size: TurnierSize.BIG,
  },
  {
    teams: 32,
    size: TurnierSize.EXTREME,
  },
];

const statusList = [
  {
    name: "In Lobby",
    status: TurnierStatus.LOBBY,
  },
  {
    name: "Gruppenphase",
    status: TurnierStatus.GRUPPENPHASE,
  },
  {
    name: "Finals",
    status: TurnierStatus.KO_PHASE,
  },
  {
    name: "Fertig",
    status: TurnierStatus.ABGESCHLOSSEN,
  },
];

export default function TournamentOverviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("id");
  const [isValidId, setIsValidId] = useState(true);

  const { data: tournament, isLoading: isLoadingTournament } =
    api.tournament.get.useQuery(
      {
        id: tournamentId ?? "",
      },
      { enabled: !!tournamentId },
    );

  useEffect(() => {
    if (!tournamentId) {
      setIsValidId(false);
      router.push("/dashboard");
      return;
    }

    if (!isLoadingTournament && !tournament) {
      setIsValidId(false);
      router.push("/dashboard");
      return;
    }
  }, [tournament, tournamentId, router, isLoadingTournament]);

  if (!isValidId || !tournament) {
    return <TournamentSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <TournamentHeader tournament={tournament} />
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Spieler
          </h3>
          <div className="aspect-video overflow-auto rounded-xl bg-muted/50">
            <PlayersTable tournamentId={tournament.id} />
          </div>
        </div>

        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Gruppen
          </h3>
          <div className="aspect-video overflow-auto rounded-xl bg-muted/50">
            <GroupsTable tournamentId={tournament.id} />
          </div>
        </div>

        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Aktuelle Spiele
          </h3>
          <div className="aspect-video overflow-auto rounded-xl bg-muted/50">
            {tournament.status === TurnierStatus.KO_PHASE ? (
              <CurrentMatchesFinalphase tournamentId={tournament.id} />
            ) : (
              <CurrentMatchesGroupphase tournamentId={tournament.id} />
            )}
          </div>
        </div>
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min overflow-auto">
        <TournamentMatchesView tournamentId={tournament.id} />
      </div>
    </div>
  );
}

function TournamentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video animate-pulse rounded-xl bg-muted/50" />
        <div className="aspect-video animate-pulse rounded-xl bg-muted/50" />
        <div className="aspect-video animate-pulse rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 animate-pulse rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  );
}

function TournamentHeader({ tournament }: { tournament: Tournament }) {
  const maxTeams = maxTeamsList.find((m) => m.size === tournament.size);
  const status = statusList.find((s) => s.status === tournament.status);

  return (
    <div>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {`${tournament.name} (${status?.name ?? "Unbekannt"})`}
      </h2>
      <p>{`Teams: ${tournament._count.teams}/${maxTeams?.teams ?? 32}`}</p>
      <p>{`Ersteller: ${tournament.admin.name}`}</p>
      <p>{`Turniercode: ${tournament.code}`}</p>
    </div>
  );
}

function PlayersTable({ tournamentId }: { tournamentId: string }) {
  const { data: players } = api.tournament.getPlayers.useQuery({
    id: tournamentId,
  });

  if (!players || players.length === 0)
    return <p>Es sind noch keine Spieler beigetreten.</p>;

  return (
    <Table>
      <TableCaption>{`Anzahl der Spieler: ${players.length}`}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Team</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player, idx) => (
          <TableRow key={`${player.name}_${idx}`}>
            <TableCell className="font-medium">{player.name}</TableCell>
            <TableCell className="font-medium">{player.team}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function GroupsTable({ tournamentId }: { tournamentId: string }) {
  const { data: groups } = api.tournament.getGroups.useQuery({
    id: tournamentId,
  });

  if (!groups || groups.length === 0)
    return <p>Es wurden noch keine Gruppen ausgelost.</p>;

  return (
    <div>
      {groups.map((group, idx) => (
        <div key={`${group.name}_${idx}`}>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            {group.name}
          </h4>
          <Table>
            {/* <TableCaption>{`Anzahl der Gruppen: ${groups.length}`}</TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Punkte</TableHead>
                <TableHead>Becher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.teams.map((team, idx) => (
                <TableRow key={`${team.name}_${idx}`}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.punkte}</TableCell>
                  <TableCell>{team.cups}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

function CurrentMatchesGroupphase({ tournamentId }: { tournamentId: string }) {
  const { data: matches } = api.tournament.getRunningMatchesGroupphase.useQuery(
    {
      id: tournamentId,
    },
  );

  if (!matches || matches.length === 0)
    return <p>Es gibt aktuell keine laufenden Spiele.</p>;

  return (
    <Table>
      <TableCaption>{`Anzahl der laufenden Spiele: ${matches.length}`}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Gruppe</TableHead>
          <TableHead>Match</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match, idx) => (
          <TableRow key={`${match.group}_${idx}`}>
            <TableCell className="font-medium">{match.group}</TableCell>
            <TableCell>{`${match.team1.name} vs ${match.team2.name}`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CurrentMatchesFinalphase({ tournamentId }: { tournamentId: string }) {
  const { data: matches } = api.tournament.getRunningMatchesFinalphase.useQuery(
    {
      id: tournamentId,
    },
  );

  if (!matches || matches.length === 0)
    return <p>Es gibt aktuell keine laufenden Spiele.</p>;

  return (
    <Table>
      <TableCaption>{`Anzahl der laufenden Spiele: ${matches.length}`}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Finale</TableHead>
          <TableHead>Match</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match, idx) => (
          <TableRow key={`${match.group}_${idx}`}>
            <TableCell className="font-medium">{match.group}</TableCell>
            <TableCell>{`${match.team1.name} vs ${match.team2.name}`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}