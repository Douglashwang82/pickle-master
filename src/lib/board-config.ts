export const BOARD_POST_KINDS = ["announcement", "note"] as const;
export const BOARD_POST_STATUSES = [
  "pending_review",
  "published",
  "rejected",
  "archived",
] as const;
export const BOARD_POST_IMPORTANCE_LEVELS = ["normal", "important"] as const;
export const BOARD_REACTION_EMOJIS = ["👍", "🎉", "👏", "🔥"] as const;

export const BOARD_REACTION_LABELS: Record<(typeof BOARD_REACTION_EMOJIS)[number], string> = {
  "👍": "Like",
  "🎉": "Celebrate",
  "👏": "Clap",
  "🔥": "Fire",
};