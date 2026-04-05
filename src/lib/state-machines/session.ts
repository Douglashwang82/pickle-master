import type { SessionStatus } from "@/types/domain";

const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  draft: ["published", "cancelled"],
  published: ["full", "cancelled", "completed", "auto_closed"],
  full: ["published", "cancelled", "completed", "auto_closed"],
  cancelled: [],
  completed: [],
  auto_closed: [],
};

export function canSessionTransition(from: SessionStatus, to: SessionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Determines the correct session status after a registration is confirmed or cancelled.
 * @param current - current session status
 * @param confirmedCount - number of confirmed registrations AFTER this change
 * @param capacity - session capacity
 */
export function sessionStatusAfterRegistration(
  current: SessionStatus,
  confirmedCount: number,
  capacity: number
): SessionStatus {
  if (current === "cancelled" || current === "completed" || current === "auto_closed") {
    return current;
  }
  if (confirmedCount >= capacity) return "full";
  if (current === "full") return "published";
  return current;
}
