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
import { TurnierSize } from "@prisma/client";
import { type ChangeEvent, useState } from "react";
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

export default function DashboardPage() {
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [size, setSize] = useState<TurnierSize>(TurnierSize.EXTREME);

  const createTournament = api.tournament.create.useMutation({
    onSuccess: (res) => {
      router.push(`/dashboard/tournament/overview?id=${res.id}`);
    },
    onError: (err) => {
      console.error(err.shape?.message);
    },
  });

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
    createTournament.mutate({ name, size, code });
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
                <Label htmlFor="name">Turniername</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                <div className="flex items-center">
                  <Label htmlFor="size">Turniergröße</Label>
                </div>
                <Select
                  value={size}
                  onValueChange={(value) => setSize(value as TurnierSize)}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Turniergröße auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Turniergrößen</SelectLabel>
                      <SelectItem value="SMALL">8 Spieler | 4 Teams</SelectItem>
                      <SelectItem value="MEDIUM">
                        16 Spieler | 8 Teams
                      </SelectItem>
                      <SelectItem value="BIG">32 Spieler | 16 Teams</SelectItem>
                      <SelectItem value="EXTREME">
                        64 Spieler | 32 Teams
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createTournament.isPending}
                onClick={(e) => handleSubmit(e)}
              >
                {createTournament.isPending
                  ? "Turnier wird erstellt.."
                  : "Turnier erstellen"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
