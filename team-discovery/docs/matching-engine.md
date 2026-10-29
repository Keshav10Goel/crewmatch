# Matching engine

## Baseline

The deterministic baseline in `src/lib/matching.ts` uses profile and opportunity fields only. It does not call an external AI API.

Person-to-person starting weights:
- Skill complementarity: 30%
- Shared interests: 20%
- Goal and collaboration preference compatibility: 15%
- Availability overlap: 15%
- Role fit: 10%
- Project duration compatibility: 10%

Only known components contribute to the weighted average. This avoids treating missing fields as negative evidence. Skill normalization includes a small alias map (for example, `JS` → `JavaScript`, `ML` → `Machine Learning`); aliases do not imply that related technologies are interchangeable.

For project matching, the initial weights are 40% required skills, 10% preferred skills, 25% role fit, 15% category interest, and 10% availability.

## Limitations

- Scores are heuristic rankings, not compatibility probabilities.
- Profile values are self-reported.
- No learned ranking model is trained or implied.
- Weight changes should be evaluated against actual user outcomes before being treated as improvements.
