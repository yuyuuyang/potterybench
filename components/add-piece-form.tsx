"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { parsePieceInput, type AddPieceState } from "@/lib/piece-form"
import { insertPiece } from "@/lib/storage"
import { PieceFormFields } from "@/components/piece-form-fields"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#A9702F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
    >
      {pending ? "Logging…" : "Log piece"}
    </button>
  )
}

export function AddPieceForm() {
  const router = useRouter()
  const [state, formAction] = useActionState<AddPieceState, FormData>(
    (_prev, formData) => {
      const parsed = parsePieceInput(formData)
      if (!parsed.ok) return { error: parsed.error }
      insertPiece(parsed.data)
      router.push("/")
      return { error: null }
    },
    { error: null },
  )
  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <PieceFormFields today={today} />

      {state.error ? (
        <p className="rounded-md border border-clay/30 bg-clay/10 px-3 py-2 text-sm text-clay">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton />
      </div>
    </form>
  )
}
