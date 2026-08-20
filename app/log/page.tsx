"use client"

import { SiteHeader } from "@/components/site-header"
import { AddPieceForm } from "@/components/add-piece-form"
import { usePieces, deletePiece } from "@/lib/storage"

export default function LogPage() {
  const { pieces, ready } = usePieces()

  return (
    <div className="min-h-dvh">
      <SiteHeader active="log" />
      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <h1 className="text-2xl tracking-tight text-balance">
              Log a piece
            </h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground text-pretty">
              Record where a piece is right now. Today reasons about the rest.
            </p>
            <AddPieceForm />
          </div>

          <aside>
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              On the bench ({ready ? pieces.length : 0})
            </h2>
            {!ready || pieces.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing logged yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {pieces.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-border bg-card p-3 shadow-[0_2px_8px_rgba(169,112,47,0.08)] transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {p.stage}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deletePiece(p.id)}
                        aria-label={`Remove ${p.name}`}
                        className="rounded p-1 text-foreground/35 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
