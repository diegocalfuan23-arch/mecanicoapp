import Link from "next/link";

export function MarcoAuth({
  titulo,
  bajada,
  children,
  pie,
}: {
  titulo: string;
  bajada: string;
  children: React.ReactNode;
  pie: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Mecanico<span className="text-primary">App</span>
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pt-8 pb-24 sm:items-center sm:pt-0 sm:pb-32">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          <p className="mt-2 text-muted-foreground">{bajada}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {pie}
          </p>
        </div>
      </main>
    </div>
  );
}

export function Campo({
  etiqueta,
  error,
  ayuda,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  error?: string;
  ayuda?: React.ReactNode;
}) {
  const idError = error ? `${props.name}-error` : undefined;

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">{etiqueta}</span>
        <input
          {...props}
          aria-invalid={!!error}
          aria-describedby={idError}
          className={`w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] transition-colors outline-none placeholder:text-muted-foreground/60 focus:ring-1 ${
            error
              ? "border-destructive/70 focus:border-destructive focus:ring-destructive/30"
              : "border-border focus:border-primary/60 focus:ring-primary/30"
          }`}
        />
      </label>
      {ayuda}
      {error && (
        <p id={idError} className="mt-1.5 text-[12px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
