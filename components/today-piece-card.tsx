"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Check, Pencil } from "lucide-react"
import { advancePieceAction, updatePieceAction, type EditPieceState } from "@/app/actions"
import { daysBetween, type Piece } from "@/lib/stages"
import type { Assessment } from "@/lib/reasoning"
import { PieceFormFields } from "@/components/piece-form-fields"
import { PieceIcon } from "@/components/piece-icon"

function AdvanceCheckButton({ pieceId }: { pieceId: number }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  async function handleClick() {
    if (confirming) return
    setConfirming(true)
    const formData = new FormData()
    formData.set("id", String(pieceId))
    await new Promise((resolve) => setTimeout(resolve, 450))
    await advancePieceAction(formData)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={confirming}
      aria-label="Advance to next stage"
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
        confirming ? "bg-primary text-primary-foreground" : "bg-transparent text-primary hover:bg-primary/10"
      }`}
    >
      <Check className="size-3.5" aria-hidden="true" />
    </button>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#A9702F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  )
}

function stageSinceLabel(piece: Piece, today: string) {
  const days = daysBetween(piece.stageSince, today)
  if (days <= 0) return "since today"
  if (days === 1) return "1 day"
  return `${days} days`
}

export function TodayPieceCard({
  piece,
  assessment,
  today,
  meta,
}: {
  piece: Piece
  assessment: Assessment
  today: string
  meta: { label: string; dot: string; chip: string }
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState<EditPieceState, FormData>(updatePieceAction, {
    error: null,
    success: false,
  })

  useEffect(() => {
    if (state.success) {
      setOpen(false)
      router.refresh()
    }
  }, [state.success, router])

  return (
    <li
      id={`piece-${piece.id}`}
      className="scroll-mt-4 rounded-lg border border-border bg-card p-4 shadow-[0_2px_8px_rgba(169,112,47,0.08)] transition-colors hover:border-primary/30 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-[#FFFDF9]"
              aria-hidden="true"
            >
              <PieceIcon name={piece.name} size={18} />
            </div>
            <h3 className="font-serif text-base font-semibold leading-tight text-balance">
              {piece.name}
            </h3>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded border-2 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${meta.chip}`}
            >
              <span className={`size-1.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
              {assessment.headline}
            </span>
            {assessment.priority === "urgent" || assessment.priority === "soon" ? (
              <AdvanceCheckButton pieceId={piece.id} />
            ) : null}
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-foreground/90 text-pretty">
            {assessment.reason}
          </p>

          {assessment.priority === "no-rush" && assessment.checkBackIn ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Check back {assessment.checkBackIn}
            </p>
          ) : null}

          {assessment.priority === "need-info" && assessment.question ? (
            <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-sm leading-relaxed text-secondary-foreground">
              <span className="font-medium">Quick question: </span>
              {assessment.question}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
            <span>{piece.stage}</span>
            <span aria-hidden="true">·</span>
            <span>{stageSinceLabel(piece, today)} in stage</span>
            {piece.note ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="italic">&ldquo;{piece.note}&rdquo;</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? `Cancel editing ${piece.name}` : `Edit ${piece.name}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded p-1.5 text-xs text-foreground/45 transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{open ? "Cancel" : "Edit"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <form
          action={formAction}
          className="mt-4 border-t border-border pt-4"
        >
          <input type="hidden" name="id" value={piece.id} />
          <p className="mb-4 text-sm font-medium">Update piece</p>
          <div className="flex flex-col gap-4">
            <PieceFormFields piece={piece} today={today} idPrefix={`edit-${piece.id}-`} />
          </div>

          {state.error ? (
            <p className="mt-4 rounded-md border border-clay/30 bg-clay/10 px-3 py-2 text-sm text-clay">
              {state.error}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <SaveButton />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </li>
  )
}
