"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";
import { Code, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const utils = api.useUtils();
  const { data: users, isLoading: isLoadingUsers } = api.user.getAll.useQuery();

  const deleteUser = api.user.delete.useMutation({
    onSuccess: async (res) => {
      await utils.user.invalidate();
      toast.info(`Der Benutzer "${res.name}" wurde gelöscht.`);
    },
    onError: (err) => {
      toast.error("Es gab einen Fehler beim Löschen des Benutzers.", {
        description:
          err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler",
      });
    },
  });

  const generateOtp = api.otp.create.useMutation({
    onSuccess: (code) => {
      console.info("Generierter Code:", code);
      toast("Es wurde ein neuer Code generiert.", {
        description: code,
        action: {
          label: "Code kopieren",
          onClick: () => {
            navigator.clipboard.writeText(code).catch((err) => {
              console.error(err);
              toast.error("Fehler beim Kopieren des Codes.", {
                description: String(err) ?? "Unbekannter Fehler",
              });
            });
          },
        },
      });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Es gab einen Fehler beim Generieren vom neuen Code.", {
        description:
          err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler",
      });
    },
  });

  const sendNotification = api.notifications.send.useMutation({
    onSuccess: () => {
      console.info("Push-Benachrichtigung wurde gesendet");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Es gab einen Fehler beim Senden der Benachrichtigung", {
        description:
          err.shape?.message ?? err.shape?.code ?? "Unbekannter Fehler",
      });
    },
  });

  if (!users || isLoadingUsers) return <p>Lade Nutzer..</p>;

  const handleDeleteUser = (userId: string) => {
    deleteUser.mutate({ id: userId });
  };

  const handleGenerateOtp = (name: string) => {
    generateOtp.mutate({ name });
  };

  return (
    <div className="flex flex-col">
      <Button className="my-4" onClick={() => sendNotification.mutate({ message: "Test Nachricht", title: "Test-Titel" })} disabled={sendNotification.isPending}>Test-Benachrichtigung senden</Button>
      <div className="flex items-center justify-center">
        <Table>
          <TableCaption>{`Anzahl der Teams: ${users.length}`}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Team-Name</TableHead>
              <TableHead className="text-center">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, idx) => (
              <TableRow key={`${user.name}_${idx}`}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      type="submit"
                      variant={"secondary"}
                      size="sm"
                      className="px-3"
                      disabled={generateOtp.isPending}
                      onClick={() => handleGenerateOtp(user.name)}
                    >
                      <span className="sr-only">Code generieren</span>
                      <Code />
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      className="px-3"
                      disabled={deleteUser.isPending}
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <span className="sr-only">Entfernen</span>
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
