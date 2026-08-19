import Link from "next/link"

export function SiteHeader({ active }: { active: "today" | "log" }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="#C17A3E"
            fillOpacity="0.1"
            stroke="#A9702F"
            strokeWidth="1.3"
            strokeLinejoin="round"
            strokeLinecap="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M10 3h4c.6 0 1 .5.9 1.1l-.3 1.7c2.1 1.7 3.4 4.3 3.4 7.2 0 2.3-.9 4.4-2.3 6l.3 1c.3 1.1-.5 2-1.6 2H9.6c-1.1 0-1.9-.9-1.6-2l.3-1c-1.4-1.6-2.3-3.7-2.3-6 0-2.9 1.3-5.5 3.4-7.2l-.3-1.7C9 3.5 9.4 3 10 3z" />
          </svg>
          <span className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">Studio Bench</span>
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">/ pottery queue</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className={`rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              active === "today"
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            Today
          </Link>
          <Link
            href="/log"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#A9702F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Log a piece
          </Link>
        </nav>
      </div>
    </header>
  )
}
