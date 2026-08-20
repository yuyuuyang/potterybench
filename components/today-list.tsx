import { PRIORITY_BADGE, type Piece, type Priority } from "@/lib/stages"
import type { Assessment } from "@/lib/reasoning"
import { TodayPieceCard } from "@/components/today-piece-card"
import { NoRushSection } from "@/components/no-rush-section"

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  soon: 1,
  "need-info": 2,
  "no-rush": 3,
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
              meta={PRIORITY_BADGE[assessment.priority]}
            />
          ))}
        </ol>
      ) : null}

      <NoRushSection
        items={noRush}
        today={today}
        meta={PRIORITY_BADGE["no-rush"]}
        defaultOpen={prominent.length === 0}
      />
    </div>
  )
}
