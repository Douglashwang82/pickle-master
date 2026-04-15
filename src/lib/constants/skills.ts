// Skill level definitions shared by club profiles, player profiles, and filter UI.
// Values match the check constraint in the database.

export const SKILL_LEVELS = [
  { value: 'beginner',     label: '初級', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: '中級', color: 'bg-blue-100 text-blue-800' },
  { value: 'advanced',     label: '高級', color: 'bg-orange-100 text-orange-800' },
  { value: 'pro',          label: '職業', color: 'bg-red-100 text-red-800' },
] as const;

export type SkillLevelValue = typeof SKILL_LEVELS[number]['value'];

export function getSkillLabel(value: string): string {
  return SKILL_LEVELS.find((s) => s.value === value)?.label ?? value;
}

export function getSkillColor(value: string): string {
  return SKILL_LEVELS.find((s) => s.value === value)?.color ?? 'bg-secondary text-secondary-foreground';
}
