const PIECE_ICON_RENDERERS = {
  bowl: (size: number) => (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} aria-hidden="true">
      <path d="M7 7 Q7 19 12 20 Q17 19 17 7" stroke="#A9702F" strokeWidth="1.4" fill="#F0E4D4" />
      <ellipse cx="12" cy="7" rx="5" ry="1.8" stroke="#A9702F" strokeWidth="1.4" fill="#FFFDF9" />
    </svg>
  ),
  mug: (size: number) => (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} aria-hidden="true">
      <path d="M6 9 Q6 18 12 19 Q18 18 18 9" stroke="#A9702F" strokeWidth="1.4" fill="#F0E4D4" />
      <ellipse cx="12" cy="9" rx="6" ry="2" stroke="#A9702F" strokeWidth="1.4" fill="#FFFDF9" />
      <path d="M18 11 Q21 12 20 15" stroke="#A9702F" strokeWidth="1.4" fill="none" />
    </svg>
  ),
  vase: (size: number) => (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} aria-hidden="true">
      <path
        d="M8 4 L8 10 Q6 12 6 15 Q6 19 12 20 Q18 19 18 15 Q18 12 16 10 L16 4"
        stroke="#A9702F"
        strokeWidth="1.4"
        fill="#F0E4D4"
      />
      <ellipse cx="12" cy="4" rx="4" ry="1.4" stroke="#A9702F" strokeWidth="1.4" fill="#FFFDF9" />
    </svg>
  ),
  platter: (size: number) => (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} aria-hidden="true">
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="#A9702F" strokeWidth="1.4" fill="#F0E4D4" />
      <ellipse cx="12" cy="11" rx="6" ry="2.3" stroke="#A9702F" strokeWidth="1.2" fill="#FFFDF9" />
    </svg>
  ),
} as const

export type PieceIconKey = keyof typeof PIECE_ICON_RENDERERS

export function pieceIconKey(name: string): PieceIconKey {
  const n = name.toLowerCase()
  if (n.includes("mug") || n.includes("cup")) return "mug"
  if (n.includes("vase")) return "vase"
  if (n.includes("platter") || n.includes("plate")) return "platter"
  return "bowl"
}

export function PieceIcon({ name, size = 18 }: { name: string; size?: number }) {
  return PIECE_ICON_RENDERERS[pieceIconKey(name)](size)
}
