import { LoginForm } from "@/components/login-form";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const error = params.error ? String(params.error) : null;

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {error && (
          <div className="mb-6 flex flex-col gap-2 text-center">
            <p>Dein Benutzername oder Code war falsch.</p>
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
