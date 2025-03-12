"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { type ChangeEvent, useEffect, useState } from "react";
import { type MouseEvent } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Player = {
    id: string;
    name: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [code, setCode] = useState<string>("");
  const [teamname, setTeamname] = useState<string>("");
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);

  const { data: user } = api.user.get.useQuery();
  const { data: players, isLoading: isLoadingPlayers } = api.user.getAvailablePlayers.useQuery({ code });
  const joinTournament = api.tournament.join.useMutation({
    onSuccess: (res) => {
        router.push(`/dashboard/tournament/overview?id=${res.turnierId}`);
        toast.success(`Dein Team "${teamname}" ist dem Turnier beigetreten`);
    },
    onError: (err) => {
        console.error(err.shape?.message);
        toast.error("Da ist wohl etwas schiefgelaufen", {
            description: err.shape?.message ?? "Unbekannter Fehler",
        });
    }
  });

  useEffect(() => {
    setAvailablePlayers(players ?? []);
    if(user) {
        if (players?.find((player) => player.id === user?.id)) {
          setPlayer1(user.id);
        } else {
            setPlayer1("");
        }
    }
  }, [user, code, players]);

  const handleChangeCode = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // 1. Umlaute ersetzen
    value = value.replace(/ä/g, "ae");
    value = value.replace(/ö/g, "oe");
    value = value.replace(/ü/g, "ue");
    value = value.replace(/Ä/g, "Ae");
    value = value.replace(/Ö/g, "Oe");
    value = value.replace(/Ü/g, "Ue");
    value = value.replace(/ß/g, "ss");

    // 2. Leerzeichen entfernen
    value = value.replace(/\s/g, "");

    // 3. Sonderzeichen entfernen (nur Buchstaben und Zahlen erlauben)
    value = value.replace(/[^a-zA-Z0-9]/g, "");

    setCode(value);
  };

  const handleSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    joinTournament.mutate({ code, player1, player2, teamname });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Turnier erstellen</CardTitle>
          <CardDescription>
            Hier kannst du ein Turnier erstellen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="code">Beitrittscode</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={handleChangeCode}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Teamname</Label>
                <Input
                  id="name"
                  type="text"
                  value={teamname}
                  onChange={(e) => setTeamname(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="player1">Spieler 1</Label>
                <Select value={player1} onValueChange={setPlayer1}>
                  <SelectTrigger id="player1">
                    <SelectValue placeholder={isLoadingPlayers ? "Spieler werden geladen.." : "Spieler 1 auswählen"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Verfügbare Spieler</SelectLabel>
                      {availablePlayers.filter((player) => player.id !== player2).map((player, idx) => (
                        <SelectItem key={`player1_${idx}`} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="player2">Spieler 2</Label>
                <Select value={player2} onValueChange={setPlayer2}>
                  <SelectTrigger id="player2">
                    <SelectValue placeholder={isLoadingPlayers ? "Spieler werden geladen.." : "Spieler 2 auswählen"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Verfügbare Spieler</SelectLabel>
                      {availablePlayers.filter((player) => player.id !== player1).map((player, idx) => (
                        <SelectItem key={`player2_${idx}`} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={joinTournament.isPending}
                onClick={(e) => handleSubmit(e)}
              >
                {joinTournament.isPending
                  ? "Trete Turnier bei.."
                  : "Turnier beitreten"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
