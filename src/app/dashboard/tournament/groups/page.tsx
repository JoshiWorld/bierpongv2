"use client";

import { api } from "@/trpc/react";
import { type TurnierSize, type TurnierStatus } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TournamentSkeleton } from "@/components/tournament-skeleton";

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

type GroupViewOverview = {
  name: string;
  teams: TeamViewOverview[];
};

type TeamViewOverview = {
  name: string;
  punkte: number;
  cups: number;
  id: string;
};

export default function TournamentGroupsPage() {
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
      <GroupsHeader tournament={tournament} />
      <div className="w-full">
        <GroupsTable tournamentId={tournament.id} />
        {/* <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Gruppen
          </h3>
          <div className="aspect-video overflow-auto rounded-xl bg-muted/50">
            <GroupsTable tournamentId={tournament.id} />
          </div>
        </div> */}
      </div>
    </div>
  );
}

function GroupsHeader({ tournament }: { tournament: Tournament }) {
  return (
    <div>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {`Gruppen (${tournament.name})`}
      </h2>
    </div>
  );
}


function GroupsTable({ tournamentId }: { tournamentId: string }) {
  const { data: groups } = api.tournament.getGroups.useQuery({
    id: tournamentId,
  });
  const { data: currentTeam } = api.user.getCurrentTeam.useQuery({
    tournamentId
  });

  if (!groups || groups.length === 0)
    return <p>Es wurden noch keine Gruppen ausgelost.</p>;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {groups.map((group, idx) => (
        <div key={`${group.name}_${idx}`}>
          <h3 className="scroll-m-20 py-2 text-2xl font-semibold tracking-tight">
            {group.name}
          </h3>
          <div
            className={`aspect-video rounded-xl ${group.teams.some((team) => team.id === currentTeam?.id) ? "bg-green-900" : "bg-muted/50"}`}
          >
            <GroupCard group={group} />
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupCard({ group }: { group: GroupViewOverview }) {
    return (
      <Table>
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
    );
}
