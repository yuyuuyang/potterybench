"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { TodayList } from "@/components/today-list"
import { StudioPipeline } from "@/components/studio-pipeline"
import { usePieces } from "@/lib/storage"
import type { Assessment } from "@/lib/reasoning"

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function longDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export default function TodayPage() {
  const today = todayString()
  const { pieces, ready } = usePieces()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [reasoningError, setReasoningError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (pieces.length === 0) {
      setAssessments([])
      setReasoningError(null)
      return
    }

    let cancelled = false
    setReasoningError(null)

    fetch("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pieces, today }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? `Request failed with ${res.status}`)
        return body as { assessments: Assessment[] }
      })
      .then((body) => {
        if (cancelled) return
        setAssessments(body.assessments)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("[v0] reasoning failed:", err)
        const msg = err instanceof Error ? err.message : String(err)
        setReasoningError(
          /GEMINI_API_KEY|API key|api_key|invalid.*key|401|403/i.test(msg)
            ? "Gemini can't be reached — check that GEMINI_API_KEY is set and redeploy."
            : "Couldn't reason about your pieces just now. Refresh to try again.",
        )
      })

    return () => {
      cancelled = true
    }
  }, [ready, pieces, today])

  const attentionCount = assessments.filter(
    (a) => a.priority === "urgent" || a.priority === "soon",
  ).length

  return (
    <div className="min-h-dvh">
      <SiteHeader active="today" />
      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {longDate(today)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
              What needs attention today
            </h1>
            {ready && pieces.length > 0 && !reasoningError ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {attentionCount > 0
                  ? `${attentionCount} of ${pieces.length} ${
                      pieces.length === 1 ? "piece" : "pieces"
                    } could use your hands today.`
                  : `Nothing pressing across ${pieces.length} ${
                      pieces.length === 1 ? "piece" : "pieces"
                    } — reasons below.`}
              </p>
            ) : null}
          </div>
        </div>

        {!ready ? null : pieces.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground text-pretty">
              No pieces logged yet. The Today view reasons about each piece you add —
              wall thickness, studio conditions, and how long it has been sitting.
            </p>
            <Link
              href="/log"
              className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#A9702F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Log your first piece
            </Link>
          </div>
        ) : reasoningError ? (
          <div className="rounded-lg border border-clay/30 bg-clay/10 p-6 text-center">
            <p className="text-sm text-clay text-pretty">{reasoningError}</p>
          </div>
        ) : assessments.length === 0 ? null : (
          <div className="flex flex-col gap-6">
            <StudioPipeline pieces={pieces} assessments={assessments} today={today} />
            <TodayList pieces={pieces} assessments={assessments} today={today} />
          </div>
        )}
      </main>
    </div>
  )
}
