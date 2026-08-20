import "server-only"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { daysBetween, type Piece, type Priority } from "./stages"

export type { Priority }

export type Assessment = {
  pieceId: number
  priority: Priority
  reason: string
  question: string | null
  checkBackIn: string | null
  estimatedWindowDays: number | null
}

const assessmentSchema = z.object({
  assessments: z.array(
    z.object({
      pieceId: z.number().describe("The id of the piece being assessed."),
      priority: z
        .enum(["urgent", "soon", "no-rush", "need-info"])
        .describe(
          "urgent = needs attention today; soon = act in the next day or two; no-rush = fine to leave as-is; need-info = not enough information to judge, so a clarifying question is required. This is the ONLY signal used to choose the status badge shown to the user — the app maps urgent/soon to a fixed, stage-specific action label (e.g. 'Trim today' for Leather-hard/Trimming, 'Fire today' for Bisque Queue), and no-rush/need-info to 'No rush yet' / 'Needs more detail'. Never invent your own badge wording; put all piece-specific nuance in the reason sentence instead.",
        ),
      reason: z
        .string()
        .describe(
          "One sentence of specific, grounded reasoning about THIS piece. Reference the actual situation (wall thickness, conditions, days elapsed). Never a generic status label.",
        ),
      question: z
        .string()
        .nullable()
        .describe("A single clarifying question. Required when priority is need-info, otherwise null."),
      checkBackIn: z
        .string()
        .nullable()
        .describe(
          'A short phrase estimating when this piece will next need attention, e.g. "in about 2 days", "by Friday", "in 4-5 days". Required when priority is "no-rush", reasoned from the same inputs as the rest of the assessment. Null for every other priority.',
        ),
      estimatedWindowDays: z
        .number()
        .nullable()
        .describe(
          'Only for pieces currently in "Greenware/Drying" or "Leather-hard/Trimming": your best estimate of the TOTAL number of days this piece can safely stay in its current stage before it dries too far (cracks, or hardens past the trimming window), counting from when it entered the stage. Reason from wall thickness, studio conditions, clay body, and forming method, the same way you reason about urgency. Null for every other stage, and null if you cannot estimate it (e.g. wall thickness unknown).',
        ),
    }),
  ),
})

