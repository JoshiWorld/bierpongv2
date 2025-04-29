"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { api } from "@/trpc/react"
import { type MouseEvent } from "react";
import { Copy } from "lucide-react";
import Link from "next/link";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [name, setName] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const createUser = api.user.create.useMutation({
    onSuccess: (res) => {
      setOtp(res);
    },
    onError: (err) => {
      setError(err.shape?.message ?? "Unbekannter Fehler");
    }
  })

  const handleSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name) return;
    createUser.mutate({ name });
  };

  const copyToClipboard = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      await navigator.clipboard.writeText(otp);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {error && (
        <Card className="bg-red-800">
          <CardHeader>
            <CardTitle>Fehler beim erstellen von deinem Spielerkonto</CardTitle>
            <CardDescription className="dark:text-white">
              {error}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {otp ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Dein Code</CardTitle>
            <CardDescription>
              Das ist dein Code für den Login. Dieser ist für 15 Minuten gültig.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col items-center gap-6">
                <div className="flex justify-center gap-3">
                  <p className="text-xl">{otp}</p>
                  <button
                    onClick={(e) => copyToClipboard(e)}
                    className="focus:outline-none"
                    aria-label="Copy to clipboard"
                  >
                    <Copy className="h-5 w-5 cursor-pointer text-gray-500 hover:text-gray-700" />
                  </button>
                  {isCopied && (
                    <span className="text-green-500">Code kopiert!</span>
                  )}
                </div>
                <Button className="w-full">
                  <Link href="/login">Zum Login</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Spielerkonto erstellen</CardTitle>
            <CardDescription>
              Gib deinen Spielernamen ein und du bekommst ein Einmalpasswort zum
              Login angezeigt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Spielername</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createUser.isPending}
                  onClick={(e) => handleSubmit(e)}
                >
                  {createUser.isPending ? "Wird erstellt.." : "Erstellen"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Oder einloggen:{" "}
                <a href="/login" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
