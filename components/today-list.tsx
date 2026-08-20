import type { Piece } from "@/lib/stages"
import type { Assessment, Priority } from "@/lib/reasoning"
import { TodayPieceCard } from "@/components/today-piece-card"
import { NoRushSection } from "@/components/no-rush-section"

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  soon: 1,
  "need-info": 2,
  "no-rush": 3,
}

const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; chip: string }
> = {
  urgent: {
    label: "Today",
    dot: "bg-clay",
    chip: "border-clay/40 bg-clay/15 text-clay",
  },
  soon: {
    label: "Soon",
    dot: "bg-primary",
    chip: "border-primary/40 bg-primary/15 text-primary",
  },
  "need-info": {
    label: "Needs detail",
    dot: "bg-foreground/40",
    chip: "border-border bg-secondary text-foreground/70",
  },
  "no-rush": {
    label: "No rush",
    dot: "bg-sage",
    chip: "border-sage/40 bg-sage/15 text-sage-foreground",
  },
}

export function TodayList({
  pieces,
  assessments,
  today,
}: {
  pieces: Piece[]
  assessments: Assessment[]
  today: string
}) {
  const byId = new Map(pieces.map((p) => [p.id, p]))
  const merged = assessments
    .map((a) => ({ assessment: a, piece: byId.get(a.pieceId) }))
    .filter((m): m is { assessment: Assessment; piece: Piece } => Boolean(m.piece))
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.assessment.priority] - PRIORITY_ORDER[b.assessment.priority],
    )

  const prominent = merged.filter((m) => m.assessment.priority !== "no-rush")
  const noRush = merged.filter((m) => m.assessment.priority === "no-rush")

  return (
    <div className="flex flex-col gap-4">
      {prominent.length > 0 ? (
        <ol className="flex flex-col gap-3">
          {prominent.map(({ assessment, piece }) => (
            <TodayPieceCard
              key={piece.id}
              piece={piece}
              assessment={assessment}
              today={today}
              meta={PRIORITY_META[assessment.priority]}
            />
          ))}
        </ol>
      ) : null}

      <NoRushSection
        items={noRush}
        today={today}
        meta={PRIORITY_META["no-rush"]}
        defaultOpen={prominent.length === 0}
      />
    </div>
  )
}
