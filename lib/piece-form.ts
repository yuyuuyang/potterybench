import {
  STAGES,
  type Stage,
  type StudioConditions,
  type ClayBody,
  type FormingMethod,
} from "@/lib/stages"
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

export type PieceInput = {
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

export function parsePieceInput(
  formData: FormData,
): { ok: true; data: PieceInput } | { ok: false; error: string } {
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
