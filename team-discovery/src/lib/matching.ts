export type MatchProfile = {
  id: string;
  skills?: string[] | null;
  interests?: string[] | null;
  goals?: string[] | null;
  collaboration_preferences?: string[] | null;
  availability_hours?: number | null;
  experience_level?: string | null;
  preferred_duration?: string | null;
  looking_for?: string[] | null;
  headline?: string | null;
};

export type MatchContext = {
  requiredSkills?: string[];
  existingTeamSkills?: string[];
  openRoles?: string[];
  category?: string;
  weeklyHours?: number | null;
  duration?: string | null;
  goals?: string[];
};

export type MatchResult = {
  score: number;
  components: Record<string, number | null>;
  reasons: string[];
  unknowns: string[];
  suggestedRoles: string[];
};

const aliases: Record<string, string> = {
  "js": "javascript", "react.js": "react", "reactjs": "react",
  "next.js": "nextjs", "node": "node.js", "ml": "machine learning",
  "ai": "artificial intelligence", "ui ux": "ui/ux", "figma design": "figma",
  "postgres": "postgresql", "mongo": "mongodb", "ts": "typescript"
};
export function normalizeSkill(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return aliases[normalized] ?? normalized;
}
function overlap(a: string[] = [], b: string[] = []): number | null {
  if (!a.length || !b.length) return null;
  const left = new Set(a.map(normalizeSkill));
  const right = new Set(b.map(normalizeSkill));
  return left.size ? [...left].filter(x => right.has(x)).length / left.size : null;
}
function averageKnown(parts: Array<[number | null, number]>): number {
  const valid = parts.filter((x): x is [number, number] => x[0] !== null);
  if (!valid.length) return 0;
  const totalWeight = valid.reduce((s, [, w]) => s + w, 0);
  return valid.reduce((s, [v, w]) => s + v * w, 0) / totalWeight;
}

/** Explainable baseline. Scores are heuristics, not measured probabilities of success. */
export function calculateCompatibility(
  user: MatchProfile,
  candidate: MatchProfile,
  context: MatchContext = {}
): MatchResult {
  const userSkills = user.skills ?? [];
  const candidateSkills = candidate.skills ?? [];
  const skillGap = context.requiredSkills?.length
    ? overlap(context.requiredSkills.filter(s => !(context.existingTeamSkills ?? []).map(normalizeSkill).includes(normalizeSkill(s))), candidateSkills)
    : overlap(userSkills, candidateSkills);
  const sharedInterests = overlap(user.interests ?? [], candidate.interests ?? []);
  const sharedGoals = overlap(user.goals ?? [], candidate.goals ?? []);
  const sharedPrefs = overlap(user.collaboration_preferences ?? [], candidate.collaboration_preferences ?? []);
  const availability = user.availability_hours != null && candidate.availability_hours != null
    ? Math.max(0, 1 - Math.abs(user.availability_hours - candidate.availability_hours) / Math.max(user.availability_hours, candidate.availability_hours, 1))
    : null;
  const duration = context.duration && candidate.preferred_duration
    ? (normalizeSkill(context.duration) === normalizeSkill(candidate.preferred_duration) ? 1 : 0.35)
    : null;
  const roleFit = context.openRoles?.length && candidate.looking_for?.length
    ? overlap(context.openRoles, candidate.looking_for)
    : null;

  const components = {
    skillComplementarity: skillGap,
    sharedInterests,
    goalCompatibility: sharedGoals,
    collaborationPreferences: sharedPrefs,
    availabilityOverlap: availability,
    roleFit,
    durationCompatibility: duration
  };
  const score = Math.round(100 * averageKnown([
    [skillGap, 0.30], [sharedInterests, 0.20],
    [sharedGoals === null && sharedPrefs === null ? null : averageKnown([[sharedGoals, 0.6], [sharedPrefs, 0.4]]), 0.15],
    [availability, 0.15], [roleFit, 0.10], [duration, 0.10]
  ]));
  const reasons: string[] = [];
  if (skillGap !== null && skillGap >= 0.25) reasons.push(context.requiredSkills?.length ? "Their skills can cover a project skill gap." : "You share relevant technical skills.");
  if (sharedInterests !== null && sharedInterests > 0) reasons.push("You share interests.");
  if (sharedGoals !== null && sharedGoals > 0) reasons.push("Your stated goals overlap.");
  if (availability !== null && availability >= 0.7) reasons.push("Your weekly availability is similar.");
  if (roleFit !== null && roleFit > 0) reasons.push("Their preferred role fits an open team role.");
  if (duration === 1) reasons.push("Your preferred project duration matches.");
  const unknowns = Object.entries(components).filter(([, v]) => v === null).map(([k]) => k);
  const candidateSet = new Set(candidateSkills.map(normalizeSkill));
  const suggestedRoles = (context.openRoles ?? []).filter(role => {
    const required = context.requiredSkills ?? [];
    return required.some(skill => candidateSet.has(normalizeSkill(skill))) && normalizeSkill(role) !== normalizeSkill(user.headline ?? "");
  }).slice(0, 3);
  return { score, components, reasons: reasons.slice(0, 3), unknowns, suggestedRoles };
}

export function calculateOpportunityFit(
  user: MatchProfile,
  opportunity: { required_skills?: string[]; preferred_skills?: string[]; open_roles?: string[]; weekly_hours?: number | null; category?: string; goals?: string[] }
): MatchResult {
  const skills = user.skills ?? [];
  const required = overlap(opportunity.required_skills ?? [], skills);
  const preferred = overlap(opportunity.preferred_skills ?? [], skills);
  const role = overlap(opportunity.open_roles ?? [], user.looking_for ?? []);
  const interests = overlap([opportunity.category ?? ""].filter(Boolean), user.interests ?? []);
  const availability = user.availability_hours != null && opportunity.weekly_hours != null
    ? Math.max(0, 1 - Math.abs(user.availability_hours - opportunity.weekly_hours) / Math.max(user.availability_hours, opportunity.weekly_hours, 1))
    : null;
  const score = Math.round(100 * averageKnown([[required, 0.40], [preferred, 0.10], [role, 0.25], [interests, 0.15], [availability, 0.10]]));
  const reasons = [];
  if (required !== null && required > 0) reasons.push("Your skills cover some required skills.");
  if (role !== null && role > 0) reasons.push("An open role matches your stated preferences.");
  if (interests !== null && interests > 0) reasons.push("The project category matches your interests.");
  if (availability !== null && availability >= 0.7) reasons.push("The weekly commitment is close to your availability.");
  return {
    score,
    components: { requiredSkills: required, preferredSkills: preferred, roleFit: role, categoryInterest: interests, availabilityOverlap: availability },
    reasons: reasons.slice(0, 3),
    unknowns: Object.entries({ required, preferred, role, interests, availability }).filter(([, v]) => v === null).map(([k]) => k),
    suggestedRoles: (opportunity.open_roles ?? []).filter(r => (user.looking_for ?? []).map(normalizeSkill).includes(normalizeSkill(r))).slice(0, 3)
  };
}
