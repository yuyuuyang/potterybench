import {
  STAGES,
  STUDIO_CONDITIONS_OPTIONS,
  DEFAULT_STUDIO_CONDITIONS,
  CLAY_BODY_OPTIONS,
  DEFAULT_CLAY_BODY,
  FORMING_METHOD_OPTIONS,
  DEFAULT_FORMING_METHOD,
  type Piece,
} from "@/lib/stages"

export const fieldLabel = "block text-sm font-medium text-foreground"
export const fieldBox =
  "mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

type PieceFormFieldsProps = {
  piece?: Piece
  today: string
  idPrefix?: string
}

export function PieceFormFields({ piece, today, idPrefix = "" }: PieceFormFieldsProps) {
  const nameId = `${idPrefix}name`
  const stageId = `${idPrefix}stage`
  const stageSinceId = `${idPrefix}stageSince`
  const wallThicknessId = `${idPrefix}wallThickness`
  const studioConditionsId = `${idPrefix}studioConditions`
  const clayBodyId = `${idPrefix}clayBody`
  const formingMethodId = `${idPrefix}formingMethod`
  const noteId = `${idPrefix}note`

  return (
    <>
      <div>
        <label htmlFor={nameId} className={fieldLabel}>
          Piece
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          autoComplete="off"
          defaultValue={piece?.name ?? ""}
          placeholder="e.g. Wide serving bowl, thin walls"
          className={fieldBox}
        />
      </div>

      <div>
        <label htmlFor={stageId} className={fieldLabel}>
          Current stage
        </label>
        <select
          id={stageId}
          name="stage"
          defaultValue={piece?.stage ?? STAGES[1]}
          className={fieldBox}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={stageSinceId} className={fieldLabel}>
          Entered this stage on
        </label>
        <input
          id={stageSinceId}
          name="stageSince"
          type="date"
          required
          defaultValue={piece?.stageSince ?? today}
          max={today}
          className={fieldBox}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={wallThicknessId} className={fieldLabel}>
            Wall thickness <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <div className="relative mt-1.5">
            <input
              id={wallThicknessId}
              name="wallThickness"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              defaultValue={piece?.wallThickness ?? ""}
              placeholder="e.g. 0.125"
              className={`${fieldBox} mt-0 pr-9`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              in
            </span>
          </div>
        </div>

        <div>
          <label htmlFor={studioConditionsId} className={fieldLabel}>
            Studio conditions <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id={studioConditionsId}
            name="studioConditions"
            defaultValue={piece?.studioConditions ?? DEFAULT_STUDIO_CONDITIONS}
            className={fieldBox}
          >
            {STUDIO_CONDITIONS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={clayBodyId} className={fieldLabel}>
            Clay body <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id={clayBodyId}
            name="clayBody"
            defaultValue={piece?.clayBody ?? DEFAULT_CLAY_BODY}
            className={fieldBox}
          >
            {CLAY_BODY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={formingMethodId} className={fieldLabel}>
            Forming method <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id={formingMethodId}
            name="formingMethod"
            defaultValue={piece?.formingMethod ?? DEFAULT_FORMING_METHOD}
            className={fieldBox}
          >
            {FORMING_METHOD_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={noteId} className={fieldLabel}>
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id={noteId}
          name="note"
          rows={3}
          defaultValue={piece?.note ?? ""}
          placeholder="Anything else worth mentioning — e.g. “hairline crack near the rim”, “testing a new glaze”, “unusual asymmetric shape”"
          className={`${fieldBox} resize-none leading-relaxed`}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground text-pretty">
          Wall thickness and conditions are already covered above — use this for anything
          else the tool should know. If there isn&apos;t enough to judge, Today will ask
          you a question instead of guessing.
        </p>
      </div>
    </>
  )
}
