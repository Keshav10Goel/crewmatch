import { describe, expect, it } from "vitest";
import { calculateCompatibility, calculateOpportunityFit, normalizeSkill } from "../../src/lib/matching";

describe("skill normalization", () => {
  it("normalizes known aliases without merging unrelated skills", () => {
    expect(normalizeSkill("JS")).toBe("javascript");
    expect(normalizeSkill("React.js")).toBe("react");
    expect(normalizeSkill("Java")).toBe("java");
  });
});

describe("baseline matching", () => {
  it("returns an explainable normalized score", () => {
    const user = { id: "a", skills: ["React", "TypeScript"], interests: ["Hackathons"], goals: ["Learning"], availability_hours: 8, looking_for: ["Frontend developer"] };
    const candidate = { id: "b", skills: ["React", "Python"], interests: ["Hackathons"], goals: ["Learning"], availability_hours: 10, looking_for: ["ML engineer"] };
    const result = calculateCompatibility(user, candidate);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components).toHaveProperty("skillComplementarity");
    expect(Array.isArray(result.reasons)).toBe(true);
  });

  it("does not penalize missing fields as negative signals", () => {
    const result = calculateCompatibility({ id: "a" }, { id: "b" });
    expect(result.score).toBe(0);
    expect(result.unknowns.length).toBeGreaterThan(0);
  });

  it("ranks candidates with required skills for an opportunity", () => {
    const fit = calculateOpportunityFit({ id: "a", skills: ["Python", "Machine Learning"], looking_for: ["ML engineer"], interests: ["AI/ML"], availability_hours: 6 }, { required_skills: ["Python", "ML"], open_roles: ["ML engineer"], category: "AI/ML", weekly_hours: 6 });
    expect(fit.score).toBeGreaterThan(50);
    expect(fit.reasons.length).toBeGreaterThan(0);
  });
});
