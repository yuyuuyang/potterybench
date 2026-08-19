import "server-only"
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import {
  STAGES,
  type Stage,
  type Piece,
  type StudioConditions,
  type ClayBody,
  type FormingMethod,
  DEFAULT_STUDIO_CONDITIONS,
  DEFAULT_CLAY_BODY,
  DEFAULT_FORMING_METHOD,
  daysBetween,
} from "./stages"

export { STAGES, daysBetween }
export type { Stage, Piece, StudioConditions, ClayBody, FormingMethod }

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "pieces.json")

async function readPieces(): Promise<Piece[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8")
    const pieces = JSON.parse(raw) as Piece[]
    // Backfill pieces logged before the structured fields existed.
    return pieces.map((p) => ({
      ...p,
      wallThickness: p.wallThickness ?? null,
      studioConditions: p.studioConditions ?? DEFAULT_STUDIO_CONDITIONS,
      clayBody: p.clayBody ?? DEFAULT_CLAY_BODY,
      formingMethod: p.formingMethod ?? DEFAULT_FORMING_METHOD,
    }))
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === "ENOENT") return []
    throw err
  }
}

async function writePieces(pieces: Piece[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(pieces, null, 2), "utf-8")
}

export async function getPieces(): Promise<Piece[]> {
  const pieces = await readPieces()
  return pieces.sort((a, b) => {
    const byStageSince = a.stageSince.localeCompare(b.stageSince)
    if (byStageSince !== 0) return byStageSince
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export async function insertPiece(input: {
  name: string
  stage: Stage
  stageSince: string
  wallThickness: number | null
  studioConditions: StudioConditions
  clayBody: ClayBody
  formingMethod: FormingMethod
  note: string | null
}): Promise<void> {
  const pieces = await readPieces()
  const nextId = pieces.reduce((max, piece) => Math.max(max, piece.id), 0) + 1

  pieces.push({
    id: nextId,
    name: input.name,
    stage: input.stage,
    stageSince: input.stageSince,
    wallThickness: input.wallThickness,
    studioConditions: input.studioConditions,
    clayBody: input.clayBody,
    formingMethod: input.formingMethod,
    note: input.note,
    createdAt: new Date().toISOString(),
  })

  await writePieces(pieces)
}

export async function deletePiece(id: number): Promise<void> {
  const pieces = await readPieces()
  await writePieces(pieces.filter((piece) => piece.id !== id))
}

export async function updatePiece(
  id: number,
  input: {
    name: string
    stage: Stage
    stageSince: string
    wallThickness: number | null
    studioConditions: StudioConditions
    clayBody: ClayBody
    formingMethod: FormingMethod
    note: string | null
  },
): Promise<void> {
  const pieces = await readPieces()
  const index = pieces.findIndex((piece) => piece.id === id)
  if (index === -1) throw new Error(`Piece ${id} not found`)

  pieces[index] = {
    ...pieces[index],
    name: input.name,
    stage: input.stage,
    stageSince: input.stageSince,
    wallThickness: input.wallThickness,
    studioConditions: input.studioConditions,
    clayBody: input.clayBody,
    formingMethod: input.formingMethod,
    note: input.note,
  }

  await writePieces(pieces)
}
