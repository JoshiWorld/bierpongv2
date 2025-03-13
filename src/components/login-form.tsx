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
import { signIn } from "next-auth/react";
import { type MouseEvent } from "react";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  // const router = useRouter();
  const [name, setName] = useState<string>("");
  const [otp, setOtp] = useState<string>("");

  const handleLogin = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const result = await signIn("credentials", {
      redirect: true,
      username: name,
      otp,
      redirectTo: '/dashboard'
    });

    console.log('RESULT:', result);

    // if(result?.ok) {
    //   router.push('/dashboard');
    // } else {
    //   console.error(result);
    //   toast.error("Es gab einen Fehler beim Anmelden.", {
    //     description: result?.error ?? result?.code ?? "Unbekannter Fehler"
    //   });
    // }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Anmelden</CardTitle>
          <CardDescription>
            Wenn du keinen Code bekommen hast, wende dich bitte an den
            Turnierleiter.
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Code</Label>
                </div>
                <InputOTP maxLength={6} value={otp} onChange={setOtp} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" onClick={(e) => handleLogin(e)}>
                Anmelden
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Oder Spielerkonto erstellen:{" "}
              <a href="/signup" className="underline underline-offset-4">
                Spielerkonto erstellen
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
