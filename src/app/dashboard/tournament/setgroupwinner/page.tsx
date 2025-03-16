"use client";

import { TournamentSkeleton } from "@/components/tournament-skeleton";
import { api } from "@/trpc/react";
import { UserRole } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupViewOverview = {
  name: string;
  teams: TeamViewOverview[];
};

type TeamViewOverview = {
  name: string;
  punkte: number;
  cups: number;
  id: string;
  enemyCups: number;
};

export default function SetGroupWinnerPage() {
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

  const { data: groups, isLoading: isLoadingGroups } =
    api.tournament.getGroups.useQuery(
      { id: tournamentId ?? "" },
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

  if (!isValidId || !tournament || !user || isLoadingGroups) {
    return <TournamentSkeleton />;
  }

  if (tournament.admin.id !== user.id && user.role !== UserRole.ADMIN) {
    return <p>Du hast keinen Zugriff auf diese Seite.</p>;
  }

  if (!groups) {
    return <p>Fehler beim Laden der Gruppen</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <SelectGroupWinnerForm tournamentId={tournament.id} groups={groups} />
    </div>
  );
}

function SelectGroupWinnerForm({
  tournamentId,
  groups,
}: {
  tournamentId: string;
  groups: GroupViewOverview[];
}) {
  const utils = api.useUtils();

  const submitGroupWinners = api.finals.setGroupWinners.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      toast.success("Das Turnier geht in die KO-Phase");
    },
    onError: (err) => {
      toast.error("Ein Fehler ist aufgetreten", {
        description:
          err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler",
      });
    },
  });

  const formSchema = useMemo(() => {
    const schema: Record<string, z.ZodTypeAny> = {};

    groups.forEach((group, idx) => {
      const groupLetter = String.fromCharCode(65 + idx); // A, B, C, ...
      schema[`firstGroup${groupLetter}`] = z
        .string()
        .nonempty({ message: "Bitte wähle einen Erstplatzierten." });
      schema[`secondGroup${groupLetter}`] = z
        .string()
        .nonempty({ message: "Bitte wähle einen Zweitplatzierten." });
    });

    return z.object(schema);
  }, [groups]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => {
      const defaultValues: Record<string, string> = {};
      groups.forEach((group, idx) => {
        const groupLetter = String.fromCharCode(65 + idx);
        defaultValues[`firstGroup${groupLetter}`] = "";
        defaultValues[`secondGroup${groupLetter}`] = "";
      });
      return defaultValues;
    }, [groups]),
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      submitGroupWinners.mutate({ tournamentId, groupWinners: values });
      console.log("Winners:", values);
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Fehler beim Formular.");
    }
  };

  const groupSelectFields = useMemo(() => {
    return groups.map((group, idx) => {
      const groupLetter = String.fromCharCode(65 + idx);
      return (
        <div className="grid grid-cols-12 gap-4" key={group.name}>
          <div className="col-span-6">
            <FormField
              control={form.control}
              name={`firstGroup${groupLetter}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gruppe {groupLetter} - 1. Platz</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="1. Platz auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {group.teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">
            <FormField
              control={form.control}
              name={`secondGroup${groupLetter}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gruppe {groupLetter} - 2. Platz</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="2. Platz auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {group.teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      );
    });
  }, [form.control, groups]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-3xl space-y-8 py-10"
      >
        {groupSelectFields}
        <Button
          type="submit"
          className="w-full"
          disabled={submitGroupWinners.isPending}
        >
          {submitGroupWinners.isPending ? "Wird gestartet.." : "Eintragen & Finals starten"}
        </Button>
      </form>
    </Form>
  );
}
