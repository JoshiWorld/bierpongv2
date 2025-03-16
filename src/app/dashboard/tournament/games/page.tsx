"use client";

import { TournamentSkeleton } from "@/components/tournament-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/trpc/react";
import { TurnierStatus } from "@prisma/client";
import { Check, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function GamesOverviewPage() {
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
      <GamesHeader />
      <div className="w-full">
        {tournament.status === TurnierStatus.GRUPPENPHASE ? (
          <CurrentMatchGroup tournamentId={tournament.id} />
        ) : (
          <CurrentMatchFinal tournamentId={tournament.id} />
        )}
      </div>
    </div>
  );
}

function GamesHeader() {
  return (
    <div>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {`Deine Spiele`}
      </h2>
    </div>
  );
}

type MatchStats = {
  id: string;
  team1: {
    id: string;
    name: string;
    spieler1: {
      id: string;
    };
    spieler2: {
      id: string;
    };
  };
  team2: {
    id: string;
    name: string;
    spieler1: {
      id: string;
    };
    spieler2: {
      id: string;
    };
  };
};

type CurrentTeam = {
  name: string;
  id: string;
};

function CurrentMatchGroup({ tournamentId }: { tournamentId: string }) {
  const { data: currentMatch, isLoading: isLoadingCurrentMatch } =
    api.user.getCurrentMatchGroup.useQuery({ tournamentId });
  const { data: team, isLoading: isLoadingTeam } =
    api.user.getCurrentTeam.useQuery({ tournamentId });

  if (isLoadingCurrentMatch || isLoadingTeam) return <p>Lade Matches..</p>;

  if (!team) return <p>Fehler beim Laden..</p>;

  return (
    <div>
      {currentMatch ? (
        <div className="flex flex-col items-center justify-center gap-5">
          <p>
            Dein Gegner:{" "}
            {team.id === currentMatch.team1.id
              ? currentMatch.team2.name
              : currentMatch.team1.name}
          </p>
          <MatchInputs
            match={currentMatch}
            team={team}
            tournamentId={tournamentId}
          />
        </div>
      ) : (
        <div>Du spielst gerade nicht.</div>
      )}

      <MatchesTable teamId={team.id} />
    </div>
  );
}

function CurrentMatchFinal({ tournamentId }: { tournamentId: string }) {
  const { data: currentMatch, isLoading: isLoadingCurrentMatch } =
    api.user.getCurrentMatchFinal.useQuery({ tournamentId });
  const { data: team, isLoading: isLoadingTeam } =
    api.user.getCurrentTeam.useQuery({ tournamentId });

  if (isLoadingCurrentMatch || isLoadingTeam) return <p>Lade Matches..</p>;

  if (!team) return <p>Fehler beim Laden..</p>;
  
  return (
    <div>
      {currentMatch ? (
        <div className="flex flex-col items-center justify-center gap-5">
          <p>
            Dein Gegner:{" "}
            {team.id === currentMatch.team1.id
              ? currentMatch.team2.name
              : currentMatch.team1.name}
          </p>
          <MatchInputsFinals
            match={currentMatch}
            team={team}
            tournamentId={tournamentId}
          />
        </div>
      ) : (
        <div>Du spielst gerade nicht.</div>
      )}

      <MatchesTable teamId={team.id} />
    </div>
  );
}

