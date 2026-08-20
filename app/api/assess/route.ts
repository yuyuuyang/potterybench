import { NextResponse } from "next/server"
import { assessPieces } from "@/lib/reasoning"
import type { Piece } from "@/lib/stages"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.pieces) || typeof body.today !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  try {
    const assessments = await assessPieces(body.pieces as Piece[], body.today)
    return NextResponse.json({ assessments })
  } catch (err) {
    console.error("[v0] reasoning failed:", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
