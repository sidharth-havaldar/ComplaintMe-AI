import { RedirectIfAuthed } from "@/components/auth/auth-guard";
import { Wordmark } from "@/components/logo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RedirectIfAuthed>
      <main className="bg-ambient relative flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-6">
        {/* Decorative top glow — purely presentational */}
        <div
          aria-hidden="true"
          className="bg-brand/10 pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full blur-3xl"
        />
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 relative flex w-full max-w-sm flex-col gap-7 duration-500">
          <div className="flex flex-col items-center gap-3 text-center">
            <Wordmark className="flex-col gap-3 [&>span:last-child]:text-xl" />
            <p className="text-muted-foreground text-sm text-balance">
              Tell us what happened. We&apos;ll understand the rest.
            </p>
          </div>
          {children}
        </div>
      </main>
    </RedirectIfAuthed>
  );
}
