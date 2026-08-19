"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  getPieces,
  insertPiece,
  deletePiece,
  updatePiece,
  STAGES,
  type Stage,
  type StudioConditions,
  type ClayBody,
  type FormingMethod,
} from "@/lib/db"
import {
  STUDIO_CONDITIONS_OPTIONS,
  DEFAULT_STUDIO_CONDITIONS,
  CLAY_BODY_OPTIONS,
  DEFAULT_CLAY_BODY,
  FORMING_METHOD_OPTIONS,
  DEFAULT_FORMING_METHOD,
} from "@/lib/stages"

export type AddPieceState = { error: string | null }
export type EditPieceState = { error: string | null; success: boolean }

type PieceInput = {
  name: string
  stage: Stage
  stageSince: string
  wallThickness: number | null
  studioConditions: StudioConditions
  clayBody: ClayBody
  formingMethod: FormingMethod
  note: string | null
}

function parseOption<T extends string>(
  value: FormDataEntryValue | null,
  options: readonly T[],
  fallback: T,
): T {
  const raw = String(value ?? "")
  return (options as readonly string[]).includes(raw) ? (raw as T) : fallback
}

function parseWallThickness(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parsePieceInput(formData: FormData): { ok: true; data: PieceInput } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim()
  const stage = String(formData.get("stage") ?? "") as Stage
  const stageSince = String(formData.get("stageSince") ?? "").trim()
  const noteRaw = String(formData.get("note") ?? "").trim()

  if (!name) return { ok: false, error: "Give the piece a name or description." }
  if (!STAGES.includes(stage)) return { ok: false, error: "Pick a valid stage." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stageSince)) {
    return { ok: false, error: "Enter the date it entered this stage." }
  }

  return {
    ok: true,
    data: {
      name,
      stage,
      stageSince,
      wallThickness: parseWallThickness(formData.get("wallThickness")),
      studioConditions: parseOption(
        formData.get("studioConditions"),
        STUDIO_CONDITIONS_OPTIONS,
        DEFAULT_STUDIO_CONDITIONS,
      ),
      clayBody: parseOption(formData.get("clayBody"), CLAY_BODY_OPTIONS, DEFAULT_CLAY_BODY),
      formingMethod: parseOption(formData.get("formingMethod"), FORMING_METHOD_OPTIONS, DEFAULT_FORMING_METHOD),
      note: noteRaw ? noteRaw : null,
    },
  }
}

export async function addPieceAction(_prev: AddPieceState, formData: FormData): Promise<AddPieceState> {
  const parsed = parsePieceInput(formData)
  if (!parsed.ok) return { error: parsed.error }

  await insertPiece(parsed.data)

  revalidatePath("/")
  revalidatePath("/log")
  redirect("/")
}

export async function updatePieceAction(_prev: EditPieceState, formData: FormData): Promise<EditPieceState> {
  const id = Number(formData.get("id"))
  if (!Number.isFinite(id)) return { error: "Invalid piece.", success: false }

  const parsed = parsePieceInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: false }

  try {
    await updatePiece(id, parsed.data)
  } catch {
    return { error: "That piece could not be found.", success: false }
  }

  revalidatePath("/")
  revalidatePath("/log")
  return { error: null, success: true }
}

export async function deletePieceAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"))
  if (Number.isFinite(id)) {
    await deletePiece(id)
    revalidatePath("/")
    revalidatePath("/log")
  }
}

export async function advancePieceAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"))
  if (!Number.isFinite(id)) return

  const pieces = await getPieces()
  const piece = pieces.find((p) => p.id === id)
  if (!piece) return

  const nextStage = STAGES[STAGES.indexOf(piece.stage) + 1]

  if (!nextStage) {
    // Advancing past Glaze-fire Queue means the piece is complete — drop it
    // from active tracking rather than adding an archive/history view.
    await deletePiece(id)
  } else {
    await updatePiece(id, {
      name: piece.name,
      stage: nextStage,
      stageSince: new Date().toISOString().slice(0, 10),
      wallThickness: piece.wallThickness,
      studioConditions: piece.studioConditions,
      clayBody: piece.clayBody,
      formingMethod: piece.formingMethod,
      note: piece.note,
    })
  }

  revalidatePath("/")
  revalidatePath("/log")
}
