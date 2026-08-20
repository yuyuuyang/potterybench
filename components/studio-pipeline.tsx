"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { daysBetween, PRIORITY_BADGE, STAGES, type Piece, type Priority } from "@/lib/stages"
import type { Assessment } from "@/lib/reasoning"
import { PieceIcon } from "@/components/piece-icon"

const MIN_GAP_PX = 30

function windowPositionPercent(piece: Piece, assessment: Assessment | undefined, today: string): number {
  const isWindowed = piece.stage === "Greenware/Drying" || piece.stage === "Leather-hard/Trimming"
  if (!isWindowed) return 50

  const windowDays = assessment?.estimatedWindowDays
  if (!windowDays || windowDays <= 0) return 50

  const daysIn = daysBetween(piece.stageSince, today)
  const ratio = Math.min(1, Math.max(0, daysIn / windowDays))
  return 8 + ratio * 84 // keep the marker inside the segment, away from its edges
}

type StageItem = { piece: Piece; assessment: Assessment; percent: number }
type PlacedItem = StageItem & { displayPercent: number }

// Group pieces whose ideal position is within MIN_GAP_PX of a neighbor, then
// spread each such cluster out evenly (in on-screen pixels, converted back to
// %) around its center — preserving left-to-right order — instead of letting
// them overlap.
function placeItems(items: StageItem[], segmentWidthPx: number | null): PlacedItem[] {
  const sorted = [...items].sort((a, b) => a.percent - b.percent)

  if (!segmentWidthPx) {
    return sorted.map((item) => ({ ...item, displayPercent: item.percent }))
  }

  const minGapPercent = (MIN_GAP_PX / segmentWidthPx) * 100

  const clusters: StageItem[][] = []
  for (const item of sorted) {
    const cluster = clusters[clusters.length - 1]
    const prev = cluster?.[cluster.length - 1]
    if (cluster && prev && item.percent - prev.percent < minGapPercent) {
      cluster.push(item)
    } else {
      clusters.push([item])
    }
  }

  return clusters.flatMap((cluster) => {
    if (cluster.length === 1) {
      return [{ ...cluster[0], displayPercent: cluster[0].percent }]
    }
    const center = cluster.reduce((sum, item) => sum + item.percent, 0) / cluster.length
    return cluster.map((item, index) => {
      const offset = (index - (cluster.length - 1) / 2) * minGapPercent
      const displayPercent = Math.min(94, Math.max(6, center + offset))
      return { ...item, displayPercent }
    })
  })
}

function ringClasses(priority: Priority): string {
  if (priority === "urgent") return "ring-2 ring-[#C17A3E] pipeline-urgent-pulse"
  if (priority === "soon") return "ring-2 ring-[#C17A3E]"
  if (priority === "no-rush") return "ring-2 ring-[#9CAD8E]"
  return "ring-2 ring-muted-foreground/50"
}

function revealPiece(pieceId: number) {
  window.dispatchEvent(new CustomEvent("studio-pipeline:reveal", { detail: { pieceId } }))
  window.setTimeout(() => {
    const el = document.getElementById(`piece-${pieceId}`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    el.classList.add("pipeline-highlight")
    window.setTimeout(() => el.classList.remove("pipeline-highlight"), 1500)
  }, 80)
}

export function StudioPipeline({
  pieces,
  assessments,
  today,
}: {
  pieces: Piece[]
  assessments: Assessment[]
  today: string
}) {
  const segmentRef = useRef<HTMLDivElement>(null)
  const [segmentWidth, setSegmentWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = segmentRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setSegmentWidth(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const assessmentByPieceId = new Map(assessments.map((a) => [a.pieceId, a]))
  const itemsByStage = new Map<string, StageItem[]>()
  for (const stage of STAGES) itemsByStage.set(stage, [])
  for (const piece of pieces) {
    const assessment = assessmentByPieceId.get(piece.id)
    if (!assessment) continue
    itemsByStage.get(piece.stage)?.push({
      piece,
      assessment,
      percent: windowPositionPercent(piece, assessment, today),
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-[0_2px_8px_rgba(169,112,47,0.08)] sm:p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Studio pipeline</h2>

      <div className="mt-4 flex divide-x divide-border rounded-md border border-border">
        {STAGES.map((stage, index) => (
          <div
            key={stage}
            ref={index === 0 ? segmentRef : undefined}
            className="relative h-16 flex-1 bg-secondary/40 first:rounded-l-md last:rounded-r-md"
          >
            {placeItems(itemsByStage.get(stage)!, segmentWidth).map(({ piece, assessment, displayPercent }) => (
              <div
                key={piece.id}
                className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${displayPercent}%` }}
              >
                <button
                  type="button"
                  onClick={() => revealPiece(piece.id)}
                  aria-label={`${piece.name} — ${PRIORITY_BADGE[assessment.priority].label}`}
                  className={`flex size-6 items-center justify-center rounded-full border border-[#FFFDF9] bg-[#FFFDF9] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${ringClasses(assessment.priority)}`}
                >
                  <PieceIcon name={piece.name} size={14} />
                </button>

                {assessment.priority === "urgent" ? (
                  <span
                    className="pointer-events-none absolute -top-1 -right-1 size-2 rounded-full border border-[#FFFDF9] bg-[#C17A3E]"
                    aria-hidden="true"
                  />
                ) : null}

                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#E8DDD0] bg-[#FFFDF9] px-2 py-1 font-sans text-xs text-[#3E2C22] opacity-0 shadow-[0_2px_8px_rgba(169,112,47,0.12)] transition-opacity duration-150 group-hover:opacity-100"
                >
                  {piece.name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex">
        {STAGES.map((stage) => (
          <p
            key={stage}
            className="flex-1 px-1 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            {stage}
          </p>
        ))}
      </div>
    </div>
  )
}
