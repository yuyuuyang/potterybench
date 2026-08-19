export const STAGES = [
  "Greenware/Drying",
  "Leather-hard/Trimming",
  "Bisque Queue",
  "Glaze-fire Queue",
] as const

export type Stage = (typeof STAGES)[number]

export const STUDIO_CONDITIONS_OPTIONS = ["Dry", "Normal", "Humid"] as const
export type StudioConditions = (typeof STUDIO_CONDITIONS_OPTIONS)[number]
export const DEFAULT_STUDIO_CONDITIONS: StudioConditions = "Normal"

export const CLAY_BODY_OPTIONS = ["Earthenware", "Stoneware", "Porcelain", "Other"] as const
export type ClayBody = (typeof CLAY_BODY_OPTIONS)[number]
export const DEFAULT_CLAY_BODY: ClayBody = "Stoneware"

export const FORMING_METHOD_OPTIONS = ["Wheel-thrown", "Hand-built"] as const
export type FormingMethod = (typeof FORMING_METHOD_OPTIONS)[number]
export const DEFAULT_FORMING_METHOD: FormingMethod = "Wheel-thrown"

export type Piece = {
  id: number
  name: string
  stage: Stage
  stageSince: string // YYYY-MM-DD
  wallThickness: number | null // inches
  studioConditions: StudioConditions
  clayBody: ClayBody
  formingMethod: FormingMethod
  note: string | null
  createdAt: string
}

export function daysBetween(fromDate: string, toDate: string): number {
  const a = new Date(fromDate + "T00:00:00Z").getTime()
  const b = new Date(toDate + "T00:00:00Z").getTime()
  return Math.round((b - a) / 86_400_000)
}