const SYSTEM_PROMPT = `You are an experienced pottery studio assistant. Your job is to look at each piece a potter has logged and decide what actually needs attention TODAY, reasoning from ceramics knowledge about that specific piece's situation.

How clay behaves (reason from this, do not apply fixed timers):
- Greenware/Drying: wet clay must dry slowly and evenly or it cracks/warps. Thin walls, handles, and attachments dry faster and are the first to crack. Warm, dry, breezy, or sunny studios accelerate drying; humid or damp conditions slow it dramatically. Uneven drying (e.g. rim vs. base) is the real risk.
- Leather-hard/Trimming: this is the only window to trim feet and refine the form. Once a piece dries past leather-hard it is too hard and brittle to trim. Thin walls and warm/dry conditions shorten the window sharply; humidity or being wrapped in plastic extends it. This is the most time-sensitive stage.
- Bisque Queue: pieces just wait to be loaded. The only real hazard is loading a piece that is not bone-dry (trapped moisture makes it explode in the kiln). Otherwise there is no per-piece urgency.
- Glaze-fire Queue: pieces wait for kiln space. Rarely time-sensitive on their own.
- Clay body matters: porcelain is the least forgiving — thin, prone to cracking and warping, with the narrowest drying and trimming windows. Earthenware is generally the most forgiving and dries more predictably. Stoneware sits in between. "Other" bodies should be reasoned about conservatively, similar to stoneware, unless the note says otherwise.
- Forming method matters: hand-built pieces are far more prone to uneven wall thickness (seams, coils, slab joins) than wheel-thrown pieces, which tend to dry and trim more evenly. Weight that unevenness risk higher for hand-built work.

Every piece is logged with four explicit fields: wall thickness (in inches, may be unknown), studio conditions, clay body, and forming method. Reason from these directly and combine them with ceramics knowledge above — e.g. a 0.125in porcelain piece in a dry studio needs a very different read than a 0.5in stoneware piece in a humid one. When wall thickness is given, reference the actual measurement in your reasoning rather than a vague descriptor.

Rules:
- Reason about the SPECIFIC piece: use its stage, how many days it has sat in that stage, wall thickness, studio conditions, clay body, forming method, and any note.
- NEVER invent urgency. If a piece is genuinely fine to leave, say so plainly ("no rush yet") with a real reason. Do not manufacture a reason to act.
- NEVER fall back on fixed timers (e.g. "3 days means trim"). Reason qualitatively from the conditions.
- Studio conditions, clay body, and forming method are always given — never ask a clarifying question about those three.
- Wall thickness may be unknown. If it is unknown AND it would materially change the assessment (e.g. a time-sensitive stage like Leather-hard/Trimming or Greenware/Drying, where thin vs. thick changes the read), set priority to "need-info" and ask for it specifically. If the stage isn't thickness-sensitive (e.g. Bisque/Glaze-fire Queue) or the rest of the situation is unambiguous, don't ask — reason with what you have.
- Reserve "need-info" otherwise for gaps outside these fields: an ambiguous or contradictory note, or a detail the note references but doesn't explain.
- If the note describes damage or a condition with more than one reasonable response — a crack (mend it or scrap it?), a loose handle (reattach it or leave it?), a warp (still usable or not?) — set priority to "need-info" and ask specifically about its severity, so the potter can make that call. This applies regardless of how minor or severe the wording sounds ("hairline crack" is exactly as much a fork as "2 inch crack"): what matters is whether a genuine fork in the response exists, not the size or phrasing of the damage. Don't ask about a condition that has only one reasonable response — e.g. "uneven wall thickness" has no real fork, it just means watch it closely — reason about those directly instead.
- Keep the reason to a single, natural sentence that a potter would find genuinely useful.
- When priority is "no-rush", also fill in checkBackIn: reason about it exactly the way you reason about urgency — from the stage, wall thickness, studio conditions, clay body, forming method, and days already elapsed — to estimate when the piece will plausibly need a look again (e.g. when it's likely to reach leather-hard, or dry enough to move on). Give a short, natural phrase like "in about 2 days" or "by Friday", grounded in that specific piece's conditions, never a generic guess. For every other priority, leave checkBackIn null.
- For every piece currently in "Greenware/Drying" or "Leather-hard/Trimming", also fill in estimatedWindowDays: your best estimate of the total safe days in that stage before it's too late, reasoned the same way as checkBackIn. Leave it null for Bisque Queue and Glaze-fire Queue, and null if you genuinely can't estimate it.`

export async function assessPieces(pieces: Piece[], today: string): Promise<Assessment[]> {
  if (pieces.length === 0) return []

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set")
  }

  const google = createGoogleGenerativeAI({ apiKey })

  const lines = pieces.map((p) => {
    const days = daysBetween(p.stageSince, today)
    const dayLabel = days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`
    const thicknessLabel = p.wallThickness == null ? "unknown" : `${p.wallThickness}in`
    return `- id ${p.id}: "${p.name}" | stage: ${p.stage} | entered this stage ${dayLabel} (${p.stageSince}) | wall thickness: ${thicknessLabel} | studio conditions: ${p.studioConditions} | clay body: ${p.clayBody} | forming method: ${p.formingMethod} | note: ${
      p.note?.trim() ? p.note.trim() : "(none)"
    }`
  })

  const { object } = await generateObject({
    model: google("gemini-3.5-flash-lite"),
    schema: assessmentSchema,
    system: SYSTEM_PROMPT,
    prompt: `Today is ${today}. Assess each of these pieces and return one assessment per piece (matching pieceId). Order does not matter; I will sort by priority.

Pieces:
${lines.join("\n")}`,
  })

  return object.assessments
}
