export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-4 sm:p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl font-semibold tracking-tight">
            ComplaintMe <span className="text-primary">AI</span>
          </span>
          <p className="text-muted-foreground text-sm">
            Tell us what happened. We&apos;ll understand the rest.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