function MatchInputs({
  match,
  team,
  tournamentId
}: {
  match: MatchStats;
  team: CurrentTeam;
  tournamentId: string;
}) {
  const utils = api.useUtils();
  const enemyTeam = match.team1.id === team.id ? match.team2 : match.team1;

  const [ownCups, setOwnCups] = useState<string>("0");
  const [enemyCups, setEnemyCups] = useState<string>("0");
  const [winner, setWinner] = useState<string>("");
  const [waitingForEnemy, setWaitingForEnemy] = useState<boolean>(false);

  const submitResult = api.match.enterResultGroup.useMutation({
    onSuccess: async (res) => {
      await utils.invalidate();
      if(res.created) {
        toast.info("Das Ergebnis wurde eingetragen. Es muss noch durch deinen Gegner bestätigt werden.");
        setWaitingForEnemy(true);
      } else {
        toast.success("Das Ergebnis wurde erfolgreich abgeglichen. Das Spiel wurde vollständig gewertet.");
      }
    },
    onError: async (err) => {
      await utils.invalidate();
      toast.error("Es gab einen Fehler beim Eintragen des Ergebnis.", {
        description: err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler"
      });
    }
  });

  const handleSendMatchResults = () => {
    const enemyCupsNumber = Number(enemyCups.replace(",", ".").replaceAll(" ", ""));
    const ownCupsNumber = Number(ownCups.replace(",", ".").replaceAll(" ", ""));

    if(!winner) {
      toast.error("Du musst einen Gewinner eintragen.");
      return;
    }
    if(enemyCupsNumber === 0 && ownCupsNumber === 0) {
      toast.error("Es können nicht beide Teams 0 Becher stehen haben.");
      return;
    }

    const team1Cups =
      match.team1.id === team.id ? ownCupsNumber : enemyCupsNumber;
    const team2Cups =
      match.team2.id === team.id ? ownCupsNumber : enemyCupsNumber;

    const loserId = winner === match.team1.id ? match.team2.id : match.team1.id;

    submitResult.mutate({ winnerId: winner, loserId, team1Cups, team2Cups, matchId: match.id, team1Id: match.team1.id, creatorId: team.id, tournamentId });
  }

  return (
    <div>
      {waitingForEnemy ? (
        <div>Warte auf Gegner..</div>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Ergebnis eintragen</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ergebnis eintragen</DialogTitle>
              <DialogDescription>
                Trage hier das Ergebnis gegen das Team{" "}
                <span className="font-bold">{enemyTeam.name}</span> ein
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 items-start gap-4">
                <Label htmlFor="enemyCups" className="text-left">
                  Wieviele Becher sind beim Gegner übrig geblieben?
                </Label>
                <Input
                  id="enemyCups"
                  type="text"
                  value={enemyCups}
                  onChange={(e) => setEnemyCups(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 items-start gap-4">
                <Label htmlFor="ownCups" className="text-left">
                  Wieviele Becher sind bei dir übrig geblieben?
                </Label>
                <Input
                  id="ownCups"
                  type="text"
                  value={ownCups}
                  onChange={(e) => setOwnCups(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 items-start gap-4">
                <Label htmlFor="winner" className="text-left">
                  Wer hat das Spiel gewonnen?
                </Label>
                <Select value={winner} onValueChange={setWinner}>
                  <SelectTrigger id="winner">
                    <SelectValue placeholder="Gewinnerteam auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={match.team1.id}>
                        {match.team1.name}
                      </SelectItem>
                      <SelectItem value={match.team2.id}>
                        {match.team2.name}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSendMatchResults} disabled={submitResult.isPending}>
                {submitResult.isPending ? "Wird eingetragen.." : "Eintragen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MatchInputsFinals({
  match,
  team,
  tournamentId,
}: {
  match: MatchStats;
  team: CurrentTeam;
  tournamentId: string;
}) {
  const utils = api.useUtils();
  const enemyTeam = match.team1.id === team.id ? match.team2 : match.team1;

  const { data: finalMatchesRunning } =
    api.finals.finalMatchesRunning.useQuery({ tournamentId });

  const [winner, setWinner] = useState<string>("");
  const [waitingForEnemy, setWaitingForEnemy] = useState<boolean>(false);

  const createNewFinals = api.finals.createNewFinalMatch.useMutation();
  const submitResult = api.match.enterResultFinals.useMutation({
    onSuccess: async (res) => {
      await utils.invalidate();
      if (res.created) {
        toast.info(
          "Das Ergebnis wurde eingetragen. Es muss noch durch deinen Gegner bestätigt werden.",
        );
        setWaitingForEnemy(true);
      } else {
        toast.success(
          "Das Ergebnis wurde erfolgreich abgeglichen. Das Spiel wurde vollständig gewertet.",
        );
      }

      if(finalMatchesRunning === 0) {
        createNewFinals.mutate({ tournamentId });
      }
    },
    onError: async (err) => {
      await utils.invalidate();
      toast.error("Es gab einen Fehler beim Eintragen des Ergebnis.", {
        description:
          err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler",
      });
    },
  });

  const handleSendMatchResults = () => {
    if (!winner) {
      toast.error("Du musst einen Gewinner eintragen.");
      return;
    }

    submitResult.mutate({
      winnerId: winner,
      matchId: match.id,
      team1Id: match.team1.id,
      creatorId: team.id,
      tournamentId,
    });
  };

  return (
    <div>
      {waitingForEnemy ? (
        <div>Warte auf Gegner..</div>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Ergebnis eintragen</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ergebnis eintragen</DialogTitle>
              <DialogDescription>
                Trage hier das Ergebnis gegen das Team{" "}
                <span className="font-bold">{enemyTeam.name}</span> ein
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 items-start gap-4">
                <Label htmlFor="winner" className="text-left">
                  Wer hat das Spiel gewonnen?
                </Label>
                <Select value={winner} onValueChange={setWinner}>
                  <SelectTrigger id="winner">
                    <SelectValue placeholder="Gewinnerteam auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={match.team1.id}>
                        {match.team1.name}
                      </SelectItem>
                      <SelectItem value={match.team2.id}>
                        {match.team2.name}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleSendMatchResults}
                disabled={submitResult.isPending}
              >
                {submitResult.isPending ? "Wird eingetragen.." : "Eintragen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MatchesTable({ teamId }: { teamId: string }) {
  const { data: matches, isLoading: isLoadingMatches } = api.match.getMatchesFromTeam.useQuery({ teamId });
  
  if(isLoadingMatches || !matches) return <p>Spiele werden geladen..</p>;

  const matchWon = (team1Id: string, team2Id: string, cupsTeam1: number, cupsTeam2: number) => {
    let won = false;

    switch(teamId) {
      case team1Id:
        if(cupsTeam1 !== 0) {
          won = true;
        }
        break;
      case team2Id:
        if (cupsTeam2 !== 0) {
          won = true;
        }
        break;
      default:
        won = false;
        break;
    }

    return won;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Spiel</TableHead>
          <TableHead>Becher</TableHead>
          <TableHead>Gewonnen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match, idx) => (
          <TableRow key={`${match.id}_${idx}`}>
            <TableCell>{`${match.team1.name} vs ${match.team2.name}`}</TableCell>
            <TableCell>{`${match.cupsTeam1 ?? 0}:${match.cupsTeam2 ?? 0}`}</TableCell>
            <TableCell>{match.done ? matchWon(match.team1.id, match.team2.id, match.cupsTeam1 ?? 0, match.cupsTeam2 ?? 0) ? <Check color="green" /> : <X color="red" /> : "Nicht gespielt"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}