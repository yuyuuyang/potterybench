"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import type { Piece } from "@/lib/stages"
import type { Assessment } from "@/lib/reasoning"
import { TodayPieceCard } from "@/components/today-piece-card"

export function NoRushSection({
  items,
  today,
  meta,
  defaultOpen,
}: {
  items: { assessment: Assessment; piece: Piece }[]
  today: string
  meta: { label: string; dot: string; chip: string }
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    function handleReveal(event: Event) {
      const pieceId = (event as CustomEvent<{ pieceId: number }>).detail?.pieceId
      if (items.some((item) => item.piece.id === pieceId)) {
        setOpen(true)
      }
    }
    window.addEventListener("studio-pipeline:reveal", handleReveal)
    return () => window.removeEventListener("studio-pipeline:reveal", handleReveal)
  }, [items])

  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center justify-between gap-3 rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-left text-sm text-sage-foreground transition-colors hover:bg-sage/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span>
          {items.length} {items.length === 1 ? "piece" : "pieces"} resting, nothing urgent — tap to see
        </span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ol className="flex flex-col gap-3">
          {items.map(({ assessment, piece }) => (
            <TodayPieceCard key={piece.id} piece={piece} assessment={assessment} today={today} meta={meta} />
          ))}
        </ol>
      ) : null}
    </div>
  )
}
