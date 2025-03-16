"use client";

import { TournamentSkeleton } from "@/components/tournament-skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/trpc/react";
import { TurnierSize, TurnierStatus, UserRole } from "@prisma/client";
import { Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
    id: string;
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

export default function TournamentSettingsPage() {
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

  const { data: user } = api.user.get.useQuery();

  useEffect(() => {
    if (!tournamentId || (!isLoadingTournament && !tournament)) {
      setIsValidId(false);
      router.push("/dashboard");
      return;
    }
  }, [tournament, tournamentId, router, isLoadingTournament]);

  if (!isValidId || !tournament || !user) {
    return <TournamentSkeleton />;
  }

  if (tournament.admin.id !== user.id && user.role !== UserRole.ADMIN) {
    return <p>Du hast keinen Zugriff auf diese Seite.</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <TournamentHeader tournament={tournament} />
      <div className="flex flex-col gap-4 py-10">
        <TeamsDialog tournament={tournament} />
      </div>
      <StartButton status={tournament.status} tournamentId={tournament.id} />
      <ResetDialog tournamentId={tournament.id} />
    </div>
  );
}

function StartButton({ status, tournamentId }: { status: TurnierStatus; tournamentId: string }) {
  const utils = api.useUtils();
  const router = useRouter();

  const { data: groupRunningMatches } = api.match.groupRunningMatches.useQuery({ tournamentId }, { enabled: status === TurnierStatus.GRUPPENPHASE });

  const startTournament = api.tournament.startTournament.useMutation({
    onSuccess: async (res) => {
      await utils.tournament.invalidate();
      console.log(res);
      toast.success("Das Turnier wurde erfolgreich gestartet.");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Es gab einen Fehler beim Starten des Turniers", {
        description: err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler"
      });
    }
  });

  switch (status) {
    case TurnierStatus.LOBBY:
      return (
        <Button disabled={startTournament.isPending} onClick={() => startTournament.mutate({ tournamentId })}>
          {startTournament.isPending ? "Turnier wird gestartet.." : "Turnier starten"}
        </Button>
      );
    case TurnierStatus.ABGESCHLOSSEN:
      return <Button>Turnier archivieren</Button>;
    case TurnierStatus.GRUPPENPHASE:
      if(groupRunningMatches === 0) {
        return (
          <Button onClick={() => router.push(`/dashboard/tournament/setgroupwinner?id=${tournamentId}`)}>
            Gruppensieger festlegen
          </Button>
        );
      } else {
        return (
          <Button disabled>
            Gruppensieger festlegen
          </Button>
        );
      }
    case TurnierStatus.KO_PHASE:
      return <Button>Turnier beenden</Button>;
    default:
      return <Button>Turnier starten</Button>;
  }
}

function ResetDialog({
  tournamentId,
}: {
  tournamentId: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Turnier zurücksetzen</Button>
      </DialogTrigger>
      <DialogContent className="h-screen overflow-auto sm:max-w-md md:h-1/2">
        <DialogHeader>
          <DialogTitle>Willst du wirklich das Turnier zurücksetzen?</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center">
          <ResetButton tournamentId={tournamentId} />
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Abbrechen
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const utils = api.useUtils();

  const resetTournament = api.tournament.resetTournament.useMutation({
    onSuccess: async (res) => {
      await utils.tournament.invalidate();
      console.log(res);
      toast.success("Das Turnier wurde erfolgreich zurückgesetzt.");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Es gab einen Fehler beim Zurücksetzen des Turniers", {
        description:
          err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler",
      });
    },
  });

  return (
    <Button
      variant={"destructive"}
      disabled={resetTournament.isPending}
      onClick={() => resetTournament.mutate({ tournamentId })}
    >
      {resetTournament.isPending
        ? "Turnier wird zurückgesetzt.."
        : "Turnier zurücksetzen"}
    </Button>
  );
}

function TournamentHeader({ tournament }: { tournament: Tournament }) {
  const maxTeams = maxTeamsList.find((m) => m.size === tournament.size);
  const status = statusList.find((s) => s.status === tournament.status);

  return (
    <div>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Einstellungen
      </h2>
      <p>{`Name: ${tournament.name}`}</p>
      <p>{`Status: ${status?.name ?? "Unbekannt"}`}</p>
      <p>{`Teams: ${tournament._count.teams}/${maxTeams?.teams ?? 32}`}</p>
      <p>{`Turniercode: ${tournament.code}`}</p>
    </div>
  );
}



function TeamsDialog({ tournament }: { tournament: Tournament }) {
  const utils = api.useUtils();

  const { data: teams, isLoading } = api.tournament.getTeams.useQuery({
    id: tournament.id,
  });

  const removeTeam = api.tournament.removeTeam.useMutation({
    onSuccess: async (res) => {
      await utils.tournament.invalidate();
      toast.info(`Du hast das Team "${res.name}" entfernt.`);
    },
    onError: (err) => {
      toast.error(`Es gab einen Fehler beim Entfernen vom Team.`, {
        description: err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler"
      });
    }
  })

  if (isLoading || !teams) {
    return <p>Lade Teams..</p>;
  }

  const handleRemoveTeam = (teamId: string) => {
    if(tournament.status !== TurnierStatus.LOBBY) {
      toast.error(`Du kannst Teams nur in der Lobbyphase entfernen.`);
      return;
    }

    removeTeam.mutate({ teamId });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Teams</Button>
      </DialogTrigger>
      <DialogContent className="h-screen sm:max-w-md md:h-1/2 overflow-auto">
        <DialogHeader>
          <DialogTitle>Alle Teams</DialogTitle>
          <DialogDescription>
            Hier siehst du alle Teams. Du kannst hier auch Teams aus dem Turnier
            entfernen.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Table>
            <TableCaption>{`Anzahl der Teams: ${teams.length}`}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Team-Name</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, idx) => (
                <TableRow key={`${team.name}_${idx}`}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="submit"
                      size="sm"
                      className="px-3"
                      disabled={removeTeam.isPending}
                      onClick={() => handleRemoveTeam(team.id)}
                    >
                      <span className="sr-only">Entfernen</span>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Fertig
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
