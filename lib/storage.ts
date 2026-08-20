"use client"

import { useEffect, useState } from "react"
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

const STORAGE_KEY = "studio-bench:pieces"
const PIECES_CHANGED_EVENT = "studio-bench:pieces-changed"

function readPieces(): Piece[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const pieces = JSON.parse(raw) as Piece[]
    // Backfill pieces logged before the structured fields existed.
    return pieces.map((p) => ({
      ...p,
      wallThickness: p.wallThickness ?? null,
      studioConditions: p.studioConditions ?? DEFAULT_STUDIO_CONDITIONS,
      clayBody: p.clayBody ?? DEFAULT_CLAY_BODY,
      formingMethod: p.formingMethod ?? DEFAULT_FORMING_METHOD,
    }))
  } catch {
    return []
  }
}

function writePieces(pieces: Piece[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pieces))
  window.dispatchEvent(new Event(PIECES_CHANGED_EVENT))
}

export function getPieces(): Piece[] {
  const pieces = readPieces()
  return pieces.sort((a, b) => {
    const byStageSince = a.stageSince.localeCompare(b.stageSince)
    if (byStageSince !== 0) return byStageSince
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export function insertPiece(input: {
  name: string
  stage: Stage
  stageSince: string
  wallThickness: number | null
  studioConditions: StudioConditions
  clayBody: ClayBody
  formingMethod: FormingMethod
  note: string | null
}): void {
  const pieces = readPieces()
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

  writePieces(pieces)
}

export function deletePiece(id: number): void {
  const pieces = readPieces()
  writePieces(pieces.filter((piece) => piece.id !== id))
}

export function updatePiece(
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
): void {
  const pieces = readPieces()
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

  writePieces(pieces)
}

export function advancePiece(id: number): void {
  const pieces = readPieces()
  const piece = pieces.find((p) => p.id === id)
  if (!piece) return

  const nextStage = STAGES[STAGES.indexOf(piece.stage) + 1]

  if (!nextStage) {
    // Advancing past Glaze-fire Queue means the piece is complete — drop it
    // from active tracking rather than adding an archive/history view.
    writePieces(pieces.filter((p) => p.id !== id))
  } else {
    const index = pieces.findIndex((p) => p.id === id)
    pieces[index] = {
      ...piece,
      stage: nextStage,
      stageSince: new Date().toISOString().slice(0, 10),
    }
    writePieces(pieces)
  }
}

// Reads pieces from localStorage on mount and keeps them in sync with
// mutations made via this module (same tab) or other tabs (storage event).
export function usePieces(): { pieces: Piece[]; ready: boolean } {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPieces(getPieces())
    setReady(true)

    function handleChange() {
      setPieces(getPieces())
    }

    window.addEventListener(PIECES_CHANGED_EVENT, handleChange)
    window.addEventListener("storage", handleChange)
    return () => {
      window.removeEventListener(PIECES_CHANGED_EVENT, handleChange)
      window.removeEventListener("storage", handleChange)
    }
  }, [])

  return { pieces, ready }
}
