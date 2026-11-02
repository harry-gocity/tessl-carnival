---
name: review-carnival-house-rules
description: Review a change to a carnival game for house rules 1 to 3 in AGENTS.md, that every game registers on the midway, reports scores through recordScore from src/carnival, and draws with theme and canvasFont. Use as one lens in a code review run.
---

# Review lens: Carnival House Rules

Review changes to the games under `src/games/` for whether each game still fits the carnival it lives in: its booth on the midway, the shared score table, and the shared look.

## Scope

- **Registration** Whether a game can be found by the midway: it lives in `src/games/<game-id>/`, its `game.ts` has its `CarnivalGame` as the default export, and its `id` matches its folder name.
- **Scores** Whether a round's result reaches the shared table: the game calls `recordScore(game.id, score)` from `src/carnival` once, when a round ends, and never reads or writes local storage itself or keeps its own high score table.
- **Theme** Whether the game looks like the rest of the carnival: colours, fonts and sizes come from `theme` and `canvasFont` in `src/carnival/theme.ts`, not from hex colours, `rgb()` values or font strings written inside the game.

## Method

Read house rules 1 to 3 in the root `AGENTS.md` first; they are the standard this lens applies.

Start at each changed `game.ts` and follow what it draws, scores and exports. For a score, trace from where a round ends to the `recordScore` call, and check it runs once per round rather than on every frame, every hit, or never. For drawing, read each value assigned to `fillStyle`, `strokeStyle`, `font` and similar canvas properties back to where it comes from. For local storage, look for `localStorage`, `sessionStorage` or a score list the game keeps between rounds.

## Threshold

Report a change that breaks one of these rules in a game under `src/games/`, and state what it costs:

- A score that never reaches `recordScore`, or reaches it more than once per round, leaves the midway's best scores wrong for that game.
- A game that keeps its own scores in storage splits the carnival's score table in two.
- A hard-coded colour or font string will not follow the theme when the theme changes, and can clash with the rest of the carnival.
- A `game.ts` without a default export, or with an `id` that differs from its folder name, makes `src/games/index.ts` throw when the midway loads, so no game opens; `src/games/index.test.ts` fails on both. Report it, but say that the tests already catch it rather than describing it as a hidden break.

Do not report:

- Code outside `src/games/`. `src/carnival/` defines the theme and the scores, and `src/midway/palette.ts` has its own scenery colours.
- A value derived from the theme, such as a colour or size computed from `theme`, or a `canvasFont` result.
- Test data in `game.test.ts`, such as a colour or score written into a test.
- Anything lint, the type-checker or the tests already enforce, such as the shape of a `CarnivalGame` or a kebab-case id.
- Rules 4 to 7 in `AGENTS.md`; the other lenses and the pull request's own review cover them.

## Reporting

- Name the rule the change breaks, the file and line, and what the player or the next change to the carnival will see because of it.
- State the fix in the carnival's terms: the `theme` key or `canvasFont` call to use, where the single `recordScore` call belongs, or the export or `id` to change.
